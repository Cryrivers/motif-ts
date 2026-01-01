# motif-ts

**Dead Simple. Fully Typed. Effortlessly Orchestrated.**

`motif-ts` is a type-safe workflow orchestrator for TypeScript. It allows you to build complex state machines and workflows with fully typed steps, dynamic edge conditions, and time-travel debugging capabilities. It is designed to be framework-agnostic while providing first-class support for React.

## Packages

This repository is a monorepo containing the following packages:

- **[`@motif-ts/core`](./packages/core)**: The core workflow engine. Defines `step`, `workflow`, and the state machine logic. [Read various core concepts and API docs](./packages/core/README.md).
- **[`@motif-ts/expression`](./packages/expression)**: A safe, side-effect-free JavaScript expression evaluator used for dynamic transition rules and data transformations.
- **[`@motif-ts/middleware`](./packages/middleware)**: Middleware for the orchestrator, including Redux DevTools integration for time-travel debugging and state persistence.
- **[`@motif-ts/react`](./packages/react)**: React bindings (hooks) to easily use workflows within React applications.
- **[`@motif-ts/vue`](./packages/vue)**: Vue bindings (composables) to use workflows within Vue applications.
- **[`@motif-ts/svelte`](./packages/svelte)**: Svelte bindings (stores) to use workflows within Svelte applications.

## Key Features

- **Type Safety**: Built with [Zod](https://zod.dev/) for runtime validation and static type inference. Inputs, outputs, and configurations are all fully typed.
- **Visualizable Workflows**: The structure of your workflow is declarative, making it easy to visualize as a graph (DAG or cyclic).
- **Time-Travel Debugging**: Seamless integration with Redux DevTools. Inspect every state change, jump back in time, and replay actions.
- **Expression Engine**: Use safe, dynamic expressions for conditional edges (e.g., `input.value > 10`) and data transformations between steps.
- **Framework Agnostic**: Core logic is pure TypeScript. Adapters for frameworks like React are provided, but you can use it anywhere.

## Usage Example

Here is a quick example of how to define a simple workflow, connect it, and use it.

### 1. Define Steps

Use the `step` helper to define atomic units of work.

- **Input/Output/Config Schemas**: Define validation and types for step data.
- **`createStore`**: define local, reactive state for the step (uses [Zustand](https://github.com/pmndrs/zustand)).
- **Lifecycle & Effects**: Use `transitionIn`, `transitionOut`, and `effect` to orchestrate side effects.

```typescript
import { step } from '@motif-ts/core';
import z from 'zod';
import { type StateCreator } from 'zustand/vanilla';

// A step that collects an email
const CollectEmail = step(
  {
    kind: 'CollectEmail',
    outputSchema: z.object({ email: z.string().email() }),
  },
  ({ next }) => ({
    submit: (email: string) => next({ email }),
  }),
);

// Define local state for verification (timer, status)
interface VerifyState {
  isChecking: boolean;
  timeLeft: number;
  decrement: () => void;
  setChecking: (checking: boolean) => void;
}

const verifyStore: StateCreator<VerifyState> = (set) => ({
  isChecking: false,
  timeLeft: 5, // 5s to verify
  decrement: () => set((s) => ({ timeLeft: Math.max(0, s.timeLeft - 1) })),
  setChecking: (isChecking) => set({ isChecking }),
});

// A step that verifies the email with a countdown and mock async check
const VerifyEmail = step(
  {
    kind: 'VerifyEmail',
    inputSchema: z.object({ email: z.string() }),
    outputSchema: z.object({ verified: z.boolean() }),
    createStore: verifyStore,
  },
  ({ input, next, store, transitionIn, transitionOut, effect }) => {
    // Lifecycle: Start countdown on entry, clean up on exit
    transitionIn(() => {
      const interval = setInterval(() => store.decrement(), 1000);
      return () => clearInterval(interval);
    });

    // Effect: React to state changes (e.g. timeout)
    effect(() => {
      if (store.timeLeft === 0) {
        // Handle timeout (e.g., disable UI or auto-transition)
        console.log('Verification timed out for:', input.email);
      }
    }, [store.timeLeft]);

    // Return the API exposed to the UI
    return {
      timeLeft: store.timeLeft,
      isChecking: store.isChecking,
      email: input.email,
      verify: async () => {
        if (store.timeLeft === 0) return;

        store.setChecking(true);
        // Simulate async verification API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const isValid = input.email.endsWith('@company.com');
        store.setChecking(false);
        next({ verified: isValid });
      },
    };
  },
);
```

### 2. Create and Connect Workflow

Combine steps into a workflow and define the flow.

```typescript
import { workflow } from '@motif-ts/core';
import { devtools } from '@motif-ts/middleware';

const orchestrator = workflow([CollectEmail, VerifyEmail]);

// Instantiate steps with unique names
const collect = CollectEmail('collect');
const verify = VerifyEmail('verify');

// Register and connect
orchestrator.register([collect, verify]);
orchestrator.connect(collect, verify);

// Enhance with DevTools middleware (optional)
const app = devtools(orchestrator);

// Start the workflow
app.start(collect);
```

### 3. Use in React

Use the provided hooks to consume the workflow state in your React components.

```tsx
import { useWorkflow } from '@motif-ts/react';

function App() {
  const current = useWorkflow(app);

  if (current.kind === 'CollectEmail') {
    return <button onClick={() => current.state.submit('user@company.com')}>Submit Email</button>;
  }

  if (current.kind === 'VerifyEmail') {
    const { timeLeft, isChecking, verify, email } = current.state;
    return (
      <div>
        <p>Verifying: {email}</p>
        <p>Time remaining: {timeLeft}s</p>
        <button disabled={isChecking || timeLeft === 0} onClick={() => verify()}>
          {isChecking ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    );
  }

  return <div>Done</div>;
}
```

### 4. Use in Vue

Use `useWorkflow` to consume the workflow state in your Vue components.

```vue
<script setup lang="ts">
import { useWorkflow } from '@motif-ts/vue';

import { app } from './workflow'; // Assuming workflow from above is exported as 'app'

const current = useWorkflow(app);
</script>

<template>
  <div v-if="current.kind === 'CollectEmail'">
    <button @click="current.state.submit('user@company.com')">Submit Email</button>
  </div>

  <div v-else-if="current.kind === 'VerifyEmail'">
    <p>Verifying: {{ current.state.email }}</p>
    <p>Time remaining: {{ current.state.timeLeft }}s</p>
    <button :disabled="current.state.isChecking || current.state.timeLeft === 0" @click="current.state.verify()">
      {{ current.state.isChecking ? 'Verifying...' : 'Verify Code' }}
    </button>
  </div>

  <div v-else>Done</div>
</template>
```

### 5. Use in Svelte

Use `createWorkflowStore` to create a reactive Svelte store.

```svelte
<script lang="ts">
  import { createWorkflowStore } from "@motif-ts/svelte";
  import { app } from "./workflow"; // Assuming workflow from above is exported as 'app'

  const current = createWorkflowStore(app);
</script>

{#if $current.kind === "CollectEmail"}
  <button on:click={() => $current.state.submit("user@company.com")}>
    Submit Email
  </button>
{:else if $current.kind === "VerifyEmail"}
  <div>
    <p>Verifying: {$current.state.email}</p>
    <p>Time remaining: {$current.state.timeLeft}s</p>
    <button
      disabled={$current.state.isChecking || $current.state.timeLeft === 0}
      on:click={() => $current.state.verify()}
    >
      {$current.state.isChecking ? "Verifying..." : "Verify Code"}
    </button>
  </div>
{:else}
  <div>Done</div>
{/if}
```

## Development

This project uses `pnpm` and `turbo`.

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run the website documentation locally
pnpm --filter website dev
```

## License

MIT
