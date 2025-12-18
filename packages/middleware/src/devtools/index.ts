import { type CleanupFn, type StepCreatorAny, type StepInstance, type WorkflowAPI } from '@motif-ts/core';

import type {} from '@redux-devtools/extension';

export type DevtoolsOptions = {
  name?: string;
};

const findCallerName = (stack: string | undefined) => {
  if (!stack) {
    return undefined;
  }
  const traceLines = stack.split('\n');
  const apiSetStateLineIndex = traceLines.findIndex((traceLine) => traceLine.includes('setState'));
  if (apiSetStateLineIndex < 0) {
    return undefined;
  }
  const callerLine = traceLines[apiSetStateLineIndex + 1]?.trim() || '';
  return /.+ (.+) .+/.exec(callerLine)?.[1];
};

export default function devtoolsMiddleware<const Creators extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<Creators>,
  options: DevtoolsOptions = {},
): WorkflowAPI<Creators> {
  const {
    getCurrentStep,
    subscribeStepChange,
    pause,
    $$INTERNAL: { nodes, transitionInto, getCurrentNode, getContext, history, isWorkflowRunning },
  } = workflow;

  const { name } = options;
  const ext = typeof window !== 'undefined' ? window.__REDUX_DEVTOOLS_EXTENSION__ : undefined;

  if (!ext) {
    // Extension not available: return original workflow unchanged
    return workflow;
  }

  const devtools = ext.connect({ name: name ?? 'motif workflow' });

  type DevtoolsSnapshot = {
    current: {
      status: string;
      kind: string;
      name: string;
      nodeId: string;
      input: unknown;
      state: Record<string, unknown> | undefined;
    };
    history: {
      node: StepInstance<any, any, any, any, any>;
      input: unknown;
      outCleanupOnBack: CleanupFn[];
    }[];
    stores: Record<string, unknown>;
  };

  function recordAndSend(type: string) {
    const state = buildSnapshot();
    if (state) {
      devtools.send({ type }, state);
    }
  }

  function buildSnapshot(): DevtoolsSnapshot | null {
    if (!isWorkflowRunning()) {
      return null;
    }
    const currentNode = getCurrentNode();
    const current = getCurrentStep();
    const context = getContext();
    const stores: Record<string, unknown> = {};
    for (const node of nodes) {
      if (node.storeApi) {
        stores[node.id] = node.storeApi.getState();
      }
    }
    return {
      current: {
        status: current.status,
        kind: currentNode.kind,
        name: currentNode.name,
        nodeId: currentNode.id,
        input: context?.currentInput,
        state: currentNode.storeApi?.getState(),
      },
      history,
      stores,
    };
  }

  function restoreFromSnapshot({
    current: { nodeId: currentNodeId, input: currentInput, state: currentState },
    history: historyToRestore,
  }: DevtoolsSnapshot) {
    const nodesById = new Map(Array.from(nodes).map((n) => [n.id, n] as const));
    const targetNode = nodesById.get(currentNodeId);
    // transition into target node
    if (targetNode) {
      if (currentState && targetNode.storeApi) {
        targetNode.storeApi.setState(currentState);
      }
      history.length = 0;
      history.push(...historyToRestore);
      transitionInto(targetNode, currentInput, false, []);
    }
  }

  // Initialize devtools with first snapshot (safe even when not started)
  devtools.init(buildSnapshot());

  // Monitor connection status and handle time-travel commands
  // @ts-expect-error
  devtools.subscribe((message: any) => {
    if (message.type === 'DISPATCH') {
      const payloadType = message.payload.type;
      switch (payloadType) {
        case 'JUMP_TO_STATE': {
          // state is a stringified snapshot
          const next = message.state;
          if (typeof next === 'string') {
            try {
              const parsed = JSON.parse(next);
              pause(); // Run cleanup before restoring
              restoreFromSnapshot(parsed);
            } catch {
              // ignore invalid state
            }
          }
          break;
        }
        case 'JUMP_TO_ACTION': {
          pause();
          const actionId = message.payload.actionId;
          const computedStates = message.payload.nextLiftedState?.computedStates;
          if (Array.isArray(computedStates) && typeof actionId === 'number') {
            const s = computedStates[actionId]?.state;
            if (s) {
              restoreFromSnapshot(s);
            }
          }
          break;
        }
        case 'COMMIT': {
          devtools.init(buildSnapshot());
          break;
        }
        case 'ROLLBACK': {
          const next = message.state;
          if (typeof next === 'string') {
            const parsed = JSON.parse(next) as DevtoolsSnapshot;
            restoreFromSnapshot(parsed);
          }
          break;
        }
        case 'IMPORT_STATE': {
          const computedStates = message.payload.nextLiftedState.computedStates;
          const idx = message.payload.nextLiftedState.currentStateIndex;
          const s = Array.isArray(computedStates) && typeof idx === 'number' ? computedStates[idx].state : undefined;
          if (s) {
            restoreFromSnapshot(s);
          }
          break;
        }
        default:
          break;
      }
    }
  });

  // Track runtime status changes
  subscribeStepChange((currentStep, isWorkflowRunning) => {
    if (!isWorkflowRunning) {
      return;
    }
    if (currentStep.status === 'transitionIn') {
      recordAndSend(`[${currentStep.kind}]${currentStep.name ? `[${currentStep.name}]` : ''}: Transition In`);
    } else if (currentStep.status === 'transitionOut') {
      recordAndSend(`[${currentStep.kind}]${currentStep.name ? `[${currentStep.name}]` : ''}: Transition Out`);
    } else if (currentStep.status === 'ready') {
      const stack = new Error().stack;
      const callerName = findCallerName(stack);
      recordAndSend(
        `[${currentStep.kind}]${currentStep.name ? `[${currentStep.name}]` : ''}: ${callerName || 'Ready/Update'}`,
      );
    }
  });

  return workflow;
}
