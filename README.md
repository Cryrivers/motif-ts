# motif-ts

**Dead Simple. Fully Typed. Effortlessly Orchestrated.**

`motif-ts` is a type-safe workflow orchestrator for TypeScript. It allows you to build complex state machines and workflows with fully typed steps, dynamic edge conditions, and time-travel debugging capabilities. It is designed to be framework-agnostic while providing first-class support for React.

## Packages

This repository is a monorepo containing the following packages:

- **[`@motif-ts/core`](./packages/core)**: The core workflow engine. Defines `step`, `workflow`, and the state machine logic. [Read various core concepts and API docs](./packages/core/README.md).
- **[`@motif-ts/expression`](./packages/expression)**: A safe, side-effect-free JavaScript expression evaluator used for dynamic transition rules and data transformations.
- **[`@motif-ts/middleware`](./packages/middleware)**: Middleware for the orchestrator, including Redux DevTools integration for time-travel debugging and state persistence.
- **[`@motif-ts/react`](./packages/react)**: React bindings (hooks) to easily use workflows within React applications.

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
import { step } from "@motif-ts/core";
import { type StateCreator } from "zustand/vanilla";
import z from "zod";

// A step that collects an email
const CollectEmail = step(
  {
    kind: "CollectEmail",
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
    kind: "VerifyEmail",
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
        console.log("Verification timed out for:", input.email);
      }
    }, [store.timeLeft]);

    // Return the API exposed to the UI
    return {
      timeLeft: store.timeLeft,
      isChecking: store.isChecking,
      verify: async () => {
        if (store.timeLeft === 0) return;

        store.setChecking(true);
        // Simulate async verification API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const isValid = input.email.endsWith("@company.com");
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
import { workflow } from "@motif-ts/core";
import { devtools } from "@motif-ts/middleware";

const orchestrator = workflow([CollectEmail, VerifyEmail]);

// Instantiate steps with unique names
const collect = CollectEmail("collect");
const verify = VerifyEmail("verify");

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
import { useWorkflow } from "@motif-ts/react";

function App() {
  const current = useWorkflow(app);

  if (current.step.kind === "CollectEmail") {
    return (
      <button onClick={() => current.step.state.submit("user@company.com")}>
        Submit Email
      </button>
    );
  }

  if (current.step.kind === "VerifyEmail") {
    const { timeLeft, isChecking, verify } = current.step.state;
    return (
      <div>
        <p>Verifying: {current.step.input.email}</p>
        <p>Time remaining: {timeLeft}s</p>
        <button
          disabled={isChecking || timeLeft === 0}
          onClick={() => verify()}
        >
          {isChecking ? "Verifying..." : "Verify Code"}
        </button>
      </div>
    );
  }

  return <div>Done</div>;
}
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
