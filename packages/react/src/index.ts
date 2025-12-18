import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { useSyncExternalStore } from 'react';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  subscribeStepChange,
  getCurrentStep,
}: WorkflowAPI<Creators>): CurrentStep<Creators> {
  return useSyncExternalStore(subscribeStepChange, getCurrentStep);
}

const isWorkflowRunningServerFn = () => false;

export function useIsWorkflowRunning({
  subscribeStepChange,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>): boolean {
  return useSyncExternalStore(subscribeStepChange, isWorkflowRunning, isWorkflowRunningServerFn);
}
