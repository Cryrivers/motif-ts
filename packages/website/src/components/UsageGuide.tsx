import { highlight } from '@/lib/shiki';

import InteractiveUsage from './InteractiveUsage';
import Section from './Section';

export default async function UsageGuide() {
  const installCode = `pnpm add @motif-ts/core @motif-ts/react`;

  const stepCode = `import { step } from '@motif-ts/core';
import { z } from 'zod';

export const Validate = step(
  { 
    kind: 'validate', 
    inputSchema: z.object({ email: z.string().email() }),
    outputSchema: z.object({ isValid: z.boolean() }),
    apiSchema: z.object({ check: z.function() })
  }, 
  ({ next, input }) => ({
    check() {
      const isValid = input.email.includes('@');
      next({ isValid });
    }
  })
);`;

  const workflowCode = `import { workflow } from '@motif-ts/core';
import { Validate, Save } from './steps';

const flow = workflow([Validate, Save]);

// Register instances
const validate = Validate();
const save = Save();

flow.register([validate, save]);

// Connect steps
flow.connect(validate, save);

// Start execution
flow.start(validate);`;

  const reactCode = `import { useWorkflow } from '@motif-ts/react';
import { flow } from './workflow';

export function SignupForm() {
  const current = useWorkflow(flow);

  if (current.kind === 'validate') {
    return <button onClick={() => current.state.check()}>Validate</button>;
  }
  
  return <div>Processing...</div>;
}`;

  const vueCode = `<script setup lang="ts">
import { useWorkflow } from '@motif-ts/vue';
import { flow } from './workflow';

const current = useWorkflow(flow);
</script>

<template>
  <button v-if="current.kind === 'validate'" @click="current.state.check()">
    Validate
  </button>
  <div v-else>Processing...</div>
</template>`;

  const svelteCode = `<script lang="ts">
import { createWorkflowStore } from '@motif-ts/svelte';
import { flow } from './workflow';

const current = createWorkflowStore(flow);
</script>

{#if $current.kind === 'validate'}
  <button onclick={() => $current.state.check()}>Validate</button>
{:else}
  <div>Processing...</div>
{/if}`;

  const [installHtml, stepHtml, workflowHtml, reactHtml, vueHtml, svelteHtml] = await Promise.all([
    highlight(installCode, 'bash', 'github-dark-high-contrast'),
    highlight(stepCode, 'typescript', 'github-dark-high-contrast'),
    highlight(workflowCode, 'typescript', 'github-dark-high-contrast'),
    highlight(reactCode, 'tsx', 'github-dark-high-contrast'),
    highlight(vueCode, 'vue', 'github-dark-high-contrast'),
    highlight(svelteCode, 'svelte', 'github-dark-high-contrast'),
  ]);

  const blocks = [
    {
      label: 'Installation',
      value: 'install',
      iconName: 'terminal' as const,
      description: 'Get started by installing the core package and optional React adapter.',
      codeHtml: installHtml,
    },
    {
      label: 'Define Steps',
      value: 'steps',
      iconName: 'box' as const,
      description: 'Create strongly-typed steps with Zod schemas for inputs and outputs.',
      codeHtml: stepHtml,
    },
    {
      label: 'Compose Workflow',
      value: 'workflow',
      iconName: 'layers' as const,
      description: 'Connect steps into a graph. The orchestrator manages state and transitions.',
      codeHtml: workflowHtml,
    },
    {
      label: 'UI Integration',
      value: 'ui',
      iconName: 'code' as const,
      description: 'Connect your workflow to your UI framework of choice.',
      variants: [
        { label: 'React', value: 'react', codeHtml: reactHtml, filename: 'Component.tsx' },
        { label: 'Vue', value: 'vue', codeHtml: vueHtml, filename: 'Component.vue' },
        { label: 'Svelte', value: 'svelte', codeHtml: svelteHtml, filename: 'Component.svelte' },
      ],
    },
  ];

  return (
    <Section
      id="quick-start"
      title="Quick Start"
      description="From installation to your first executable workflow."
      className="py-12 lg:py-20"
    >
      <InteractiveUsage blocks={blocks} />
    </Section>
  );
}
