// Core functionality
export { createAIExecutor, runAgentLoop, type AgentLoopOptions } from './executor';

// Schema introspection
export {
  introspectWorkflow,
  getCurrentActions,
  getStepSchema,
  getRegisteredSteps,
  getWorkflowGraph,
  exportWorkflowDescription,
} from './introspect';

// Tools conversion (Zod → OpenAI/Claude)
export {
  toOpenAITools,
  toClaudeTools,
  actionsToOpenAITools,
  actionsToClaudeTools,
  inputSchemaToOpenAITool,
  inputSchemaToClaudeTool,
  extractActionsFromApiSchema,
  zodToParameterSchema,
} from './tools';

// Workflow evolution
export { createEvolver, createAIEvolver, type AIEvolverOptions, type AIEvolver } from './evolution';

// Feedback and analytics
export { createFeedbackCollector } from './feedback';

// Middleware
export { aiObserver, aiConsoleLogger, type AIObserverHandlers, type AIObserverExtension } from './middleware/observer';

// Types
export {
  // OpenAI types
  type OpenAITool,
  type OpenAIFunction,
  type OpenAIFunctionParameter,
  // Claude types
  type ClaudeTool,
  type ClaudeInputSchema,
  // Tool call types
  type ToolCall,
  type ToolResult,
  // Schema types
  type StepSchema,
  type EdgeSchema,
  type WorkflowSchema,
  type ActionSchema,
  // Executor types
  type AIExecutor,
  // Evolution types
  type WorkflowEvolver,
  type EvolutionChange,
  type EvolutionChangeType,
  type EvolutionEvent,
  type EvolutionSuggestion,
  // Feedback types
  type FeedbackCollector,
  type ExecutionRecord,
  type FeedbackRecord,
  type ExecutionInsight,
} from './types';
