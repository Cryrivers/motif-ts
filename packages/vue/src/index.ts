import { type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { onUnmounted, readonly, shallowRef } from 'vue';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  subscribeStepChange,
  getCurrentStep,
}: WorkflowAPI<Creators>) {
  const state = shallowRef(getCurrentStep());

  const unsubscribe = subscribeStepChange(() => {
    state.value = getCurrentStep();
  });

  onUnmounted(unsubscribe);

  return readonly(state);
}

export function useIsWorkflowRunning({
  subscribeStepChange,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>) {
  const isRunning = shallowRef(isWorkflowRunning());

  const unsubscribe = subscribeStepChange(() => {
    isRunning.value = isWorkflowRunning();
  });

  onUnmounted(unsubscribe);

  return readonly(isRunning);
}
