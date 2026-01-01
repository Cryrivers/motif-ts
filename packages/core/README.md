# @motif-ts/core

The core engine for `motif-ts`. This package provides the foundational primitives for defining steps, workflows, and the state machine logic that orchestrates them.

For a high-level overview and Quick Start, please see the [root README](../../README.md).

## Concepts

`@motif-ts/core` is built around a few specific concepts that enable deterministic, type-safe orchestration:

1.  **Steps**: Atomic units of logic with lifecycle hooks (`transitionIn`, `transitionOut`) and reactive effects.
2.  **Workflow**: The orchestrator that manages the state machine, transitions, and history.
3.  **Edges**: The connections between steps (Default, Unidirectional, Conditional, Transform).
4.  **Store**: Local, reactive state for steps (powered by Zustand).

## API Reference

### Defining Steps

Use the `step` helper to create step definitions. These are "blueprints" or "classes" for your steps.

```typescript
import { step } from '@motif-ts/core';
import z from 'zod';

const MyStep = step(
  {
    kind: 'MyStep',
    inputSchema: z.string(), // Input type validation
    outputSchema: z.number(), // Output type validation
  },
  ({ input, next, transitionIn, effect }) => {
    // ... logic
    return {
      /* Public API exposed to UI */
    };
  },
);
```

## Lifecycle Hooks and Effects

- `transitionIn(hook)` runs once on entering a step. Return a cleanup to run when leaving.
- `transitionOut(hook)` runs once before leaving a step. Return a cleanup; stored and executed when navigating back into this step.
- `effect(fn, deps?)` runs on initial build and rebuilds. Return a cleanup. Dependency behavior:
  - `deps` omitted: runs on every rebuild
  - `deps` `[]`: runs once on first mount
  - `deps` with values: runs when shallowly unequal to previous

Cleanup execution order when leaving a step:

1. Run `transitionOut` hooks (and invoke any returned cleanup)
2. Run `effect` cleanups
3. Run `transitionIn` cleanups

Errors thrown inside hooks or cleanups are caught and ignored to preserve flow. Hooks may be `async` and can return a `Promise<CleanupFn>`:

- `transitionIn`: when an async hook resolves, its cleanup is registered and will run on exit; if the step exits before resolution, the cleanup is invoked immediately upon resolution to prevent leaks.
- `transitionOut`: when an async hook resolves, its cleanup is collected to run when navigating back into that step; if back has already occurred before resolution, the cleanup is invoked immediately upon resolution.

Promise rejections in hooks are logged and swallowed to maintain workflow continuity.

## Edges and Navigation

- Default edge (`connect(a, b)`): bidirectional forward/back.
- Unidirectional: `connect(a, b, true)` blocks `back()` when returning from `b` to `a`.
- Conditional: gate transitions by predicate.

```ts
import { conditionalEdge } from '@motif-ts/core';

orchestrator.connect<number, number>(conditionalEdge(a, b, (out) => out % 2 === 0));
```

- Transform: convert output type to next input type; throws with clear message if conversion fails.

```ts
import { transformEdge } from '@motif-ts/core';

orchestrator.connect(transformEdge(a, b, (out) => ({ username: out.name, years: out.age })));
```

- Forward transitions validate `output` via Zod (if provided) and select the first outgoing edge that allows the move. If none allow, an error is thrown (`'Transition blocked by edge condition'`). If there are no outgoing edges, the workflow finishes and triggers `subscribeWorkflowFinish` listeners.

Back navigation re‑enters the previous step with its original input and executes previously collected `transitionOut` cleanups for that step. If the connecting edge is `unidirectional`, `back()` throws a clear error.

## Store Integration (Zustand)

Steps can optionally define a store via `createStore`. The store state is exposed as `store` in build args and drives rebuilds.

```ts
import { type StateCreator } from 'zustand/vanilla';

const sStore: StateCreator<{ n: number; inc: () => void }> = (set) => ({
  n: 0,
  inc: () => set((prev) => ({ n: prev.n + 1 })),
});

const S = Step(
  { kind: 'S', outputSchema: z.object({ n: z.number() }), createStore: sStore },
  ({ store, effect, next }) => {
    effect(() => undefined, [store.n]);
    return {
      count: store.n,
      bump: () => store.inc(),
      goNext: () => next({ n: store.n }),
    };
  },
);
```

When the store updates, the orchestrator rebuilds the current step, re‑evaluates effects (with dependency diffing), and emits a `ready` notification.

## Notifications and Current Step

Subscribe to transitions and read current step state:

```ts
const events: Array<{ kind: string; name: string; status: string }> = [];
const unsub = orchestrator.subscribeStepChange((kind, name, status) => {
  events.push({ kind, name, status });
});

const cur = orchestrator.getCurrentStep();
// cur.status: 'notStarted' | 'transitionIn' | 'ready' | 'transitionOut'
// cur.state: API returned by your step's build function

unsub();
```

## Step Variants and Build Args

`Step` supports combinations of:

- `inputSchema` (optional)
- `outputSchema` (optional)
- `configSchema` (optional)
- `createStore` (optional)

Build args include:

- Always: `name`, `next`, `transitionIn`, `transitionOut`, `effect`
- Plus `input` when `inputSchema` is present
- Plus `config` when `configSchema` is present
- Plus `store` when `createStore` is present

## Inventory and Registration

- Create orchestrator with an inventory of step creators: `new workflow([A, B, ...])`
- Each `kind` must be unique; duplicates throw a detailed error
- Register step instances before connecting/starting: `orchestrator.register([a, b])`
- `connect` requires registered instances; `start` requires a registered instance from the inventory

## Error Handling

- Zod validation errors surface when output or next input fails to parse
- Conditional edges that block transitions throw `'Transition blocked by edge condition'`
- Missing outgoing edges trigger the workflow finish sequence.
- `back()` throws when attempting to reverse a `unidirectional` edge
- Hook/effect cleanups swallow errors to maintain flow

## Notes

- Hooks may be `async`, but cleanup functions must be returned synchronously
- Works in Node and browsers; React integration is optional
