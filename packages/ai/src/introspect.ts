import { type Edge, type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { type ZodType } from 'zod/v4';

import { extractActionsFromApiSchema } from './tools';
import { type ActionSchema, type EdgeSchema, type StepSchema, type WorkflowSchema } from './types';

/**
 * Extract schema information from a step creator
 */
function extractStepSchema(creator: StepCreatorAny): StepSchema {
  // Cast to access apiSchema which may have version-mismatched Zod types
  const creatorWithSchema = creator as unknown as {
    kind: string;
    inputSchema?: ZodType;
    outputSchema?: ZodType;
    configSchema?: ZodType;
    apiSchema?: ZodType;
  };

  return {
    kind: creatorWithSchema.kind,
    inputSchema: creatorWithSchema.inputSchema,
    outputSchema: creatorWithSchema.outputSchema,
    configSchema: creatorWithSchema.configSchema,
    apiSchema: creatorWithSchema.apiSchema,
  };
}

/**
 * Extract schema information from an edge
 */
function extractEdgeSchema(edge: Edge<unknown, unknown>): EdgeSchema {
  return {
    fromKind: edge.from.kind,
    toKind: edge.to.kind,
    unidirectional: edge.unidirectional,
  };
}

/**
 * Introspect a workflow to get all schema information.
 * Useful for AI to understand the complete workflow structure.
 */
export function introspectWorkflow<C extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<C>): WorkflowSchema {
  const internal = workflow.$$INTERNAL;

  // Extract step schemas from inventory
  const steps: StepSchema[] = [];
  for (const [_, creator] of internal.stepInventoryMap) {
    steps.push(extractStepSchema(creator));
  }

  // Extract edge schemas
  const edges: EdgeSchema[] = internal.edges.map(extractEdgeSchema);

  // Get current step info if workflow is running
  let currentStep: WorkflowSchema['currentStep'] = undefined;
  try {
    const current = workflow.getCurrentStep();
    const instance = current.instance as { apiSchema?: ZodType };
    const availableActions = extractActionsFromApiSchema(instance.apiSchema);
    currentStep = {
      kind: current.kind,
      name: current.name,
      availableActions,
    };
  } catch {
    // Workflow not started yet
  }

  return {
    steps,
    edges,
    currentStep,
  };
}

/**
 * Get available actions for the current step
 */
export function getCurrentActions<C extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<C>): ActionSchema[] {
  const current = workflow.getCurrentStep();
  const instance = current.instance as { apiSchema?: ZodType };
  return extractActionsFromApiSchema(instance.apiSchema);
}

/**
 * Get the schema for a specific step kind from inventory
 */
export function getStepSchema<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
  kind: string,
): StepSchema | undefined {
  const creator = workflow.$$INTERNAL.stepInventoryMap.get(kind);
  if (!creator) {
    return undefined;
  }
  return extractStepSchema(creator);
}

/**
 * Get all registered step instances in the workflow
 */
export function getRegisteredSteps<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
): Array<{ id: string; kind: string; name: string }> {
  const nodes = workflow.$$INTERNAL.nodes;
  return Array.from(nodes).map((node) => ({
    id: node.id,
    kind: node.kind,
    name: node.name,
  }));
}

/**
 * Get the connection graph of the workflow
 */
export function getWorkflowGraph<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
): { nodes: string[]; edges: Array<{ from: string; to: string; unidirectional: boolean }> } {
  const internal = workflow.$$INTERNAL;

  const nodeIds = Array.from(internal.nodes).map((node) => node.id);
  const edgeData = internal.edges.map((edge) => ({
    from: edge.from.id,
    to: edge.to.id,
    unidirectional: edge.unidirectional,
  }));

  return {
    nodes: nodeIds,
    edges: edgeData,
  };
}

/**
 * Export the workflow structure as a description for AI consumption
 */
export function exportWorkflowDescription<C extends readonly StepCreatorAny[]>(workflow: WorkflowAPI<C>): string {
  const schema = introspectWorkflow(workflow);

  const lines: string[] = [];
  lines.push('# Workflow Structure\n');

  lines.push('## Available Steps\n');
  for (const step of schema.steps) {
    lines.push(`### ${step.kind}`);
    if (step.inputSchema) {
      lines.push(`- Input: ${(step.inputSchema as { description?: string }).description ?? 'defined'}`);
    }
    if (step.outputSchema) {
      lines.push(`- Output: ${(step.outputSchema as { description?: string }).description ?? 'defined'}`);
    }
    lines.push('');
  }

  lines.push('## Connections\n');
  for (const edge of schema.edges) {
    const arrow = edge.unidirectional ? ' → ' : ' ↔ ';
    lines.push(`- ${edge.fromKind}${arrow}${edge.toKind}`);
  }
  lines.push('');

  if (schema.currentStep) {
    lines.push('## Current Step\n');
    lines.push(`Kind: ${schema.currentStep.kind}`);
    lines.push(`Name: ${schema.currentStep.name}`);
    lines.push('');

    if (schema.currentStep.availableActions.length > 0) {
      lines.push('### Available Actions\n');
      for (const action of schema.currentStep.availableActions) {
        lines.push(`- **${action.name}**: ${action.description ?? 'No description'}`);
      }
    }
  }

  return lines.join('\n');
}
