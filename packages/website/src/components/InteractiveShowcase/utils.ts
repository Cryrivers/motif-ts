import { step, workflow } from '@motif-ts/core';
import z from 'zod';
import { type StateCreator } from 'zustand/vanilla';

export const InputStep = step(
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

export const VerifyStep = step(
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
      let interval: NodeJS.Timeout;
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

export const ProfileStep = step(
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

export const PlanStep = step(
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

export const SuccessStep = step(
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

export const initiateWorkflow = () => workflow([InputStep, VerifyStep, ProfileStep, PlanStep, SuccessStep]);

export type InteractiveWorkflow = ReturnType<typeof initiateWorkflow>;
