import { type Edge } from '../edge/type';
import {
  type CleanupFn,
  type CleanupFnArray,
  type StepAPI,
  type StepCreatorAny,
  type StepInstance,
} from '../step/types';
import { type WorkflowContext } from './context';

export type TransitionStatus = 'transitionIn' | 'ready' | 'transitionOut';

export type CurrentStepStatus<Creators extends readonly StepCreatorAny[]> = {
  status: TransitionStatus;
  canGoBack: boolean;
} & {
  [K in Creators[number]['kind']]: {
    kind: K;
    name: string;
    state: ReturnType<
      ReturnType<
        Extract<
          Creators[number],
          {
            kind: K;
          }
        >
      >['build']
    >;
    instance: ReturnType<
      Extract<
        Creators[number],
        {
          kind: K;
        }
      >
    >;
  };
}[Creators[number]['kind']];

// ===== Type utilities for terminal node inference =====

/**
 * Helper type to flatten array type to union
 */
type FlattenToUnion<T> = T extends readonly (infer U)[] ? U : T;

/**
 * Extract Output type from a StepInstance
 */
type ExtractOutput<S> = S extends StepInstance<any, infer O, any, any, any> ? O : never;

/**
 * Terminal nodes = Registered nodes that are NOT in FromNodes
 */
type TerminalNodes<
  Registered extends StepInstance<any, any, any, any, any>,
  FromNodes extends StepInstance<any, any, any, any, any>,
> = Exclude<Registered, FromNodes>;

/**
 * Output type of terminal nodes
 * If no terminal nodes exist (FromNodes = never), returns unknown
 */
type TerminalOutput<
  Registered extends StepInstance<any, any, any, any, any>,
  FromNodes extends StepInstance<any, any, any, any, any>,
> = [FromNodes] extends [never] ? unknown : ExtractOutput<TerminalNodes<Registered, FromNodes>>;

// ===== WorkflowAPI with type-level node tracking =====

export interface WorkflowAPI<
  Creators extends readonly StepCreatorAny[],
  Registered extends StepInstance<any, any, any, any, any> = never,
  FromNodes extends StepInstance<any, any, any, any, any> = never,
> {
  /**
   * Register steps to the workflow.
   * @param nodesArg The steps to register.
   */
  register<N extends ReturnType<Creators[number]> | readonly ReturnType<Creators[number]>[]>(
    nodesArg: N,
  ): WorkflowAPI<Creators, Registered | FlattenToUnion<N>, FromNodes>;

  /**
   * Connect two steps together.
   * @param from The step to transition out from.
   * @param to The step to transition into.
   * @param unidirectional Whether the connection is bidirectional or unidirectional. Defaults to bidirectional.
   */
  connect<From extends StepInstance<any, Output, any, any, any>, Output, Input extends Output>(
    from: From,
    to: StepInstance<Input, any, any, any, any>,
    unidirectional?: boolean,
  ): WorkflowAPI<Creators, Registered, FromNodes | From>;

  /**
   * Connect two steps together using an edge.
   * @param edge The edge to connect.
   */
  connect<E extends Edge<any, any>>(edge: E): WorkflowAPI<Creators, Registered, FromNodes | E['from']>;

  /**
   * Start the workflow.
   */
  start<Input, Output, Config, Api extends StepAPI, Store>(
    node: StepInstance<Input, Output, Config, Api, Store>,
  ): WorkflowAPI<Creators, Registered, FromNodes>;

  stop(): void;

  /**
   * Pause the workflow.
   */
  pause(): void;

  /**
   * Resume the workflow.
   */
  resume(): void;

  /**
   * Get the current step.
   */
  getCurrentStep(): CurrentStepStatus<Creators>;

  /**
   * Subscribes to changes in the current step.
   *
   * @param handler - A function that is called whenever the current step changes.
   * @returns A function to unsubscribe.
   */
  subscribeStepChange: (handler: (currentStep: CurrentStepStatus<Creators>, isWorkflowRunning: boolean) => void) => () => void;

  /**
   * Subscribes to the workflow finish event.
   * The output type is inferred from terminal nodes (nodes with no outgoing edges).
   *
   * @param handler - A function that is called when the workflow finishes.
   * @returns A function to unsubscribe.
   */
  subscribeWorkflowFinish: (handler: (output: TerminalOutput<Registered, FromNodes>) => void) => () => void;

  /**
   * Back to the previous step.
   */
  goBack(): void;

  $$INTERNAL: {
    nodes: Set<StepInstance<any, any, any, any, any>>;
    edges: Edge<any, any>[];
    history: {
      node: StepInstance<any, any, any, any, any>;
      input: unknown;
      outCleanupOnBack: CleanupFn[];
    }[];
    stepInventoryMap: Map<string, StepCreatorAny>;
    getCurrentNode: () => StepInstance<any, any, any, any, any>;
    getContext: () => WorkflowContext | undefined;
    runExitSequence: () => CleanupFnArray;
    transitionInto: (
      node: StepInstance<any, any, any, any, any>,
      input: any,
      isBack: boolean,
      backCleanups: CleanupFn[],
    ) => void;
    stop: () => void;
    setCurrentStep: (currentStep: CurrentStepStatus<Creators>) => void;
    isWorkflowRunning: () => boolean;
  };
}
