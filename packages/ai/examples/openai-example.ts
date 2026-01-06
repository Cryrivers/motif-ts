/**
 * OpenAI SDK Integration Example
 *
 * This example demonstrates how to use @motif-ts/ai with the OpenAI SDK
 * to create AI-driven workflows where an LLM executes workflow steps via function calls.
 *
 * Requirements:
 * - pnpm add openai
 * - Set OPENAI_API_KEY environment variable
 */

import { createAIExecutor, createEvolver, createFeedbackCollector, type OpenAITool } from '@motif-ts/ai';
import { step, workflow } from '@motif-ts/core';
import OpenAI from 'openai';
import z from 'zod/v4';

// =============================================================================
// Step 1: Define AI-Friendly Steps
// =============================================================================

/**
 * Step that collects user information.
 * The apiSchema uses z.any() for function types, which is the recommended pattern.
 */
const CollectUserInfo = step(
  {
    kind: 'CollectUserInfo',
    outputSchema: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    apiSchema: z.object({
      submitInfo: z.any(), // Function to submit name and email
    }),
  },
  ({ next }) => ({
    submitInfo: (name: string, email: string) => {
      console.log(`[CollectUserInfo] Received: ${name}, ${email}`);
      next({ name, email });
    },
  }),
);

/**
 * Step that verifies the user's email.
 */
const VerifyEmail = step(
  {
    kind: 'VerifyEmail',
    inputSchema: z.object({ name: z.string(), email: z.string() }),
    outputSchema: z.object({ verified: z.boolean(), userId: z.string() }),
    apiSchema: z.object({
      verify: z.any(), // Function to verify email
      resend: z.any(), // Function to resend verification
    }),
  },
  ({ input, next }) => ({
    verify: (code: string) => {
      console.log(`[VerifyEmail] Verifying code: ${code} for ${input.email}`);
      // Simulate verification
      const isValid = code === '123456';
      if (isValid) {
        next({ verified: true, userId: `user_${Date.now()}` });
      }
      return isValid;
    },
    resend: () => {
      console.log(`[VerifyEmail] Resending code to ${input.email}`);
      return true;
    },
  }),
);

/**
 * Final step showing completion.
 */
const Complete = step(
  {
    kind: 'Complete',
    inputSchema: z.object({ verified: z.boolean(), userId: z.string() }),
    apiSchema: z.object({
      getWelcomeMessage: z.any(),
    }),
  },
  ({ input }) => ({
    getWelcomeMessage: () => `Welcome! Your user ID is ${input.userId}`,
  }),
);

// =============================================================================
// Step 2: Create Workflow with AI Executor
// =============================================================================

async function main() {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create workflow
  const wf = workflow([CollectUserInfo, VerifyEmail, Complete]);

  // Create step instances
  const collectStep = CollectUserInfo('collect');
  const verifyStep = VerifyEmail('verify');
  const completeStep = Complete('complete');

  // Register and connect steps
  wf.register([collectStep, verifyStep, completeStep]);
  wf.connect(collectStep, verifyStep);
  wf.connect(verifyStep, completeStep);

  // Start workflow
  wf.start(collectStep);

  // Create AI executor
  const executor = createAIExecutor(wf);

  // Create feedback collector (optional, for evolution)
  const feedback = createFeedbackCollector();

  // =============================================================================
  // Step 3: AI Agent Loop
  // =============================================================================

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping users complete a signup flow.
      
Available actions change based on the current step. Use the provided tools to:
1. First, collect user's name and email using submitInfo
2. Then verify with code "123456" using verify
3. Finally, get welcome message

Be helpful and guide the user through each step.`,
    },
    {
      role: 'user',
      content: 'Hi, I want to sign up. My name is Alice and my email is alice@example.com',
    },
  ];

  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);

    // Get available tools for current step
    const tools = executor.getOpenAITools();
    console.log(`Current step tools: ${tools.map((t) => t.function.name).join(', ') || 'none'}`);

    if (tools.length === 0) {
      console.log('Workflow complete - no more tools available');
      break;
    }

    // Call OpenAI
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools: tools as OpenAI.Chat.ChatCompletionTool[],
      tool_choice: 'auto',
    });

    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);

    // Check for tool calls
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      console.log('Assistant:', assistantMessage.content);
      // If no tool calls, add a prompt to continue
      messages.push({
        role: 'user',
        content: 'Please continue with the next step.',
      });
      continue;
    }

    // Execute tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      console.log(`Executing: ${toolCall.function.name}`);
      console.log(`Arguments: ${toolCall.function.arguments}`);

      const args = JSON.parse(toolCall.function.arguments);

      // Record execution for feedback
      const result = await executor.execute({
        name: toolCall.function.name,
        arguments: Object.values(args),
      });

      // Record in feedback collector
      feedback.recordExecution({
        stepId: toolCall.function.name.split('.')[0],
        stepKind: toolCall.function.name.split('.')[0],
        input: args,
        output: result.result,
        success: result.success,
        durationMs: Date.now() - startTime,
      });

      console.log(`Result: ${JSON.stringify(result)}`);

      // Add tool result to messages
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  // =============================================================================
  // Optional: View Execution Insights
  // =============================================================================

  console.log('\n--- Execution Insights ---');
  console.log(feedback.exportForAnalysis());
}

// Run the example
main().catch(console.error);
