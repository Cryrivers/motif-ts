import { assert, describe, expect, it, vi } from 'vitest';
import { z } from 'zod'; // Import zod

import { step, workflow } from '../src';

// Step A: Input step. Starts with no input, exposes 'submit' API to trigger next.
const StepA = step(
  {
    kind: 'stepA',
    inputSchema: z.void(),
    outputSchema: z.object({ value: z.number() }),
  },
  ({ next }) => {
    return {
      submit: (value: number) => next({ value }),
    };
  },
);

// Step B: Processing step. Receives number, adds 1, finishes.
const StepB = step(
  {
    kind: 'stepB',
    inputSchema: z.object({ value: z.number() }),
    outputSchema: z.object({ value: z.number() }),
  },
  ({ input, next, effect }) => {
    effect(() => {
      next({ value: input.value + 1 });
    }, []);
    return {};
  },
);

describe('Workflow Finish Logic', () => {
  it('should trigger onFinish when workflow completes', async () => {
    const stepA = StepA();
    const stepB = StepB();
    const flow = workflow([StepA, StepB]);

    flow.register([stepA, stepB]);
    flow.connect(stepA, stepB);

    const finishSpy = vi.fn();
    flow.onFinish(finishSpy);

    flow.start(stepA);

    // Now call submit on StepA
    const current = flow.getCurrentStep();
    assert(current.kind === 'stepA');
    current.state.submit(1);

    // Wait for async transitions
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(finishSpy).toHaveBeenCalledTimes(1);
    expect(finishSpy).toHaveBeenCalledWith({ value: 2 }); // 1 + 1 = 2
  });

  it('should reset workflow state after finish', async () => {
    const stepA = StepA();
    const flow = workflow([StepA]);

    flow.register([stepA]);
    // No connection from stepA, so it should finish immediately after A completes

    const finishSpy = vi.fn();
    flow.onFinish(finishSpy);

    flow.start(stepA);
    const current = flow.getCurrentStep();
    current.state.submit(10);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(finishSpy).toHaveBeenCalledWith({ value: 10 });

    // Internal API to check state
    const internal = flow.$$INTERNAL;
    expect(internal.isWorkflowRunning()).toBe(false);
    expect(internal.getContext()).toBeUndefined();
    expect(flow.getCurrentStep).toThrow(); // Should throw because currentStep is undefined
  });

  it('should support multiple onFinish subscribers', async () => {
    const stepA = StepA();
    const flow = workflow([StepA]);
    flow.register([stepA]);

    const spy1 = vi.fn();
    const spy2 = vi.fn();

    flow.onFinish(spy1);
    flow.onFinish(spy2);

    flow.start(stepA);
    flow.getCurrentStep().state.submit(0);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });
});
