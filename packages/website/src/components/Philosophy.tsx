'use client';

import { Bot, Layers, LocateFixed, Package, ShieldCheck, Workflow } from 'lucide-react';

import FeatureCard from './FeatureCard';
import SectionHeading from './SectionHeading';
import ZodLogo from './ZodLogo';
import ZustandLogo from './ZustandLogo';

const PHILOSOPHY_ITEMS = [
  {
    title: 'Workflows as Graphs',
    description:
      'Build logic with explicit steps and edges. Each transition is deterministic and type-checked, making complex flows understandable and testable.',
    icon: Workflow,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Type-Safety End-to-End',
    description:
      'Strong TypeScript APIs ensure inputs, states, and transitions are safe. Zod integration adds runtime validation without compromising ergonomics.',
    icon: ShieldCheck,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    poweredBy: {
      name: 'Zod',
      logo: ZodLogo,
    },
  },
  {
    title: 'Immutability',
    description:
      'State updates are immutable by default. This ensures predictable state changes and enables powerful features like time-travel debugging.',
    icon: Package,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    poweredBy: {
      name: 'Zustand',
      logo: ZustandLogo,
    },
  },
  {
    title: 'Co-location',
    description:
      'Achieve clear separation of concerns by decoupling UI from business logic. The architecture forces you to co-locate logic with its relevant components, ensuring that business rules remain pure, testable, and independent of the view layer.',
    icon: LocateFixed,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Framework Agnostic',
    description:
      'The core is UI-agnostic and works in any framework or runtime. Optional adapters integrate with different UIs without coupling.',
    icon: Layers,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    title: 'AI-Friendly',
    description:
      'Built for the AI era. The co-located structure allows AI to precisely target and modify specific logic blocks with high confidence. This isolation makes AI-generated changes transparent, safe, and easy for humans to verify.',
    icon: Bot,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
];

export default function Philosophy() {
  return (
    <section id="principles" className="relative overflow-hidden px-6 py-20">
      {/* Background Elements */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-full max-w-7xl -translate-x-1/2">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeading
          title="Design Principles"
          description="Built on the foundations of immutability, type-safety, and composition."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {PHILOSOPHY_ITEMS.map((item, index) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={item.icon}
              iconColor={item.color}
              iconBg={item.bg}
              delay={index * 0.1}
              footer={
                item.poweredBy && (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-xxs font-semibold tracking-widest uppercase">Powered by</span>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <item.poweredBy.logo className="h-5 w-5" />
                      <span className="font-medium">{item.poweredBy.name}</span>
                    </div>
                  </div>
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
