import { edge } from '../edge/serializable';
import { type Edge } from '../edge/type';
import { CLEANUP_ARRAY_EXECUTED } from '../step/constants';
import {
  type BuildArgs,
  type CleanupFn,
  type CleanupFnArray,
  type DependencyList,
  type StepAPI,
  type StepCreatorAny,
  type StepInstance,
  type TransitionHook,
} from '../step/types';
import { _ASSERT } from '../utils';
import { type WorkflowContext } from './context';
import { processEffects, type EffectDef } from './effects';
import { type CurrentStepStatus, type WorkflowAPI } from './types';
import { handleAsyncError, isPromise, runOutCleanupOnBack, safeInvokeCleanup } from './utils';
import { validateInventory } from './validators';

const noop = () => void 0;

function computeCanGoBack(
  currentStepInstance: StepInstance<any, any, any, any, any>,
  edges: Edge<any, any>[],
  history: Array<{ node: StepInstance<any, any, any, any, any> }>,
) {
  const prev = history[history.length - 1];
  const connecting = prev ? edges.find((e) => e.from === prev.node && e.to === currentStepInstance) : undefined;
  return !!prev && (!connecting || !connecting.unidirectional);
}

/**
 * Shared transition logic for the next() callback.
 * Handles output validation, edge selection, and state transitions.
 */
function executeNextTransition<Output>(
  node: StepInstance<any, Output, any, any, any>,
  nodeInput: unknown,
  output: Output,
  edges: Edge<any, any>[],
  history: Array<{ node: StepInstance<any, any, any, any, any>; input: unknown; outCleanupOnBack: CleanupFn[] }>,
  runExitSequence: () => CleanupFnArray,
  finish: (output: any) => void,
  transitionInto: (
    node: StepInstance<any, any, any, any, any>,
    input: any,
    isBack: boolean,
    backCleanups: CleanupFn[],
  ) => void,
) {
  const validatedOutput = node.outputSchema ? node.outputSchema.parse(output) : undefined;
  const outgoing = edges.filter((e) => e.from === node);

  // If there are no outgoing edges, end the workflow
  if (outgoing.length === 0) {
    runExitSequence();
    finish(output);
    return;
  }

  // Try each outgoing edge and pick the first that allows transition
  let selectedEdge: Edge<any, any> | undefined;
  let nextInput: unknown = undefined;
  for (const e of outgoing) {
    const res = e.validateTransition(validatedOutput);
    if (res.allow) {
      selectedEdge = e;
      nextInput = res.nextInput;
      break;
    }
  }

  if (!selectedEdge) {
    runExitSequence();
    throw new Error('Transition blocked by edge condition');
  }

  const nextNode = selectedEdge.to;
  if (nextNode.inputSchema) {
    nextInput = nextNode.inputSchema.parse(nextInput);
  }

  const prevOutCleanups = runExitSequence();
  if (!node.options?.noHistory) {
    history.push({ node, input: nodeInput, outCleanupOnBack: prevOutCleanups });
  }

  transitionInto(nextNode, nextInput, false, []);
}

export function workflow<const Creators extends readonly StepCreatorAny[]>(inventory: Creators): WorkflowAPI<Creators> {
  // #region No need to be serialized for time-traveling
  const stepInventoryMap: Map<string, StepCreatorAny> = new Map();
  const nodes = new Set<StepInstance<any, any, any, any, any>>();
  const edges: Edge<any, any>[] = [];
  const subscribers = new Set<(currentStep: CurrentStepStatus<Creators>, isWorkflowRunning: boolean) => void>();
  const finishSubscribers = new Set<(output: any) => void>();
  const history: Array<{
    node: StepInstance<any, any, any, any, any>;
    input: unknown;
    // transitionOut cleanups to be executed when user navigates back to this step
    outCleanupOnBack: CleanupFn[];
  }> = [];
  let context: WorkflowContext | undefined;
  let contextVersionCounter = 0;
  let isWorkflowRunning = false;
  //#endregion

  // #region States, need to be serialized for time-traveling
  let currentStep: CurrentStepStatus<Creators> | undefined;
  // #endregion

  // Validate duplicate kinds with detailed error information
  validateInventory(inventory);

  for (const creator of inventory) {
    stepInventoryMap.set(creator.kind, creator);
  }

  Object.freeze(inventory);

  const subscribe = (handler: (currentStep: CurrentStepStatus<Creators>, isWorkflowRunning: boolean) => void) => {
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  };

  const onFinish = (handler: (output: any) => void) => {
    finishSubscribers.add(handler);
    return () => {
      finishSubscribers.delete(handler);
    };
  };

  const notify = (currentStep: CurrentStepStatus<Creators>) => {
    for (const cb of subscribers) {
      cb(currentStep, isWorkflowRunning);
    }
  };

  const setCurrentStep = (currentStepStatus: CurrentStepStatus<Creators>) => {
    currentStep = currentStepStatus;
    notify(currentStep);
  };

  const runTransitionInOnce = () => {
    if (!context || context.hasRunIn) {
      return;
    }
    if (!isWorkflowRunning) {
      return;
    }
    context.inCleanups = [];
    const version = context.version;
    for (let i = 0; i < context.inHooks.length; i++) {
      const hook = context.inHooks[i];
      const result = hook();
      if (typeof result === 'function') {
        context.inCleanups.push(result);
      } else if (isPromise<CleanupFn>(result)) {
        result
          .then((cleanup) => {
            if (typeof cleanup !== 'function') {
              return;
            }
            // If context is still current, register; otherwise, invoke immediately
            if (context && context.version === version) {
              context.inCleanups.push(cleanup);
            } else {
              safeInvokeCleanup(cleanup);
            }
          })
          .catch((err) => {
            handleAsyncError(err, 'transitionIn', i);
          });
      }
    }
    context.hasRunIn = true;
  };

  // Exit sequence: run transitionOut hooks (once, before exit), collect their cleanups to run when coming back.
  // Also run effect cleanups and transitionIn cleanups immediately.
  const runExitSequence = (): CleanupFnArray => {
    const outCleanupsForBack: CleanupFnArray = [];
    // mark as not yet executed; used to flush late async cleanups
    outCleanupsForBack[CLEANUP_ARRAY_EXECUTED] = false;
    if (currentStep) {
      _ASSERT(
        currentStep.status === 'ready' || currentStep.status === 'transitionIn',
        'currentStep.status must be ready or transitionIn',
      );
      setCurrentStep({
        ...currentStep,
        status: 'transitionOut',
        canGoBack: false,
      });
    }
    if (context) {
      if (isWorkflowRunning) {
        for (let i = 0; i < context.outHooks.length; i++) {
          const hook = context.outHooks[i];
          const result = hook();
          if (typeof result === 'function') {
            outCleanupsForBack.push(result);
          } else if (isPromise<CleanupFn>(result)) {
            result
              .then((cleanup) => {
                if (typeof cleanup !== 'function') {
                  return;
                }
                // If back has already executed for this array, invoke immediately; else collect
                const executed = outCleanupsForBack[CLEANUP_ARRAY_EXECUTED] === true;
                if (executed) {
                  safeInvokeCleanup(cleanup);
                } else {
                  outCleanupsForBack.push(cleanup);
                }
              })
              .catch((err) => handleAsyncError(err, 'transitionOut', i));
          }
        }
      }
      for (const eff of context.effects) {
        if (typeof eff.cleanup === 'function') {
          eff.cleanup();
        }
      }
      for (const cleanup of context.inCleanups) {
        safeInvokeCleanup(cleanup);
      }
      context.storeUnsub();
      context = undefined;
    }
    return outCleanupsForBack;
  };

  const rebuildCurrent = () => {
    if (!currentStep) {
      return;
    }
    const node = currentStep.instance;
    const inputForNode = context?.currentInput;

    const inHooks: TransitionHook[] = [];
    const outHooks: TransitionHook[] = [];
    const effectsDefs: EffectDef[] = [];

    const args: BuildArgs<any, any, any, any> = {
      name: node.name,
      transitionIn: (hook) => {
        if (!context?.hasRunIn && isWorkflowRunning) {
          inHooks.push(hook);
        }
      },
      transitionOut: (hook) => {
        if (isWorkflowRunning) {
          outHooks.push(hook);
        }
      },
      effect: (fn, deps) => {
        if (isWorkflowRunning) {
          effectsDefs.push({ run: fn, deps });
        }
      },
      input: inputForNode,
      ...(node.configSchema ? { config: node.config } : {}),
      ...(node.storeApi ? { store: node.storeApi.getState() } : {}),
      next: (output) => {
        executeNextTransition(node, inputForNode, output, edges, history, runExitSequence, finish, transitionInto);
      },
    };
    const api = node.build(args);

    // Update outHooks to latest
    if (!context) {
      context = {
        hasRunIn: true,
        inHooks,
        inCleanups: [],
        outHooks,
        outCleanupOnBack: [],
        effects: [],
        storeUnsub: noop,
        currentInput: inputForNode,
        version: ++contextVersionCounter,
      };
    } else {
      context.outHooks = outHooks;
    }

    // Effect diffing / rerun
    context.effects = processEffects(effectsDefs, context.effects);

    // If effects triggered a transition, the current step has changed.
    // We should not overwrite the new state with the old step's ready state.
    if (currentStep && currentStep.instance !== node) {
      return;
    }

    setCurrentStep({
      status: 'ready',
      kind: currentStep.instance.kind,
      name: currentStep.instance.name,
      id: currentStep.instance.id,
      state: api,
      instance: currentStep.instance,
      canGoBack: computeCanGoBack(currentStep.instance, edges, history),
    });
  };

  const transitionInto = async <Input, Output, Config, Api extends StepAPI, Store>(
    stepInstance: StepInstance<Input, Output, Config, Api, Store>,
    input: Input,
    isBack: boolean,
    backCleanups: CleanupFn[],
  ) => {
    let secondPassRebuildCurrent = false;

    if (isBack) {
      // execute transitionOut cleanups of the step we are returning to
      // even if none are present yet; late async cleanups will flush immediately
      runOutCleanupOnBack(backCleanups);
    }

    const inHooks: TransitionHook[] = [];
    const outHooks: TransitionHook[] = [];
    const effectsDefs: EffectDef[] = [];

    const next = (output: Output) => {
      executeNextTransition(stepInstance, input, output, edges, history, runExitSequence, finish, transitionInto);
    };

    const args: any = {
      name: stepInstance.name,
      transitionIn: (hook: TransitionHook) => {
        if (isWorkflowRunning) {
          inHooks.push(hook);
        }
      },
      transitionOut: (hook: TransitionHook) => {
        if (isWorkflowRunning) {
          outHooks.push(hook);
        }
      },
      effect: (fn: () => CleanupFn, deps?: DependencyList) => {
        if (isWorkflowRunning) {
          effectsDefs.push({ run: fn, deps });
        }
      },
      input,
      ...(stepInstance.configSchema ? { config: stepInstance.config } : {}),
      ...(stepInstance.storeApi ? { store: stepInstance.storeApi.getState() } : {}),
      next,
    };
    const api = stepInstance.build(args);

    // Initialize context for this step
    context = {
      hasRunIn: false,
      inHooks,
      inCleanups: [],
      outHooks,
      outCleanupOnBack: [],
      effects: [],
      storeUnsub: stepInstance.storeApi
        ? stepInstance.storeApi.subscribe(() => {
            secondPassRebuildCurrent = true;
          })
        : noop,
      currentInput: input,
      version: ++contextVersionCounter,
    };

    if (!isWorkflowRunning) {
      setCurrentStep({
        status: 'ready',
        kind: stepInstance.kind,
        name: stepInstance.name,
        instance: stepInstance,
        state: api,
        canGoBack: computeCanGoBack(stepInstance, edges, history),
      } as CurrentStepStatus<Creators>);
      return;
    } else {
      setCurrentStep({
        status: 'transitionIn',
        kind: stepInstance.kind,
        name: stepInstance.name,
        instance: stepInstance,
        state: api,
        canGoBack: false,
      } as CurrentStepStatus<Creators>);
    }

    // Execute transitionIn once
    runTransitionInOnce();

    if (!context) {
      return;
    }

    // Run initial effects (first render)
    const activeEffects = processEffects(effectsDefs);

    if (context) {
      context.effects = activeEffects;
      context.storeUnsub();
      // Subscribe to data layer changes to rebuild on any change
      context.storeUnsub = stepInstance.storeApi
        ? stepInstance.storeApi.subscribe(() => {
            rebuildCurrent();
          })
        : noop;
    }

    // asynchronous transitionIn does not make it advance to next step, so
    // we need to rebuild current step to reflect the new state
    // also assert that current step is still transitionIn
    if (currentStep?.name === stepInstance.name && currentStep.kind === stepInstance.kind) {
      _ASSERT(currentStep?.status === 'transitionIn', 'currentStep.status must be transitionIn.');
      if (secondPassRebuildCurrent) {
        rebuildCurrent();
      } else {
        setCurrentStep({
          ...currentStep,
          status: 'ready',
          canGoBack: computeCanGoBack(currentStep.instance, edges, history),
        });
      }
    }
  };

  const register = (nodesArg: ReturnType<Creators[number]> | readonly ReturnType<Creators[number]>[]) => {
    const list = Array.isArray(nodesArg) ? nodesArg : [nodesArg];
    const allowed = Array.from(stepInventoryMap.keys()).join(', ');
    for (const node of list) {
      if (!stepInventoryMap.has(node.kind)) {
        throw new Error(
          `Cannot register StepInstance kind '${node.kind}'. Not listed in inventory. Allowed kinds: [${allowed}]`,
        );
      }
      nodes.add(node);
    }
    return workflowApis;
  };

  const connect = <SI, SO extends SI, EI, EO>(
    fromOrEdge: StepInstance<any, SO, any, any, any> | Edge<EI, EO>,
    to?: StepInstance<SI, any, any, any, any>,
    unidirectional = false,
  ) => {
    if (to) {
      const from = fromOrEdge as StepInstance<any, SO, any, any, any>;
      if (!nodes.has(from)) {
        throw new Error(
          `Cannot connect from unregistered StepInstance '${from.id}'. Register the instance before connecting.`,
        );
      }
      if (!nodes.has(to)) {
        throw new Error(
          `Cannot connect to unregistered StepInstance '${to.id}'. Register the instance before connecting.`,
        );
      }
      const e = edge(from, to, unidirectional);
      edges.push(e);
    } else {
      const e = fromOrEdge as Edge<EI, EO>;
      if (!nodes.has(e.from)) {
        throw new Error(
          `Cannot connect from unregistered StepInstance '${e.from.id}'. Register the instance before connecting.`,
        );
      }
      if (!nodes.has(e.to)) {
        throw new Error(
          `Cannot connect to unregistered StepInstance '${e.to.id}'. Register the instance before connecting.`,
        );
      }
      edges.push(e);
    }
    return workflowApis;
  };

  const start = <I, O, C, Api extends StepAPI, Store>(node: StepInstance<I, O, C, Api, Store>) => {
    if (!nodes.has(node)) {
      throw new Error(`Cannot start on unregistered StepInstance '${node.id}'. Register the instance before starting.`);
    }
    isWorkflowRunning = true;
    transitionInto(node, undefined as I, false, []);
    return workflowApis;
  };

  const getCurrentStep = (): CurrentStepStatus<Creators> => {
    _ASSERT(currentStep !== undefined, 'currentStep must be defined');
    return currentStep;
  };

  const getCurrentNode = () => {
    _ASSERT(currentStep !== undefined, 'currentStep must be defined');
    return currentStep.instance;
  };

  const getContext = () => {
    return context;
  };

  const getIsWorkflowRunning = () => {
    return isWorkflowRunning;
  };

  const pause = () => {
    if (!isWorkflowRunning) {
      return;
    }
    isWorkflowRunning = false;
    if (context) {
      for (const eff of context.effects) {
        if (typeof eff.cleanup === 'function') {
          eff.cleanup();
        }
      }
      context.storeUnsub();
      // Clear effects to prevent re-running them on resume
      context.effects = [];
      context.storeUnsub = noop;
    }
  };

  const resume = () => {
    if (isWorkflowRunning) {
      return;
    }
    isWorkflowRunning = true;
    if (context && currentStep) {
      context.storeUnsub = currentStep.instance.storeApi
        ? currentStep.instance.storeApi.subscribe(() => {
            rebuildCurrent();
          })
        : noop;
    }
    rebuildCurrent();
  };

  const _internalStop = () => {
    context = undefined;
    currentStep = undefined;
  };

  const stop = () => {
    pause();
    _internalStop();
  };

  const finish = (output: any) => {
    for (const cb of finishSubscribers) {
      cb(output);
    }
    stop();
  };

  const goBack = () => {
    const prev = history.pop();
    if (!prev) {
      return;
    }
    const connecting = edges.find((e) => e.from === prev.node && e.to === currentStep?.instance);
    // Enforce edge reversibility: find the edge previously used to reach current from prev
    if (connecting && connecting.unidirectional) {
      throw new Error(
        `Back navigation is not allowed: edge from '${prev.node.id}' to '${currentStep?.instance?.id}' is unidirectional`,
      );
    }
    // Run exit sequence for the current step (we are leaving it)
    runExitSequence();
    // When backing into prev.node, run its transitionOut cleanup collected at its previous exit
    transitionInto(prev.node, prev.input, true, prev.outCleanupOnBack);
  };

  const workflowApis = {
    register,
    connect,
    getCurrentStep,
    subscribe,
    onFinish,
    goBack,
    start,
    stop,
    pause,
    resume,
    // For Internal Use
    $$INTERNAL: {
      nodes,
      edges,
      history,
      stepInventoryMap,
      getCurrentNode,
      getContext,
      runExitSequence,
      transitionInto,
      setCurrentStep,
      stop: _internalStop,
      isWorkflowRunning: getIsWorkflowRunning,
    },
  };

  return workflowApis;
}
