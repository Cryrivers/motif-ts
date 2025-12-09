'use client';

import { cn } from '@/lib/cn';
import { GitMerge, History, LayoutTemplate, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

import Section from './Section';

const FEATURES = [
  {
    title: 'Workflow Orchestrator',
    packageName: [{ name: '@motif-ts/core', active: true }],
    description: 'Compose steps with typed transitions, back navigation, lifecycle control, and middleware hooks.',
    icon: GitMerge,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'DevTools & Persistence',
    packageName: [{ name: '@motif-ts/middleware', active: true }],
    description:
      'Time-travel with Redux DevTools, export/import full snapshots or just the workflow config, and safely restore any state.',
    icon: History,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Framework Adapters',
    packageName: [
      { name: '@motif-ts/react', active: true },
      { name: '@motif-ts/vue', active: false },
      { name: '@motif-ts/svelte', active: false },
    ],
    description:
      'Use adapters to integrate with UI of choice. React adapter is included. More adapters are coming soon.',
    icon: LayoutTemplate,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    title: 'Expression Engine',
    packageName: [{ name: '@motif-ts/expression', active: true }],
    description:
      'Serialize expressions for portable workflows. Supports modern JavaScript syntax like optional chaining, template literals, and object spread.',
    icon: Terminal,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
];

export default function Features() {
  return (
    <Section
      id="capabilities"
      title="Core Capabilities"
      description="Essential primitives for complex application logic."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-start gap-6 rounded-xl p-4 transition-colors"
          >
            <h3
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold',
                feature.color,
                feature.bg,
              )}
            >
              <feature.icon className="h-5 w-5" />
              {feature.title}
            </h3>

            <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
            <div className="flex flex-col gap-3">
              {feature.packageName.map((packageName, index) => (
                <code className={cn('text-sm', packageName.active ? feature.color : 'text-gray-400')} key={index}>
                  {packageName.name}
                  {packageName.active ? null : <span className="text-gray-600">(coming soon)</span>}
                </code>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
