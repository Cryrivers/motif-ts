import { step, workflow } from '@motif-ts/core/dist/index.mjs';
import z from 'zod';

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

export const VerifyStep = step(
  {
    kind: 'verify',
    inputSchema: z.object({ email: z.string() }).loose(),
    outputSchema: z.object({ email: z.string(), isVerified: z.boolean() }).loose(),
    options: {
      noHistory: true,
    },
  },
  ({ transitionIn, next, input }) => {
    transitionIn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
      next({ ...input, isVerified: true });
    });
    return {};
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
