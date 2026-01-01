import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { onUnmounted, readonly, shallowRef, type DeepReadonly, type ShallowRef } from 'vue';

export function useWorkflow<const Creators extends readonly StepCreatorAny[]>({
  subscribeStepChange,
  getCurrentStep,
}: WorkflowAPI<Creators>): DeepReadonly<ShallowRef<CurrentStep<Creators>>> {
  const state = shallowRef(getCurrentStep());

  const unsubscribe = subscribeStepChange(() => {
    state.value = getCurrentStep();
  });

  onUnmounted(unsubscribe);

  return readonly(state) as DeepReadonly<ShallowRef<CurrentStep<Creators>>>;
}

export function useIsWorkflowRunning({
  subscribeStepChange,
  $$INTERNAL: { isWorkflowRunning },
}: WorkflowAPI<readonly StepCreatorAny[]>): DeepReadonly<ShallowRef<boolean>> {
  const isRunning = shallowRef(isWorkflowRunning());

  const unsubscribe = subscribeStepChange(() => {
    isRunning.value = isWorkflowRunning();
  });

  onUnmounted(unsubscribe);

  return readonly(isRunning) as DeepReadonly<ShallowRef<boolean>>;
}
