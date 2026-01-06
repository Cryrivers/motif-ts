import { type CurrentStep, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { composeMiddleware, type MiddlewareFn } from '@motif-ts/middleware';

import { type ToolCall, type ToolResult } from '../types';

export interface AIObserverHandlers {
  /**
   * Called when an AI tool call is about to be executed
   */
  onToolCall?: (call: ToolCall, currentStep: { kind: string; name: string }) => void;

  /**
   * Called after an AI tool call completes
   */
  onToolResult?: (call: ToolCall, result: ToolResult, currentStep: { kind: string; name: string }) => void;

  /**
   * Called when a step transition occurs
   */
  onStepTransition?: (from: { kind: string; name: string } | null, to: { kind: string; name: string }) => void;
}

export interface AIObserverExtension {
  /**
   * Notify the observer of a tool call start
   */
  notifyToolCall: (call: ToolCall) => void;

  /**
   * Notify the observer of a tool result
   */
  notifyToolResult: (call: ToolCall, result: ToolResult) => void;
}

/**
 * Create a middleware that observes AI interactions with the workflow.
 * Useful for logging, analytics, and debugging AI agent behavior.
 */
export function aiObserver<C extends readonly StepCreatorAny[]>(
  handlers: AIObserverHandlers,
): MiddlewareFn<AIObserverExtension> {
  return <const Creators extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<Creators>) => {
    let previousStep: { kind: string; name: string } | null = null;

    // Subscribe to step changes for transition tracking
    if (handlers.onStepTransition) {
      workflow.subscribeStepChange((current) => {
        const to = { kind: current.kind, name: current.name };

        if (previousStep === null || previousStep.kind !== to.kind || previousStep.name !== to.name) {
          handlers.onStepTransition!(previousStep, to);
        }

        previousStep = to;
      });
    }

    return Object.assign(workflow, {
      notifyToolCall: (call: ToolCall) => {
        if (handlers.onToolCall) {
          try {
            const current = workflow.getCurrentStep();
            handlers.onToolCall(call, { kind: current.kind, name: current.name });
          } catch {
            // Workflow not started
          }
        }
      },

      notifyToolResult: (call: ToolCall, result: ToolResult) => {
        if (handlers.onToolResult) {
          try {
            const current = workflow.getCurrentStep();
            handlers.onToolResult(call, result, { kind: current.kind, name: current.name });
          } catch {
            // Workflow not started
          }
        }
      },
    }) as WorkflowAPI<Creators> & AIObserverExtension;
  };
}

/**
 * Simple console logger for AI interactions
 */
export function aiConsoleLogger<C extends readonly StepCreatorAny[]>(): MiddlewareFn<AIObserverExtension> {
  return aiObserver({
    onToolCall: (call, step) => {
      console.log(`[AI] Tool call: ${call.name} at ${step.kind}:${step.name}`);
    },
    onToolResult: (call, result, step) => {
      const status = result.success ? '✓' : '✗';
      console.log(`[AI] ${status} ${call.name} at ${step.kind}:${step.name}`);
      if (!result.success && result.error) {
        console.log(`[AI] Error: ${result.error}`);
      }
    },
    onStepTransition: (from, to) => {
      const fromStr = from ? `${from.kind}:${from.name}` : 'start';
      console.log(`[AI] Step transition: ${fromStr} → ${to.kind}:${to.name}`);
    },
  });
}
