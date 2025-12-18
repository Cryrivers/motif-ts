import { type DeserializableEdgeFunc, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { conditionalEdge, edge, transformEdge } from '@motif-ts/core/edge/serializable';
import { type z } from 'zod/v4';

import { type SchemaBasic, type SchemaFullState } from './constants';
import { createImportExportHandlers } from './io';

interface PersistAPI {
  /**
   * Export current workflow configuration or full state to JSON structure.
   * @param mode 'basic' for nodes/edges only; 'full' for including runtime state and history.
   */
  exportWorkflow(mode: 'basic'): z.infer<typeof SchemaBasic>;
  exportWorkflow(mode: 'full'): z.infer<typeof SchemaFullState>;
  /**
   * Import workflow configuration or full state from JSON. Operation is atomic; on any error, no changes are applied.
   * @param data The JSON object to import.
   * @param mode Must match the export format: 'basic' or 'full'.
   */
  importWorkflow(mode: 'basic', data: z.infer<typeof SchemaBasic>): void;
  importWorkflow(mode: 'full', data: z.infer<typeof SchemaFullState>): void;
}

export default function devtoolsMiddleware<const Creators extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<Creators>,
): WorkflowAPI<Creators> & PersistAPI {
  const {
    start,
    register,
    connect,
    getCurrentStep,
    subscribeStepChange,
    subscribeWorkflowFinish,
    goBack,
    stop,
    pause,
    resume,
    $$INTERNAL,
  } = workflow;

  const edgeInventoryMap = new Map<string, DeserializableEdgeFunc>([
    ['default', edge],
    ['conditional-serializable', conditionalEdge],
    ['transform-serializable', transformEdge],
  ]);

  // wire import/export handlers from separate module
  const { exportWorkflow, importWorkflow } = createImportExportHandlers({
    stepInventoryMap: $$INTERNAL.stepInventoryMap,
    edgeInventoryMap,
    nodes: $$INTERNAL.nodes,
    edges: $$INTERNAL.edges,
    history: $$INTERNAL.history,
    getCurrentStep,
    getCurrentNode: $$INTERNAL.getCurrentNode,
    getContext: $$INTERNAL.getContext,
    isWorkflowRunning: $$INTERNAL.isWorkflowRunning,
    runExitSequence: $$INTERNAL.runExitSequence,
    transitionInto: $$INTERNAL.transitionInto,
    stop: $$INTERNAL.stop,
  });

  return {
    register,
    connect,
    start,
    getCurrentStep,
    subscribeStepChange,
    subscribeWorkflowFinish,
    goBack,
    stop,
    pause,
    resume,
    $$INTERNAL,
    exportWorkflow,
    importWorkflow,
  } satisfies WorkflowAPI<Creators> & PersistAPI;
}
