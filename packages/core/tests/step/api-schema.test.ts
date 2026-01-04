import { describe, expect, expectTypeOf, it } from 'vitest';
import z from 'zod/v4';

import { step, workflow } from '../../src';

describe('Step with apiSchema', () => {
  it('should store apiSchema on the step instance', () => {
    const apiSchema = z.object({
      greet: z.any(),
    });

    const MyStep = step(
      {
        kind: 'MyStep',
        apiSchema,
      },
      () => {
        return {
          greet: (name: string) => `Hello, ${name}!`,
        };
      },
    );

    const instance = MyStep();
    expect(instance.apiSchema).toBe(apiSchema);
    expect(instance.apiSchema).toBeDefined();
  });

  it('should allow optional apiSchema', () => {
    const MyStep = step(
      {
        kind: 'MyStepNoApiSchema',
      },
      () => {
        return {
          greet: (name: string) => `Hello, ${name}!`,
        };
      },
    );

    const instance = MyStep();
    expect(instance.apiSchema).toBeUndefined();
  });

  it('should work with apiSchema and configSchema', () => {
    const apiSchema = z.object({
      greet: z.any(),
    });

    const MyStep = step(
      {
        kind: 'MyStepWithConfig',
        configSchema: z.object({ name: z.string() }),
        apiSchema,
      },
      ({ config }) => {
        return {
          greet: () => `Hello, ${config.name}!`,
        };
      },
    );

    const instance = MyStep({ name: 'World' });
    expect(instance.apiSchema).toBe(apiSchema);
    expect(instance.config).toEqual({ name: 'World' });
  });
  it('should infer API type from apiSchema', () => {
    const apiSchema = z.object({
      greet: z.function({ input: z.tuple([z.string()]), output: z.string() }),
    });

    const MyStep = step(
      {
        kind: 'MyStepWithInferredApi',
        apiSchema,
      },
      () => {
        return {
          greet: (name: string) => `Hello, ${name}!`,
        };
      },
    );
    const instance = MyStep();
    expectTypeOf(instance.build).returns.toEqualTypeOf<{ greet: (arg: string) => string }>();
  });

  it('should constrain API return type when apiSchema is provided', () => {
    const apiSchema = z.object({
      foo: z.string(),
    });

    // @ts-expect-error - 'bar' is not in apiSchema
    step({ kind: 'InvalidApi', apiSchema }, () => ({ bar: 'baz' }));
    step(
      {
        kind: 'ValidApi',
        apiSchema,
      },
      () => ({ foo: 'bar' }),
    );
  });
});
