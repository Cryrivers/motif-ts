# AI Native Workflow Examples

These examples demonstrate how `@motif-ts/ai` enables **autonomous workflow evolution** - where AI doesn't just execute steps, but actively creates, improves, and optimizes workflow structures.

## Core Concept: Self-Evolving Workflows

The key differentiator of `@motif-ts/ai` is not simple tool calling. It's the ability for workflows to **evolve themselves**:

```typescript
import { createAIEvolver, createFeedbackCollector } from '@motif-ts/ai';

// Collect execution data over time
const feedback = createFeedbackCollector();

// Create AI-powered evolver
const evolver = createAIEvolver(workflow, {
  callLLM: (prompt) => yourLLM.complete(prompt),
  feedbackCollector: feedback,
});

// AI analyzes patterns and suggests improvements
const suggestions = await evolver.suggestWithAI();
// → "Merge redundant validation steps"
// → "Add error recovery branch after payment"
// → "Parallelize independent data fetching steps"

// Apply high-confidence suggestions automatically
for (const s of suggestions) {
  if (s.confidence > 0.8) evolver.applySuggestion(s.id);
}

// Get natural language explanation of the workflow
const explanation = await evolver.explainWorkflow();
```

## What AI Can Do

| Capability               | Description                                       |
| ------------------------ | ------------------------------------------------- |
| **Analyze Structure**    | AI understands the complete workflow graph        |
| **Suggest Improvements** | Based on execution patterns, errors, and feedback |
| **Add/Remove Steps**     | Runtime modification of workflow structure        |
| **Modify Connections**   | Change step transitions dynamically               |
| **Explain Workflows**    | Generate human-readable descriptions              |
| **Track History**        | Full evolution audit trail                        |

## Examples

### `openai-example.ts`

Complete integration with OpenAI SDK showing:

- Workflow execution via function calling
- Feedback collection for analysis
- Evolution suggestions based on execution patterns

### `anthropic-example.ts`

Same patterns using Anthropic Claude SDK with tool use format.

## Design Principles

1. **Autonomy over Automation**: AI doesn't just follow commands - it improves the system
2. **Evolution over Configuration**: Workflows adapt based on real usage patterns
3. **Self-Improvement**: Continuous optimization without manual intervention
4. **Transparency**: All changes are tracked and explainable

## Running Examples

```bash
# Install dependencies
pnpm add openai  # or @anthropic-ai/sdk

# Set API key
export OPENAI_API_KEY=your-key

# Run (examples are for reference/learning)
npx tsx examples/openai-example.ts
```

> **Note**: These examples require API keys and are meant for demonstration. The real power emerges when workflows run in production and accumulate execution data for AI to analyze.
