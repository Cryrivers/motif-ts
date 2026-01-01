import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { readable, type Readable } from 'svelte/store';

export function createWorkflowStore<const Creators extends readonly StepCreatorAny[]>({
  subscribeStepChange,
  getCurrentStep,
}: WorkflowAPI<Creators>): Readable<CurrentStep<Creators>> {
  return readable(getCurrentStep(), (set) => {
    return subscribeStepChange(() => set(getCurrentStep()));
  });
}

export function createIsWorkflowRunningStore({
  subscribeStepChange,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>): Readable<boolean> {
  return readable(isWorkflowRunning(), (set) => {
    return subscribeStepChange(() => set(isWorkflowRunning()));
  });
}
