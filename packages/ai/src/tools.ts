import { type StepCreatorAny, type WorkflowAPI } from '@motif-ts/core';
import { type ZodObject, type ZodRawShape, type ZodType } from 'zod/v4';

import { type ActionSchema, type ClaudeTool, type OpenAIFunctionParameter, type OpenAITool } from './types';

/**
 * Extract description from a Zod schema if available
 */
function extractDescription(schema: ZodType): string | undefined {
  return (schema as { description?: string }).description;
}

/**
 * Convert a Zod schema to JSON Schema format for function parameters.
 * We use a simplified approach compatible with Zod v4.
 */
function zodToParameterSchema(schema: ZodType): OpenAIFunctionParameter {
  const def = (schema as unknown as { _zod: { def: { type?: string } } })._zod?.def;
  const typeName = def?.type ?? 'unknown';

  // Handle different types
  switch (typeName) {
    case 'string':
      return { type: 'string', description: extractDescription(schema) };
    case 'number':
      return { type: 'number', description: extractDescription(schema) };
    case 'boolean':
      return { type: 'boolean', description: extractDescription(schema) };
    case 'object': {
      const objSchema = schema as ZodObject<ZodRawShape>;
      const shape = objSchema.shape;
      const properties: Record<string, OpenAIFunctionParameter> = {};
      const required: string[] = [];

      for (const [key, fieldSchema] of Object.entries(shape)) {
        properties[key] = zodToParameterSchema(fieldSchema as ZodType);
        // Check if field is optional
        const fieldDef = (fieldSchema as unknown as { _zod?: { def?: { type?: string } } })._zod?.def;
        if (fieldDef?.type !== 'optional') {
          required.push(key);
        }
      }

      return {
        type: 'object',
        description: extractDescription(schema),
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
    case 'array': {
      const itemsDef = (schema as unknown as { _zod: { def: { element?: ZodType } } })._zod?.def?.element;
      return {
        type: 'array',
        description: extractDescription(schema),
        items: itemsDef ? zodToParameterSchema(itemsDef) : { type: 'string' },
      };
    }
    default:
      return { type: 'string', description: extractDescription(schema) };
  }
}

/**
 * Check if a Zod schema is a function type
 */
function isZodFunction(schema: ZodType): boolean {
  const def = (schema as unknown as { _zod?: { def?: { type?: string } } })._zod?.def;
  return def?.type === 'function';
}

/**
 * Check if a Zod schema is an object type
 */
function isZodObject(schema: ZodType): schema is ZodObject<ZodRawShape> {
  const def = (schema as unknown as { _zod?: { def?: { type?: string } } })._zod?.def;
  return def?.type === 'object';
}

/**
 * Extract function properties from a ZodObject apiSchema.
 * Each function property becomes an available action/tool.
 */
function extractActionsFromApiSchema(apiSchema: ZodType | undefined): ActionSchema[] {
  if (!apiSchema || !isZodObject(apiSchema)) {
    return [];
  }

  const actions: ActionSchema[] = [];
  const shape = apiSchema.shape;

  for (const [name, fieldSchema] of Object.entries(shape)) {
    const typedSchema = fieldSchema as ZodType;

    if (isZodFunction(typedSchema)) {
      // Extract function parameters from ZodFunction
      const funcDef = (
        typedSchema as unknown as {
          _zod: { def: { args?: ZodType; returns?: ZodType } };
        }
      )._zod?.def;
      const argsSchema = funcDef?.args;
      const returnsSchema = funcDef?.returns;

      // Build parameters schema from args
      let parameters: OpenAIFunctionParameter = { type: 'object', properties: {} };
      if (argsSchema) {
        // args is typically a tuple, extract items
        const argsDef = (argsSchema as unknown as { _zod: { def: { items?: ZodType[] } } })._zod?.def;
        const items = argsDef?.items ?? [];
        const props: Record<string, OpenAIFunctionParameter> = {};
        const required: string[] = [];

        items.forEach((item: ZodType, index: number) => {
          const paramName = `arg${index}`;
          props[paramName] = zodToParameterSchema(item);
          if (extractDescription(item)) {
            props[paramName].description = extractDescription(item);
          }
          required.push(paramName);
        });

        parameters = {
          type: 'object',
          properties: props,
          required: required.length > 0 ? required : undefined,
        };
      }

      actions.push({
        name,
        description: extractDescription(typedSchema),
        parameters,
        returnType: returnsSchema ? zodToParameterSchema(returnsSchema) : undefined,
      });
    }
  }

  return actions;
}

/**
 * Convert actions to OpenAI Tools format
 */
export function actionsToOpenAITools(actions: ActionSchema[], prefix = ''): OpenAITool[] {
  return actions.map((action) => ({
    type: 'function' as const,
    function: {
      name: `${prefix}${action.name}`,
      description: action.description,
      parameters: action.parameters,
    },
  }));
}

/**
 * Convert actions to Claude Tools format
 */
export function actionsToClaudeTools(actions: ActionSchema[], prefix = ''): ClaudeTool[] {
  return actions.map((action) => ({
    name: `${prefix}${action.name}`,
    description: action.description,
    input_schema: {
      type: 'object' as const,
      properties: action.parameters.properties ?? {},
      required: action.parameters.required,
    },
  }));
}

/**
 * Get OpenAI tools from the current step of a workflow
 */
export function toOpenAITools<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
  options: { prefix?: string } = {},
): OpenAITool[] {
  const current = workflow.getCurrentStep();
  const instance = current.instance as { apiSchema?: ZodType };
  const apiSchema = instance.apiSchema;

  if (!apiSchema) {
    return [];
  }

  const actions = extractActionsFromApiSchema(apiSchema);
  const prefix = options.prefix ?? `${current.kind}.`;

  return actionsToOpenAITools(actions, prefix);
}

/**
 * Get Claude tools from the current step of a workflow
 */
export function toClaudeTools<C extends readonly StepCreatorAny[]>(
  workflow: WorkflowAPI<C>,
  options: { prefix?: string } = {},
): ClaudeTool[] {
  const current = workflow.getCurrentStep();
  const instance = current.instance as { apiSchema?: ZodType };
  const apiSchema = instance.apiSchema;

  if (!apiSchema) {
    return [];
  }

  const actions = extractActionsFromApiSchema(apiSchema);
  const prefix = options.prefix ?? `${current.kind}.`;

  return actionsToClaudeTools(actions, prefix);
}

/**
 * Convert a step's input schema to an OpenAI tool for AI to provide step input
 */
export function inputSchemaToOpenAITool(stepKind: string, inputSchema: ZodType): OpenAITool {
  return {
    type: 'function',
    function: {
      name: `provide_${stepKind}_input`,
      description: extractDescription(inputSchema) ?? `Provide input for ${stepKind} step`,
      parameters: zodToParameterSchema(inputSchema),
    },
  };
}

/**
 * Convert a step's input schema to a Claude tool for AI to provide step input
 */
export function inputSchemaToClaudeTool(stepKind: string, inputSchema: ZodType): ClaudeTool {
  const jsonSchema = zodToParameterSchema(inputSchema);
  return {
    name: `provide_${stepKind}_input`,
    description: extractDescription(inputSchema) ?? `Provide input for ${stepKind} step`,
    input_schema: {
      type: 'object',
      properties: jsonSchema.properties ?? {},
      required: jsonSchema.required,
    },
  };
}

export { extractActionsFromApiSchema, zodToParameterSchema };
