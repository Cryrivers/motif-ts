import { step, workflow } from '@motif-ts/core';
import { describe, expect, it } from 'vitest';
import z from 'zod/v4';

import { createEvolver } from '../src';

describe('Workflow Evolution', () => {
  const StepA = step({ kind: 'StepA', outputSchema: z.object({ value: z.string() }) }, ({ next }) => ({
    submit: (value: string) => next({ value }),
  }));

  const StepB = step({ kind: 'StepB', inputSchema: z.object({ value: z.string() }) }, () => ({
    display: () => 'displayed',
  }));

  describe('createEvolver', () => {
    it('should create an evolver with all required methods', () => {
      const wf = workflow([StepA, StepB]);
      const evolver = createEvolver(wf);

      expect(evolver.addStep).toBeInstanceOf(Function);
      expect(evolver.removeStep).toBeInstanceOf(Function);
      expect(evolver.addEdge).toBeInstanceOf(Function);
      expect(evolver.removeEdge).toBeInstanceOf(Function);
      expect(evolver.suggestImprovements).toBeInstanceOf(Function);
      expect(evolver.getHistory).toBeInstanceOf(Function);
      expect(evolver.exportForAI).toBeInstanceOf(Function);
    });

    it('should add new step instances', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');

      wf.register(a);

      const evolver = createEvolver(wf);
      const b = StepB('b');

      evolver.addStep(b);

      // Verify step was added
      const nodes = Array.from(wf.$$INTERNAL.nodes);
      expect(nodes).toContainEqual(b);
    });

    it('should throw when adding step with unknown kind', () => {
      const wf = workflow([StepA]);
      const evolver = createEvolver(wf);
      const b = StepB('b');

      expect(() => evolver.addStep(b)).toThrow('not in workflow inventory');
    });

    it('should remove step instances and related edges', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');
      const b = StepB('b');

      wf.register([a, b]);
      wf.connect(a, b);

      const evolver = createEvolver(wf);
      evolver.removeStep('StepA:a');

      // Verify step was removed
      const nodes = Array.from(wf.$$INTERNAL.nodes);
      expect(nodes).not.toContainEqual(a);

      // Verify edges were also removed
      expect(wf.$$INTERNAL.edges).toHaveLength(0);
    });

    it('should add edges between steps', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');
      const b = StepB('b');

      wf.register([a, b]);

      const evolver = createEvolver(wf);
      evolver.addEdge('StepA:a', 'StepB:b', true);

      expect(wf.$$INTERNAL.edges).toHaveLength(1);
      expect(wf.$$INTERNAL.edges[0].unidirectional).toBe(true);
    });

    it('should remove edges between steps', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');
      const b = StepB('b');

      wf.register([a, b]);
      wf.connect(a, b);

      const evolver = createEvolver(wf);
      evolver.removeEdge('StepA:a', 'StepB:b');

      expect(wf.$$INTERNAL.edges).toHaveLength(0);
    });

    it('should track evolution history', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');
      const b = StepB('b');

      wf.register([a, b]);

      const evolver = createEvolver(wf);
      evolver.addEdge('StepA:a', 'StepB:b');
      evolver.removeEdge('StepA:a', 'StepB:b');

      const history = evolver.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].change.type).toBe('add_edge');
      expect(history[1].change.type).toBe('remove_edge');
    });

    it('should export workflow for AI analysis', () => {
      const wf = workflow([StepA, StepB]);
      const a = StepA('a');
      const b = StepB('b');

      wf.register([a, b]);
      wf.connect(a, b);

      const evolver = createEvolver(wf);
      const exportedText = evolver.exportForAI();

      expect(exportedText).toContain('Workflow Structure');
      expect(exportedText).toContain('StepA');
      expect(exportedText).toContain('StepB');
    });
  });
});
