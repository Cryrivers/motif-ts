import { type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { type ZodType } from 'zod/v4';

// ============================================================
// OpenAI Function Calling Types
// ============================================================

export interface OpenAIFunctionParameter {
  type: string;
  description?: string;
  properties?: Record<string, OpenAIFunctionParameter>;
  items?: OpenAIFunctionParameter;
  required?: string[];
  enum?: string[];
}

export interface OpenAIFunction {
  name: string;
  description?: string;
  parameters: OpenAIFunctionParameter;
}

export interface OpenAITool {
  type: 'function';
  function: OpenAIFunction;
}

// ============================================================
// Anthropic Claude Types
// ============================================================

export interface ClaudeInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface ClaudeTool {
  name: string;
  description?: string;
  input_schema: ClaudeInputSchema;
}

// ============================================================
// Tool Call Types (Runtime)
// ============================================================

export interface ToolCall {
  name: string;
  arguments: unknown[];
}

export interface ToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// ============================================================
// Schema Introspection Types
// ============================================================

export interface StepSchema {
  kind: string;
  inputSchema?: ZodType;
  outputSchema?: ZodType;
  configSchema?: ZodType;
  apiSchema?: ZodType;
}

export interface EdgeSchema {
  fromKind: string;
  toKind: string;
  unidirectional: boolean;
}

export interface WorkflowSchema {
  steps: StepSchema[];
  edges: EdgeSchema[];
  currentStep?: {
    kind: string;
    name: string;
    availableActions: ActionSchema[];
  };
}

export interface ActionSchema {
  name: string;
  description?: string;
  parameters: OpenAIFunctionParameter;
  returnType?: OpenAIFunctionParameter;
}

// ============================================================
// AI Executor Types
// ============================================================

export interface AIExecutor<C extends readonly StepCreatorAny[]> {
  /**
   * Execute a tool call on the current step's API
   */
  execute(toolCall: ToolCall): Promise<ToolResult>;

  /**
   * Get available tools for the current step in OpenAI format
   */
  getOpenAITools(): OpenAITool[];

  /**
   * Get available tools for the current step in Claude format
   */
  getClaudeTools(): ClaudeTool[];

  /**
   * Subscribe to step changes and receive updated tools
   */
  onStepChange(handler: (openaiTools: OpenAITool[], claudeTools: ClaudeTool[]) => void): () => void;

  /**
   * Get introspection data for the entire workflow
   */
  introspect(): WorkflowSchema;
}

// ============================================================
// Evolution Types
// ============================================================

export type EvolutionChangeType = 'add_step' | 'remove_step' | 'modify_edge' | 'add_edge' | 'remove_edge';

export interface EvolutionChange {
  type: EvolutionChangeType;
  target: string; // step kind or edge id
  payload?: unknown;
}

export interface EvolutionSuggestion {
  id: string;
  type: EvolutionChangeType;
  rationale: string;
  change: EvolutionChange;
  confidence: number; // 0-1
}

export interface EvolutionEvent {
  id: string;
  timestamp: number;
  change: EvolutionChange;
  source: 'ai' | 'user' | 'system';
  metadata?: Record<string, unknown>;
}

export interface WorkflowEvolver<C extends readonly StepCreatorAny[]> {
  /**
   * Add a new step instance to the workflow
   */
  addStep(step: unknown): void;

  /**
   * Remove a step from the workflow by id
   */
  removeStep(stepId: string): void;

  /**
   * Connect two steps
   */
  addEdge(fromId: string, toId: string, unidirectional?: boolean): void;

  /**
   * Remove an edge between steps
   */
  removeEdge(fromId: string, toId: string): void;

  /**
   * Get AI-generated suggestions for workflow improvements
   */
  suggestImprovements(): EvolutionSuggestion[];

  /**
   * Apply a suggestion
   */
  applySuggestion(suggestionId: string): boolean;

  /**
   * Get evolution history
   */
  getHistory(): EvolutionEvent[];

  /**
   * Export workflow structure for AI analysis
   */
  exportForAI(): string;
}

// ============================================================
// Feedback Types
// ============================================================

export interface ExecutionRecord {
  stepId: string;
  stepKind: string;
  timestamp: number;
  input: unknown;
  output?: unknown;
  success: boolean;
  durationMs: number;
  toolCalls?: ToolCall[];
}

export interface FeedbackRecord {
  stepId: string;
  rating: 'positive' | 'negative' | 'neutral';
  comment?: string;
  timestamp: number;
}

export interface ExecutionInsight {
  stepKind: string;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  commonErrors: string[];
  feedbackSummary: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface FeedbackCollector {
  /**
   * Record a step execution
   */
  recordExecution(record: Omit<ExecutionRecord, 'timestamp'>): void;

  /**
   * Record user feedback
   */
  recordFeedback(feedback: Omit<FeedbackRecord, 'timestamp'>): void;

  /**
   * Get aggregated insights
   */
  getInsights(): ExecutionInsight[];

  /**
   * Get raw execution records
   */
  getExecutionHistory(): ExecutionRecord[];

  /**
   * Export data for AI analysis
   */
  exportForAnalysis(): string;

  /**
   * Clear all records
   */
  clear(): void;
}
