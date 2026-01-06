import { type StepCreatorAny, type StepInstance, type WorkflowAPI } from '@motif-ts/core';

import { exportWorkflowDescription } from './introspect';
import { type EvolutionChange, type EvolutionEvent, type EvolutionSuggestion, type WorkflowEvolver } from './types';

/**
 * Create a workflow evolver that allows runtime modifications.
 * This enables AI agents to suggest and apply workflow improvements.
 */
export function createEvolver<C extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<C>): WorkflowEvolver<C> {
  const history: EvolutionEvent[] = [];
  const suggestions: Map<string, EvolutionSuggestion> = new Map();
  let suggestionCounter = 0;

  const recordEvent = (change: EvolutionChange, source: 'ai' | 'user' | 'system' = 'user'): void => {
    const event: EvolutionEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      change,
      source,
    };
    history.push(event);
  };

  /**
   * Add a new step instance to the workflow
   */
  const addStep = (step: unknown): void => {
    const internal = workflow.$$INTERNAL;
    const stepInstance = step as StepInstance<unknown, unknown, unknown, Record<string, unknown>, unknown>;

    // Check if step kind is in inventory
    if (!internal.stepInventoryMap.has(stepInstance.kind)) {
      throw new Error(`Step kind '${stepInstance.kind}' not in workflow inventory. Cannot add.`);
    }

    // Check if step is already registered
    for (const node of internal.nodes) {
      if (node.id === stepInstance.id) {
        throw new Error(`Step with id '${stepInstance.id}' already exists.`);
      }
    }

    internal.nodes.add(stepInstance);
    recordEvent({ type: 'add_step', target: stepInstance.id });
  };

  /**
   * Remove a step from the workflow
   */
  const removeStep = (stepId: string): void => {
    const internal = workflow.$$INTERNAL;

    let foundNode: StepInstance<unknown, unknown, unknown, Record<string, unknown>, unknown> | undefined;
    for (const node of internal.nodes) {
      if (node.id === stepId) {
        foundNode = node;
        break;
      }
    }

    if (!foundNode) {
      throw new Error(`Step with id '${stepId}' not found.`);
    }

    // Remove all edges connected to this step
    const edgesToRemove = internal.edges.filter((e) => e.from.id === stepId || e.to.id === stepId);
    for (const edge of edgesToRemove) {
      const index = internal.edges.indexOf(edge);
      if (index !== -1) {
        internal.edges.splice(index, 1);
      }
    }

    internal.nodes.delete(foundNode);
    recordEvent({ type: 'remove_step', target: stepId });
  };

  /**
   * Add an edge between two steps
   */
  const addEdge = (fromId: string, toId: string, unidirectional = false): void => {
    const internal = workflow.$$INTERNAL;

    let fromNode: StepInstance<unknown, unknown, unknown, Record<string, unknown>, unknown> | undefined;
    let toNode: StepInstance<unknown, unknown, unknown, Record<string, unknown>, unknown> | undefined;

    for (const node of internal.nodes) {
      if (node.id === fromId) fromNode = node;
      if (node.id === toId) toNode = node;
    }

    if (!fromNode) {
      throw new Error(`Source step '${fromId}' not found.`);
    }
    if (!toNode) {
      throw new Error(`Target step '${toId}' not found.`);
    }

    // Check if edge already exists
    const existing = internal.edges.find((e) => e.from.id === fromId && e.to.id === toId);
    if (existing) {
      throw new Error(`Edge from '${fromId}' to '${toId}' already exists.`);
    }

    // Create a simple edge
    internal.edges.push({
      kind: 'serializable',
      from: fromNode,
      to: toNode,
      unidirectional,
      serializable: true,
      validateTransition: (output: unknown) => ({ allow: true, nextInput: output }),
    });

    recordEvent({
      type: 'add_edge',
      target: `${fromId}->${toId}`,
      payload: { unidirectional },
    });
  };

  /**
   * Remove an edge between steps
   */
  const removeEdge = (fromId: string, toId: string): void => {
    const internal = workflow.$$INTERNAL;

    const index = internal.edges.findIndex((e) => e.from.id === fromId && e.to.id === toId);
    if (index === -1) {
      throw new Error(`Edge from '${fromId}' to '${toId}' not found.`);
    }

    internal.edges.splice(index, 1);
    recordEvent({ type: 'remove_edge', target: `${fromId}->${toId}` });
  };

  /**
   * Generate suggestions for workflow improvements.
   * These are based on simple heuristics; for real AI suggestions,
   * you'd integrate with an LLM.
   */
  const suggestImprovements = (): EvolutionSuggestion[] => {
    const internal = workflow.$$INTERNAL;
    const newSuggestions: EvolutionSuggestion[] = [];

    // Heuristic 1: Find steps with no incoming edges (potential entry points)
    const nodesWithIncoming = new Set<string>();
    for (const edge of internal.edges) {
      nodesWithIncoming.add(edge.to.id);
    }

    // Heuristic 2: Find steps with no outgoing edges (potential terminal steps)
    const nodesWithOutgoing = new Set<string>();
    for (const edge of internal.edges) {
      nodesWithOutgoing.add(edge.from.id);
    }

    // Find isolated steps (no edges at all)
    for (const node of internal.nodes) {
      if (!nodesWithIncoming.has(node.id) && !nodesWithOutgoing.has(node.id)) {
        const id = `sug_${++suggestionCounter}`;
        const suggestion: EvolutionSuggestion = {
          id,
          type: 'remove_step',
          rationale: `Step '${node.id}' is isolated with no connections.`,
          change: { type: 'remove_step', target: node.id },
          confidence: 0.6,
        };
        suggestions.set(id, suggestion);
        newSuggestions.push(suggestion);
      }
    }

    return newSuggestions;
  };

  /**
   * Apply a previously generated suggestion
   */
  const applySuggestion = (suggestionId: string): boolean => {
    const suggestion = suggestions.get(suggestionId);
    if (!suggestion) {
      return false;
    }

    try {
      switch (suggestion.change.type) {
        case 'remove_step':
          removeStep(suggestion.change.target);
          break;
        case 'add_edge':
          if (suggestion.change.payload) {
            const { from, to, unidirectional } = suggestion.change.payload as {
              from: string;
              to: string;
              unidirectional: boolean;
            };
            addEdge(from, to, unidirectional);
          }
          break;
        case 'remove_edge': {
          const [fromId, toId] = suggestion.change.target.split('->');
          removeEdge(fromId, toId);
          break;
        }
        default:
          return false;
      }

      suggestions.delete(suggestionId);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Get evolution history
   */
  const getHistory = (): EvolutionEvent[] => {
    return [...history];
  };

  /**
   * Export workflow structure for AI analysis
   */
  const exportForAI = (): string => {
    return exportWorkflowDescription(workflow);
  };

  return {
    addStep,
    removeStep,
    addEdge,
    removeEdge,
    suggestImprovements,
    applySuggestion,
    getHistory,
    exportForAI,
  };
}

// =============================================================================
// AI-Powered Evolution with LLM Integration
// =============================================================================

/**
 * Options for creating an AI-powered evolver
 */
export interface AIEvolverOptions {
  /**
   * Function to call an LLM with a prompt and get a response.
   * This abstracts the LLM provider (OpenAI, Anthropic, etc.)
   */
  callLLM: (prompt: string) => Promise<string>;

  /**
   * Optional feedback collector for analyzing execution patterns
   */
  feedbackCollector?: {
    getInsights: () => Array<{
      stepKind: string;
      totalExecutions: number;
      successRate: number;
      averageDuration: number;
      commonErrors: string[];
    }>;
    exportForAnalysis: () => string;
  };
}

/**
 * AI-powered evolver interface with LLM integration
 */
export interface AIEvolver<C extends readonly StepCreatorAny[]> extends WorkflowEvolver<C> {
  /**
   * Use LLM to analyze workflow and suggest intelligent improvements
   */
  suggestWithAI(): Promise<EvolutionSuggestion[]>;

  /**
   * Get a natural language explanation of the workflow for humans
   */
  explainWorkflow(): Promise<string>;
}

/**
 * Build a prompt for the LLM to analyze workflow and suggest improvements
 */
function buildEvolutionPrompt(workflowDescription: string, insights?: string): string {
  let prompt = `You are an AI workflow optimization expert. Analyze the following workflow and suggest improvements.

## Workflow Structure
${workflowDescription}
`;

  if (insights) {
    prompt += `
## Execution Insights
${insights}
`;
  }

  prompt += `
## Task
Analyze this workflow and suggest improvements. Consider:
1. Are there redundant steps that could be merged?
2. Are there missing error handling steps?
3. Could parallel execution improve performance?
4. Are there steps with high failure rates that need attention?
5. Is the flow logical and user-friendly?

Respond with a JSON array of suggestions in this format:
[
  {
    "type": "add_step" | "remove_step" | "add_edge" | "remove_edge" | "modify_edge",
    "rationale": "Explanation of why this change would help",
    "target": "step_id or edge description",
    "confidence": 0.0-1.0
  }
]

Only respond with the JSON array, no additional text.`;

  return prompt;
}

/**
 * Parse evolution suggestions from LLM response
 */
function parseEvolutionSuggestions(response: string): EvolutionSuggestion[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      type: string;
      rationale: string;
      target: string;
      confidence: number;
    }>;

    return parsed.map((item, index) => ({
      id: `ai_sug_${Date.now()}_${index}`,
      type: item.type as EvolutionSuggestion['type'],
      rationale: item.rationale,
      change: {
        type: item.type as EvolutionChange['type'],
        target: item.target,
      },
      confidence: item.confidence ?? 0.5,
    }));
  } catch {
    return [];
  }
}

/**
 * Create an AI-powered workflow evolver that uses LLM for intelligent suggestions.
 *
 * This extends the basic evolver with LLM capabilities, allowing workflows
 * to evolve themselves based on execution patterns and AI analysis.
 *
 * @example
 * ```typescript
 * import OpenAI from 'openai';
 * const openai = new OpenAI();
 *
 * const aiEvolver = createAIEvolver(workflow, {
 *   callLLM: async (prompt) => {
 *     const response = await openai.chat.completions.create({
 *       model: 'gpt-4o-mini',
 *       messages: [{ role: 'user', content: prompt }],
 *     });
 *     return response.choices[0].message.content ?? '';
 *   },
 *   feedbackCollector,
 * });
 *
 * // Get AI-powered suggestions
 * const suggestions = await aiEvolver.suggestWithAI();
 * ```
 */
export function createAIEvolver<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
  options: AIEvolverOptions,
): AIEvolver<C> {
  // Create the base evolver
  const baseEvolver = createEvolver(workflow);
  const aiSuggestions: Map<string, EvolutionSuggestion> = new Map();

  /**
   * Use LLM to analyze workflow and suggest improvements
   */
  const suggestWithAI = async (): Promise<EvolutionSuggestion[]> => {
    const workflowDescription = exportWorkflowDescription(workflow);
    const insights = options.feedbackCollector?.exportForAnalysis();

    const prompt = buildEvolutionPrompt(workflowDescription, insights);
    const response = await options.callLLM(prompt);

    const suggestions = parseEvolutionSuggestions(response);

    // Store suggestions for later application
    for (const suggestion of suggestions) {
      aiSuggestions.set(suggestion.id, suggestion);
    }

    return suggestions;
  };

  /**
   * Get a natural language explanation of the workflow
   */
  const explainWorkflow = async (): Promise<string> => {
    const workflowDescription = exportWorkflowDescription(workflow);

    const prompt = `You are a helpful assistant explaining a workflow to a user.

## Workflow Structure
${workflowDescription}

## Task
Provide a clear, user-friendly explanation of this workflow. Describe:
1. What the workflow does overall
2. Each step and its purpose
3. How steps connect to each other
4. Any notable features or patterns

Keep the explanation concise but informative.`;

    return options.callLLM(prompt);
  };

  /**
   * Enhanced applySuggestion that handles AI suggestions
   */
  const applySuggestion = (suggestionId: string): boolean => {
    // First try AI suggestions
    const aiSuggestion = aiSuggestions.get(suggestionId);
    if (aiSuggestion) {
      try {
        switch (aiSuggestion.change.type) {
          case 'remove_step':
            baseEvolver.removeStep(aiSuggestion.change.target);
            break;
          case 'add_edge': {
            // Parse target format: "StepA->StepB"
            const parts = aiSuggestion.change.target.split('->');
            if (parts.length === 2) {
              baseEvolver.addEdge(parts[0].trim(), parts[1].trim());
            }
            break;
          }
          case 'remove_edge': {
            const parts = aiSuggestion.change.target.split('->');
            if (parts.length === 2) {
              baseEvolver.removeEdge(parts[0].trim(), parts[1].trim());
            }
            break;
          }
        }
        aiSuggestions.delete(suggestionId);
        return true;
      } catch {
        return false;
      }
    }

    // Fall back to base evolver
    return baseEvolver.applySuggestion(suggestionId);
  };

  return {
    ...baseEvolver,
    applySuggestion,
    suggestWithAI,
    explainWorkflow,
  };
}
