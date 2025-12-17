import { step, workflow } from '@motif-ts/core';
import { describe, expect, it } from 'vitest';
import z from 'zod/v4';

import persist from '../../src/persist';
import { WORKFLOW_EXPORT_SCHEMA_VERSION, type SchemaBasic, type SchemaFullState } from '../../src/persist/constants';

describe('Import workflow - basic and full', () => {
  it('imports basic configuration and replaces nodes/edges atomically', () => {
    const A = step({ kind: 'A', outputSchema: z.number() }, ({ next }) => ({ go: () => next(1) }));
    const B = step({ kind: 'B', inputSchema: z.number() }, () => ({ done: true }));

    const wf = persist(workflow([A, B]));

    const importPayload: z.infer<typeof SchemaBasic> = {
      format: 'motif-ts/basic',
      schemaVersion: WORKFLOW_EXPORT_SCHEMA_VERSION,
      nodes: [
        { id: 'A:a', kind: 'A', name: 'a', config: undefined },
        { id: 'B:b', kind: 'B', name: 'b', config: undefined },
      ],
      edges: [{ kind: 'default', from: 'A:a', to: 'B:b', unidirectional: false, config: null }],
    };

    wf.importWorkflow('basic', importPayload);
    // After import, register/connect in runtime are replaced by payload
    const exportPayload = wf.exportWorkflow('basic');
    expect(exportPayload).toEqual(importPayload);
  });

  it('imports full state and restores current and stores', () => {
    const S = step({ kind: 'S', outputSchema: z.number(), createStore: () => ({ v: 0 }) }, ({ next }) => ({
      run: () => next(1),
    }));
    const T = step({ kind: 'T', inputSchema: z.number() }, ({ input }) => ({ val: input }));
    const wf = persist(workflow([S, T]));

    const importPayload: z.infer<typeof SchemaFullState> = {
      format: 'motif-ts/full',
      schemaVersion: WORKFLOW_EXPORT_SCHEMA_VERSION,
      nodes: [
        { id: 'S:s', kind: 'S', name: 's', config: undefined },
        { id: 'T:t', kind: 'T', name: 't', config: undefined },
      ],
      edges: [{ kind: 'default', from: 'S:s', to: 'T:t', unidirectional: false, config: null }],
      state: {
        current: { nodeId: 'S:s', status: 'ready', input: undefined },
        history: [{ nodeId: 'S:s', input: undefined }],
        stores: { 'S:s': { v: 123 } },
      },
    };

    wf.importWorkflow('full', importPayload);
    const exportPayload = wf.exportWorkflow('full');
    expect(exportPayload).toEqual(importPayload);
  });

  it('rejects invalid schema version', () => {
    const A = step({ kind: 'A' }, () => ({ ok: true }));
    const wf = persist(workflow([A]));
    const badPayload: z.infer<typeof SchemaBasic> = {
      format: 'motif-ts/basic',
      // @ts-expect-error
      schemaVersion: '0.0.1',
      nodes: [{ id: 'A:a', kind: 'A', name: 'a' }],
      edges: [],
    };
    expect(() => wf.importWorkflow('basic', badPayload)).toThrow();
  });

  it('rejects when edge references unknown node', () => {
    const A = step({ kind: 'A' }, () => ({ ok: true }));
    const wf = persist(workflow([A]));
    const badPayload: z.infer<typeof SchemaBasic> = {
      format: 'motif-ts/basic',
      schemaVersion: WORKFLOW_EXPORT_SCHEMA_VERSION,
      nodes: [{ id: 'A:a', kind: 'A', name: 'a' }],
      edges: [{ kind: 'default', from: 'A:a', to: 'B:b', unidirectional: false }],
    };
    expect(() => wf.importWorkflow('basic', badPayload)).toThrow();
  });
});
