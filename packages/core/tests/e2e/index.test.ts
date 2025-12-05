import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import z from 'zod';
import { type StateCreator } from 'zustand/vanilla';

import { step, workflow } from '../../src';

const InputStep = step(
  {
    kind: 'input',
    outputSchema: z.object({ email: z.email() }).loose(),
  },
  ({ next }) => {
    return {
      submit: (email: string) => {
        next({ email });
      },
    };
  },
);

interface VerifyState {
  isActive: boolean;
  timeLeft: number;
  maxTime: number;
  decrement: () => void;
  start: () => void;
}

const verifyStore: StateCreator<VerifyState> = (set) => ({
  isActive: false,
  timeLeft: 3,
  maxTime: 3,
  decrement: () => set((s) => ({ timeLeft: Math.max(0, s.timeLeft - 1) })),
  start: () => set({ isActive: true }),
});

const VerifyStep = step(
  {
    kind: 'verify',
    inputSchema: z.object({ email: z.string() }).loose(),
    outputSchema: z.object({ email: z.string(), isVerified: z.boolean() }).loose(),
    createStore: verifyStore,
    options: {
      noHistory: true,
    },
  },
  ({ next, input, store, effect }) => {
    // Effect: Handle countdown interval
    effect(() => {
      let interval: any;
      if (store.isActive && store.timeLeft > 0) {
        interval = setInterval(() => store.decrement(), 1000);
      }
      return () => clearInterval(interval);
    }, [store.isActive]); // Re-run when active state changes

    // Effect: Auto-advance when time reaches 0
    effect(() => {
      if (store.isActive && store.timeLeft === 0) {
        next({ ...input, isVerified: true });
      }
    }, [store.timeLeft, store.isActive]);

    return {
      timeLeft: store.timeLeft,
      maxTime: store.maxTime,
      isActive: store.isActive,
      start: store.start,
    };
  },
);

const ProfileStep = step(
  {
    kind: 'profile',
    inputSchema: z.object({ email: z.string() }).loose(),
    outputSchema: z.object({ email: z.string(), name: z.string(), role: z.string() }).loose(),
  },
  ({ next, input }) => {
    return {
      submitProfile: (name: string, role: string) => {
        next({ ...input, name, role });
      },
    };
  },
);

const PlanStep = step(
  {
    kind: 'plan',
    inputSchema: z.object({ email: z.string() }).loose(),
    outputSchema: z.object({ email: z.string(), plan: z.string() }).loose(),
  },
  ({ next, input }) => {
    return {
      selectPlan: (plan: string) => {
        next({ ...input, plan });
      },
    };
  },
);

const SuccessStep = step(
  {
    kind: 'success',
    inputSchema: z.object({
      email: z.string(),
      name: z.string().optional(),
      role: z.string().optional(),
      plan: z.string().optional(),
      isVerified: z.boolean().optional(),
    }),
  },
  ({ input }) => {
    return {
      data: input,
    };
  },
);

describe('E2E Workflow Test', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should execute the full workflow successfully', async () => {
    // 1. Initialize Workflow
    const wf = workflow([InputStep, VerifyStep, ProfileStep, PlanStep, SuccessStep]);

    // 2. Instantiate Steps
    const inputNode = InputStep('input');
    const verifyNode = VerifyStep('verify');
    const profileNode = ProfileStep('profile');
    const planNode = PlanStep('plan');
    const successNode = SuccessStep('success');

    // 3. Register and Connect
    wf.register([inputNode, verifyNode, profileNode, planNode, successNode]);

    wf.connect(inputNode, verifyNode)
      .connect(verifyNode, profileNode)
      .connect(profileNode, planNode)
      .connect(planNode, successNode);

    // 4. Start Workflow
    wf.start(inputNode);

    let current = wf.getCurrentStep();
    expect(current.name).toBe('input');

    // 5. Input Step Interaction
    assert(current.kind === 'input');
    current.state.submit('test@example.com');

    // 6. Verify Step Interaction (Time-based)
    current = wf.getCurrentStep();
    assert(current.kind === 'verify');
    expect(current.state.isActive).toBe(false);

    // Start verification
    current.state.start();

    // Wait for state update (Zustand updates might be deferred/batched)
    await vi.waitUntil(() => {
      current = wf.getCurrentStep();
      return current.kind === 'verify' && current.state.isActive;
    });

    current = wf.getCurrentStep();
    assert(current.kind === 'verify');
    expect(current.state.isActive).toBe(true);
    expect(current.state.timeLeft).toBe(3);

    current = wf.getCurrentStep();
    assert(current.kind === 'verify');
    expect(current.state.isActive).toBe(true);
    expect(current.state.timeLeft).toBe(3);

    // Fast-forward time
    vi.advanceTimersByTime(1000);
    current = wf.getCurrentStep();
    assert(current.kind === 'verify');
    expect(current.state.timeLeft).toBe(2);

    vi.advanceTimersByTime(1000);
    current = wf.getCurrentStep();
    assert(current.kind === 'verify');
    expect(current.state.timeLeft).toBe(1);

    vi.advanceTimersByTime(1000);
    // Should have transitioned to profile

    current = wf.getCurrentStep();
    assert(current.kind === 'profile');

    // 7. Profile Step Interaction
    current.state.submitProfile('John Doe', 'Developer');

    current = wf.getCurrentStep();
    assert(current.kind === 'plan');

    // 8. Plan Step Interaction
    current.state.selectPlan('Pro');

    current = wf.getCurrentStep();
    assert(current.kind === 'success');

    // 9. Verify Final Data
    expect(current.state.data).toEqual({
      email: 'test@example.com',
      isVerified: true,
      name: 'John Doe',
      role: 'Developer',
      plan: 'Pro',
    });
  });
});
