import { type StepCreatorAny, type WorkflowAPI, type CurrentStep } from '@motif-ts/core';
import { useSyncExternalStore } from 'react';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  subscribe,
  getCurrentStep,
}: WorkflowAPI<Creators>): CurrentStep<Creators> {
  return useSyncExternalStore(subscribe, getCurrentStep);
}
