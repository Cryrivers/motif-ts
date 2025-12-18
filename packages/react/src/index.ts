import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { useSyncExternalStore } from 'react';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  onStepChange,
  getCurrentStep,
}: WorkflowAPI<Creators>): CurrentStep<Creators> {
  return useSyncExternalStore(onStepChange, getCurrentStep);
}

const isWorkflowRunningServerFn = () => false;

export function useIsWorkflowRunning({
  onStepChange,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>): boolean {
  return useSyncExternalStore(onStepChange, isWorkflowRunning, isWorkflowRunningServerFn);
}
