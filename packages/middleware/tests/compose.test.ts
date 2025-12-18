import { step, workflow } from '@motif-ts/core';
import { describe, expect, it, vi } from 'vitest';
import z from 'zod/v4';

import { applyMiddleware, composeMiddleware, type MiddlewareFn } from '../src/compose';

// Simple test step
const TestStep = step(
  {
    kind: 'TestStep',
    outputSchema: z.object({ value: z.number() }),
  },
  ({ next }) => ({
    emit(value: number) {
      next({ value });
    },
  }),
);

describe('composeMiddleware', () => {
  it('composes single middleware', () => {
    const calls: string[] = [];

    const middleware: MiddlewareFn = (wf) => {
      calls.push('middleware applied');
      return wf;
    };

    const composed = composeMiddleware(middleware);
    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    composed(wf);

    expect(calls).toEqual(['middleware applied']);
  });

  it('composes multiple middlewares left-to-right', () => {
    const calls: string[] = [];

    const m1: MiddlewareFn = (wf) => {
      calls.push('m1');
      return wf;
    };
    const m2: MiddlewareFn = (wf) => {
      calls.push('m2');
      return wf;
    };
    const m3: MiddlewareFn = (wf) => {
      calls.push('m3');
      return wf;
    };

    const composed = composeMiddleware(m1, m2, m3);
    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    composed(wf);

    // Left-to-right: m1 first, then m2, then m3
    expect(calls).toEqual(['m1', 'm2', 'm3']);
  });

  it('merges extension types from multiple middlewares', () => {
    type Ext1 = { foo: () => string };
    type Ext2 = { bar: () => number };

    const m1: MiddlewareFn<Ext1> = (wf) => ({
      ...wf,
      foo: () => 'hello',
    });

    const m2: MiddlewareFn<Ext2> = (wf) => ({
      ...wf,
      bar: () => 42,
    });

    const composed = composeMiddleware(m1, m2);
    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    const enhanced = composed(wf);

    // Both extensions should be available
    expect(enhanced.foo()).toBe('hello');
    expect(enhanced.bar()).toBe(42);
  });

  it('preserves workflow API methods', () => {
    const middleware: MiddlewareFn = (wf) => wf;

    const composed = composeMiddleware(middleware);
    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    const enhanced = composed(wf);

    // Core API should still work
    expect(typeof enhanced.register).toBe('function');
    expect(typeof enhanced.connect).toBe('function');
    expect(typeof enhanced.start).toBe('function');
    expect(typeof enhanced.getCurrentStep).toBe('function');
    expect(typeof enhanced.subscribeStepChange).toBe('function');
    expect(typeof enhanced.subscribeWorkflowFinish).toBe('function');
    expect(typeof enhanced.goBack).toBe('function');
    expect(typeof enhanced.stop).toBe('function');
  });
});

describe('applyMiddleware', () => {
  it('applies a single middleware to a workflow', () => {
    const mockFn = vi.fn();

    type Ext = { custom: () => void };
    const middleware: MiddlewareFn<Ext> = (wf) => ({
      ...wf,
      custom: mockFn,
    });

    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    const enhanced = applyMiddleware(wf, middleware);

    enhanced.custom();
    expect(mockFn).toHaveBeenCalledOnce();
  });

  it('preserves original workflow functionality', () => {
    type Ext = { extra: string };
    const middleware: MiddlewareFn<Ext> = (wf) => ({
      ...wf,
      extra: 'value',
    });

    const wf = workflow([TestStep]);
    const node = TestStep();
    wf.register(node);

    const enhanced = applyMiddleware(wf, middleware);

    // Original methods work
    enhanced.start(node);
    const step = enhanced.getCurrentStep();
    expect(step.kind).toBe('TestStep');

    // Extension works
    expect(enhanced.extra).toBe('value');
  });
});
