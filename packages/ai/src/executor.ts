import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';

import { getCurrentActions, introspectWorkflow } from './introspect';
import { actionsToClaudeTools, actionsToOpenAITools, toClaudeTools, toOpenAITools } from './tools';
import {
  type AIExecutor,
  type ClaudeTool,
  type OpenAITool,
  type ToolCall,
  type ToolResult,
  type WorkflowSchema,
} from './types';

/**
 * Parse a tool call name to extract the action name.
 * Handles prefixed names like "StepKind.actionName" → "actionName"
 */
function parseToolName(toolName: string): string {
  const parts = toolName.split('.');
  return parts[parts.length - 1];
}

/**
 * Create an AI executor for a workflow.
 * The executor allows AI agents to interact with workflows via function calling.
 */
export function createAIExecutor<C extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<C>): AIExecutor<C> {
  /**
   * Execute a tool call on the current step
   */
  const execute = async (toolCall: ToolCall): Promise<ToolResult> => {
    try {
      const current = workflow.getCurrentStep();
      const actionName = parseToolName(toolCall.name);
      const api = current.state as Record<string, unknown>;

      const action = api[actionName];
      if (typeof action !== 'function') {
        return {
          success: false,
          error: `Unknown action: ${actionName}. Available actions: ${Object.keys(api)
            .filter((k) => typeof api[k] === 'function')
            .join(', ')}`,
        };
      }

      // Handle both array and object arguments
      let args: unknown[];
      if (Array.isArray(toolCall.arguments)) {
        args = toolCall.arguments;
      } else if (typeof toolCall.arguments === 'object' && toolCall.arguments !== null) {
        // Convert object arguments to positional array (arg0, arg1, ...)
        const argsObj = toolCall.arguments as Record<string, unknown>;
        const sortedKeys = Object.keys(argsObj).sort();
        args = sortedKeys.map((key) => argsObj[key]);
      } else {
        args = toolCall.arguments ? [toolCall.arguments] : [];
      }

      const result = await action(...args);

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  /**
   * Get current step's tools in OpenAI format
   */
  const getOpenAITools = (): OpenAITool[] => {
    try {
      return toOpenAITools(workflow);
    } catch {
      return [];
    }
  };

  /**
   * Get current step's tools in Claude format
   */
  const getClaudeTools = (): ClaudeTool[] => {
    try {
      return toClaudeTools(workflow);
    } catch {
      return [];
    }
  };

  /**
   * Subscribe to step changes
   */
  const onStepChange = (handler: (openaiTools: OpenAITool[], claudeTools: ClaudeTool[]) => void): (() => void) => {
    return workflow.subscribeStepChange(() => {
      const openaiTools = getOpenAITools();
      const claudeTools = getClaudeTools();
      handler(openaiTools, claudeTools);
    });
  };

  /**
   * Get workflow introspection data
   */
  const introspect = (): WorkflowSchema => {
    return introspectWorkflow(workflow);
  };

  return {
    execute,
    getOpenAITools,
    getClaudeTools,
    onStepChange,
    introspect,
  };
}

/**
 * Helper to run a simple AI agent loop.
 * This is a utility for common AI integration patterns.
 */
export interface AgentLoopOptions<C extends readonly StepCreatorAny[]> {
  workflow: WorkflowAPI<C>;
  /**
   * Function to call the LLM with tools and get a response
   */
  callLLM: (messages: unknown[], tools: OpenAITool[]) => Promise<{ toolCalls: ToolCall[] }>;
  /**
   * Initial messages to the LLM
   */
  messages: unknown[];
  /**
   * Maximum number of iterations
   */
  maxIterations?: number;
  /**
   * Called after each tool execution
   */
  onToolResult?: (toolCall: ToolCall, result: ToolResult) => void;
  /**
   * Called when step changes
   */
  onStepChange?: (currentStep: { kind: string; name: string }) => void;
}

export async function runAgentLoop<C extends readonly StepCreatorAny[]>(options: AgentLoopOptions<C>): Promise<void> {
  const { workflow, callLLM, messages, maxIterations = 100, onToolResult, onStepChange } = options;

  const executor = createAIExecutor(workflow);
  let iterations = 0;

  // Subscribe to step changes
  if (onStepChange) {
    workflow.subscribeStepChange((step) => {
      onStepChange({ kind: step.kind, name: step.name });
    });
  }

  while (iterations < maxIterations) {
    const tools = executor.getOpenAITools();

    // If no tools available, workflow is complete
    if (tools.length === 0) {
      break;
    }

    const response = await callLLM(messages, tools);

    // If no tool calls, break
    if (!response.toolCalls || response.toolCalls.length === 0) {
      break;
    }

    // Execute each tool call
    for (const toolCall of response.toolCalls) {
      const result = await executor.execute(toolCall);
      if (onToolResult) {
        onToolResult(toolCall, result);
      }
    }

    iterations++;
  }
}
