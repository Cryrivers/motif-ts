import { step, workflow } from '@motif-ts/core';
import { describe, expect, it } from 'vitest';
import z from 'zod/v4';

import { exportWorkflowDescription, getRegisteredSteps, getWorkflowGraph, introspectWorkflow } from '../src';

describe('Schema Introspection', () => {
  // Define test steps using z.any() for api fields which is the pattern used in core tests
  const CollectEmail = step(
    {
      kind: 'CollectEmail',
      outputSchema: z.object({ email: z.string().email() }),
      apiSchema: z.object({
        submit: z.any(), // z.any() is recommended for function types in apiSchema
      }),
    },
    ({ next }) => ({
      submit: (email: string) => next({ email }),
    }),
  );

  const VerifyEmail = step(
    {
      kind: 'VerifyEmail',
      inputSchema: z.object({ email: z.string() }),
      outputSchema: z.object({ verified: z.boolean() }),
      apiSchema: z.object({
        verify: z.any(),
        cancel: z.any(),
      }),
    },
    ({ input, next }) => ({
      verify: () => next({ verified: true }),
      cancel: () => next({ verified: false }),
    }),
  );

  describe('introspectWorkflow', () => {
    it('should extract step schemas from workflow inventory', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);
      wf.connect(collect, verify);

      const schema = introspectWorkflow(wf);

      expect(schema.steps).toHaveLength(2);
      expect(schema.steps.map((s) => s.kind)).toContain('CollectEmail');
      expect(schema.steps.map((s) => s.kind)).toContain('VerifyEmail');
    });

    it('should extract edge schemas', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);
      wf.connect(collect, verify, true); // unidirectional

      const schema = introspectWorkflow(wf);

      expect(schema.edges).toHaveLength(1);
      expect(schema.edges[0]).toEqual({
        fromKind: 'CollectEmail',
        toKind: 'VerifyEmail',
        unidirectional: true,
      });
    });

    it('should include current step info when workflow is running', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);
      wf.connect(collect, verify);
      wf.start(collect);

      const schema = introspectWorkflow(wf);

      expect(schema.currentStep).toBeDefined();
      expect(schema.currentStep?.kind).toBe('CollectEmail');
      expect(schema.currentStep?.name).toBe('collect');
    });
  });

  describe('getRegisteredSteps', () => {
    it('should return all registered step instances', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);

      const steps = getRegisteredSteps(wf);

      expect(steps).toHaveLength(2);
      expect(steps).toContainEqual({ id: 'CollectEmail:collect', kind: 'CollectEmail', name: 'collect' });
      expect(steps).toContainEqual({ id: 'VerifyEmail:verify', kind: 'VerifyEmail', name: 'verify' });
    });
  });

  describe('getWorkflowGraph', () => {
    it('should return the workflow graph structure', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);
      wf.connect(collect, verify);

      const graph = getWorkflowGraph(wf);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({
        from: 'CollectEmail:collect',
        to: 'VerifyEmail:verify',
        unidirectional: false,
      });
    });
  });

  describe('exportWorkflowDescription', () => {
    it('should generate markdown description of workflow', () => {
      const wf = workflow([CollectEmail, VerifyEmail]);
      const collect = CollectEmail('collect');
      const verify = VerifyEmail('verify');

      wf.register([collect, verify]);
      wf.connect(collect, verify);
      wf.start(collect);

      const description = exportWorkflowDescription(wf);

      expect(description).toContain('# Workflow Structure');
      expect(description).toContain('## Available Steps');
      expect(description).toContain('CollectEmail');
      expect(description).toContain('VerifyEmail');
      expect(description).toContain('## Connections');
      expect(description).toContain('## Current Step');
    });
  });
});
