/**
 * Type-level test for onFinish output type inference.
 * This file tests that the TypeScript compiler correctly infers
 * the output type of onFinish based on terminal nodes.
 */
import { z } from 'zod/v4';

import { step } from '../../src/step';
import { workflow } from '../../src/workflow';

// Define steps with different output types
const StepA = step(
  {
    kind: 'step-a',
    outputSchema: z.object({ email: z.string() }),
  },
  () => ({
    submit: () => {},
  }),
);

const StepB = step(
  {
    kind: 'step-b',
    inputSchema: z.object({ email: z.string() }),
    outputSchema: z.object({
      email: z.string(),
      verified: z.boolean(),
    }),
  },
  () => ({
    verify: () => {},
  }),
);

const StepC = step(
  {
    kind: 'step-c',
    inputSchema: z.object({ email: z.string(), verified: z.boolean() }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  () => ({
    complete: () => {},
  }),
);

// ======= Test 1: Single terminal node =======
// A -> B -> C (only C is terminal)
function testSingleTerminal() {
  const a = StepA();
  const b = StepB();
  const c = StepC();

  const wf = workflow([StepA, StepB, StepC]).register([a, b, c]).connect(a, b).connect(b, c);

  // onFinish should infer { success: boolean; message: string }
  wf.onFinish((output) => {
    // Type assertion - if this compiles, the type inference works
    const _success: boolean = output.success;
    const _message: string = output.message;
    void _success;
    void _message;
  });
}

// ======= Test 2: Multiple terminal nodes =======
// A -> B (B is terminal)
// A -> C (C is terminal)
// onFinish output should be union of B and C outputs
function testMultipleTerminals() {
  const a = StepA();
  const b = StepB();
  const c = StepC();

  const wf = workflow([StepA, StepB, StepC]).register([a, b, c]).connect(a, b).connect(a, c);

  // onFinish output is union: { email: string; verified: boolean } | { success: boolean; message: string }
  wf.onFinish((output) => {
    // Both types should be valid since it's a union
    if ('verified' in output) {
      const _email: string = output.email;
      const _verified: boolean = output.verified;
      void _email;
      void _verified;
    } else {
      const _success: boolean = output.success;
      const _message: string = output.message;
      void _success;
      void _message;
    }
  });
}

// ======= Test 3: No edges (single node, that node is terminal) =======
function testNoEdges() {
  const a = StepA();

  const wf = workflow([StepA]).register(a);

  // Without any connect calls, FromNodes is never, so TerminalOutput returns unknown
  wf.onFinish((output) => {
    // output is unknown here - this is expected behavior
    void output;
  });
}

void testSingleTerminal;
void testMultipleTerminals;
void testNoEdges;
