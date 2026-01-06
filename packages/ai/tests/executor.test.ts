import { step, workflow } from '@motif-ts/core';
import { beforeEach, describe, expect, it } from 'vitest';
import z from 'zod/v4';

import { createAIExecutor } from '../src';

describe('AI Executor', () => {
  // Define test step with trackable actions
  const counter = { value: 0 };

  const CounterStep = step(
    {
      kind: 'CounterStep',
      outputSchema: z.object({ count: z.number() }),
      apiSchema: z.object({
        increment: z.any(),
        decrement: z.any(),
        submit: z.any(),
      }),
    },
    ({ next }) => ({
      increment: () => {
        counter.value++;
        return counter.value;
      },
      decrement: () => {
        counter.value--;
        return counter.value;
      },
      submit: () => next({ count: counter.value }),
    }),
  );

  beforeEach(() => {
    counter.value = 0;
  });

  describe('createAIExecutor', () => {
    it('should create an executor with all required methods', () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);

      expect(executor.execute).toBeInstanceOf(Function);
      expect(executor.getOpenAITools).toBeInstanceOf(Function);
      expect(executor.getClaudeTools).toBeInstanceOf(Function);
      expect(executor.onStepChange).toBeInstanceOf(Function);
      expect(executor.introspect).toBeInstanceOf(Function);
    });

    it('should execute tool calls successfully', async () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);

      const result = await executor.execute({
        name: 'CounterStep.increment',
        arguments: [],
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe(1);
      expect(counter.value).toBe(1);
    });

    it('should return error for unknown actions', async () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);

      const result = await executor.execute({
        name: 'CounterStep.unknownAction',
        arguments: [],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should return introspection data', () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);
      const schema = executor.introspect();

      expect(schema.steps).toHaveLength(1);
      expect(schema.steps[0].kind).toBe('CounterStep');
      expect(schema.currentStep).toBeDefined();
      expect(schema.currentStep?.kind).toBe('CounterStep');
    });

    it('should subscribe to step changes', () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);
      let callCount = 0;

      const unsubscribe = executor.onStepChange(() => {
        callCount++;
      });

      expect(unsubscribe).toBeInstanceOf(Function);
      unsubscribe();
    });

    it('should handle object arguments in tool calls', async () => {
      const wf = workflow([CounterStep]);
      const step1 = CounterStep('test');
      wf.register(step1);
      wf.start(step1);

      const executor = createAIExecutor(wf);

      // Execute with object arguments (as some LLMs return)
      const result = await executor.execute({
        name: 'CounterStep.increment',
        arguments: {} as unknown as unknown[],
      });

      expect(result.success).toBe(true);
    });
  });
});
