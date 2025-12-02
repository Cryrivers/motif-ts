import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { useSyncExternalStore } from 'react';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  subscribe,
  getCurrentStep,
}: WorkflowAPI<Creators>): CurrentStep<Creators> {
  return useSyncExternalStore(subscribe, getCurrentStep);
}

const isWorkflowRunningServerFn = () => false;

export function useIsWorkflowRunning({
  subscribe,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>): boolean {
  return useSyncExternalStore(subscribe, isWorkflowRunning, isWorkflowRunningServerFn);
}
