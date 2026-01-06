/**
 * Anthropic Claude SDK Integration Example
 *
 * This example demonstrates how to use @motif-ts/ai with the Anthropic SDK
 * to create AI-driven workflows where Claude executes workflow steps via tool use.
 *
 * Requirements:
 * - pnpm add @anthropic-ai/sdk
 * - Set ANTHROPIC_API_KEY environment variable
 */

import Anthropic from '@anthropic-ai/sdk';
import { createAIExecutor, createEvolver, createFeedbackCollector, type ClaudeTool } from '@motif-ts/ai';
import { step, workflow } from '@motif-ts/core';
import z from 'zod/v4';

// =============================================================================
// Step 1: Define AI-Friendly Steps (same as OpenAI example)
// =============================================================================

const CollectUserInfo = step(
  {
    kind: 'CollectUserInfo',
    outputSchema: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    apiSchema: z.object({
      submitInfo: z.any(),
    }),
  },
  ({ next }) => ({
    submitInfo: (name: string, email: string) => {
      console.log(`[CollectUserInfo] Received: ${name}, ${email}`);
      next({ name, email });
    },
  }),
);

const VerifyEmail = step(
  {
    kind: 'VerifyEmail',
    inputSchema: z.object({ name: z.string(), email: z.string() }),
    outputSchema: z.object({ verified: z.boolean(), userId: z.string() }),
    apiSchema: z.object({
      verify: z.any(),
      resend: z.any(),
    }),
  },
  ({ input, next }) => ({
    verify: (code: string) => {
      console.log(`[VerifyEmail] Verifying code: ${code} for ${input.email}`);
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
  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Create workflow
  const wf = workflow([CollectUserInfo, VerifyEmail, Complete]);

  // Create and register step instances
  const collectStep = CollectUserInfo('collect');
  const verifyStep = VerifyEmail('verify');
  const completeStep = Complete('complete');

  wf.register([collectStep, verifyStep, completeStep]);
  wf.connect(collectStep, verifyStep);
  wf.connect(verifyStep, completeStep);
  wf.start(collectStep);

  // Create AI executor
  const executor = createAIExecutor(wf);

  // Create feedback collector
  const feedback = createFeedbackCollector();

  // =============================================================================
  // Step 3: Claude AI Agent Loop
  // =============================================================================

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: 'Hi, I want to sign up. My name is Bob and my email is bob@example.com',
    },
  ];

  const systemPrompt = `You are an AI assistant helping users complete a signup flow.

Available actions change based on the current step. Use the provided tools to:
1. First, collect user's name and email using submitInfo
2. Then verify with code "123456" using verify
3. Finally, get welcome message

Be helpful and guide the user through each step.`;

  let iteration = 0;
  const maxIterations = 10;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n--- Iteration ${iteration} ---`);

    // Get available tools in Claude format
    const tools = executor.getClaudeTools();
    console.log(`Current step tools: ${tools.map((t) => t.name).join(', ') || 'none'}`);

    if (tools.length === 0) {
      console.log('Workflow complete - no more tools available');
      break;
    }

    // Call Claude
    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: tools as Anthropic.Tool[],
    });

    // Process response
    const assistantContent = response.content;

    // Add assistant message to history
    messages.push({
      role: 'assistant',
      content: assistantContent,
    });

    // Check for tool use
    const toolUseBlocks = assistantContent.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );

    if (toolUseBlocks.length === 0) {
      // No tool calls, print text response
      const textBlocks = assistantContent.filter((block): block is Anthropic.TextBlock => block.type === 'text');
      console.log('Claude:', textBlocks.map((b) => b.text).join('\n'));

      // Prompt to continue
      messages.push({
        role: 'user',
        content: 'Please continue with the next step.',
      });
      continue;
    }

    // Execute tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      console.log(`Executing: ${toolUse.name}`);
      console.log(`Input: ${JSON.stringify(toolUse.input)}`);

      const input = toolUse.input as Record<string, unknown>;

      const result = await executor.execute({
        name: toolUse.name,
        arguments: Object.values(input),
      });

      // Record in feedback collector
      feedback.recordExecution({
        stepId: toolUse.name.split('.')[0],
        stepKind: toolUse.name.split('.')[0],
        input,
        output: result.result,
        success: result.success,
        durationMs: Date.now() - startTime,
      });

      console.log(`Result: ${JSON.stringify(result)}`);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Add tool results to messages
    messages.push({
      role: 'user',
      content: toolResults,
    });
  }

  // =============================================================================
  // Optional: View Execution Insights
  // =============================================================================

  console.log('\n--- Execution Insights ---');
  console.log(feedback.exportForAnalysis());
}

// Run the example
main().catch(console.error);
