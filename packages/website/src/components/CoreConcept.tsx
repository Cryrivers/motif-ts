'use client';

import { cn } from '@/lib/cn';
import { Database, FileJson, Settings, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import MacOSWindow from './MacOSWindow';
import SectionHeading from './SectionHeading';

type ConceptPart = 'input' | 'output' | 'config' | 'store' | 'step' | 'api' | null;

export default function CoreConcept() {
  const [activePart, setActivePart] = useState<ConceptPart>(null);

  // Helper to determine arrow activity
  const isInputArrowActive = activePart === 'input' || activePart === 'step';
  const isOutputArrowActive = activePart === 'step' || activePart === 'output';

  return (
    <section id="concept" className="relative overflow-hidden bg-background px-6 py-32 selection:bg-sky-500/20">
      {/* Subtle Grid Background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-size-[24px_24px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeading
          title="The Step Model"
          description="Encapsulated logic with strict IO boundaries and reactive state."
        />

        <div className="mt-20 grid items-start gap-16 lg:grid-cols-2">
          {/* Left Column: Diagram + Details */}
          <div className="flex flex-col gap-12">
            {/* Diagram Area - Flexbox Layout (Vertical Mobile, Horizontal Desktop) */}
            <div className="flex flex-col items-center justify-center gap-1 py-4 select-none lg:flex-row lg:gap-0">
              {/* 1. Input Node */}
              <div className="group relative z-10">
                <div className="absolute -inset-4 rounded-full bg-blue-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                <ConceptNode
                  id="input"
                  label="Input"
                  subLabel="args.input"
                  icon={FileJson}
                  active={activePart === 'input'}
                  onHover={setActivePart}
                  className="h-24 w-28 border-blue-500/20 text-blue-400 hover:border-blue-500/50"
                />
              </div>

              {/* Arrow 1 */}
              <ConnectorArrow active={isInputArrowActive} color="text-blue-500" />

              {/* 2. Step Container */}
              <div className="group relative z-0">
                <div className="absolute -inset-1 rounded-3xl bg-linear-to-br from-white/10 to-transparent opacity-50" />
                <motion.div
                  className={cn(
                    'relative z-10 min-w-[260px] rounded-[22px] border bg-[#0A0A0A] p-6 backdrop-blur-sm transition-all duration-500',
                    activePart === 'step'
                      ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_30px_-10px_rgba(14,165,233,0.3)] ring-1 ring-sky-500/50'
                      : 'border-white/10 shadow-xl shadow-black/50',
                  )}
                  onMouseEnter={() => setActivePart('step')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute top-3 left-6 text-[10px] font-semibold tracking-widest uppercase transition-colors duration-300',
                      activePart === 'step' ? 'text-sky-400' : 'text-gray-600',
                    )}
                  >
                    Step Context
                  </div>

                  {/* Context Grid: Config, Store, API */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <ConceptNode
                      id="config"
                      label="Config"
                      subLabel="args.config"
                      icon={Settings}
                      active={activePart === 'config'}
                      onHover={setActivePart}
                      className="h-20 w-full border-purple-500/20 text-purple-400 hover:border-purple-500/50"
                    />
                    <ConceptNode
                      id="store"
                      label="Store"
                      subLabel="args.store"
                      icon={Database}
                      active={activePart === 'store'}
                      onHover={setActivePart}
                      className="h-20 w-full border-orange-500/20 text-orange-400 hover:border-orange-500/50"
                    />

                    {/* Instance API Node */}
                    <div className="col-span-2">
                      <ConceptNode
                        id="api"
                        label="Instance API"
                        subLabel="return { ... }"
                        icon={Terminal}
                        active={activePart === 'api'}
                        onHover={setActivePart}
                        className="h-20 w-full border-pink-500/20 text-pink-400 hover:border-pink-500/50"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Arrow 2 */}
              <ConnectorArrow active={isOutputArrowActive} color="text-green-500" />

              {/* 3. Output Node */}
              <div className="group relative z-10">
                <div className="absolute -inset-4 rounded-full bg-green-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
                <ConceptNode
                  id="output"
                  label="Output"
                  subLabel="next(output)"
                  icon={FileJson}
                  active={activePart === 'output'}
                  onHover={setActivePart}
                  className="h-24 w-28 border-green-500/20 text-green-400 hover:border-green-500/50"
                />
              </div>
            </div>

            {/* Info Box (Below Diagram) */}
            <div className="mx-auto min-h-[140px] w-full max-w-xl px-4">
              <AnimatePresence mode="wait">
                {activePart && DETAILS[activePart] ? (
                  <motion.div
                    key={activePart}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className={cn('h-2 w-2 rounded-full', PART_COLORS[activePart])} />
                      <h3 className="text-sm font-semibold tracking-widest text-gray-200 uppercase">
                        {DETAILS[activePart].title}
                      </h3>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-400">{DETAILS[activePart].description}</p>

                    {(DETAILS[activePart].schema || DETAILS[activePart].type) && (
                      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/5 bg-white/5">
                        <div className="bg-black/20 p-3">
                          <div className="mb-1 text-[10px] font-bold text-gray-500 uppercase">Runtime</div>
                          <code className="text-xs whitespace-pre-wrap text-blue-300/90">
                            {DETAILS[activePart].schema}
                          </code>
                        </div>
                        <div className="bg-black/20 p-3">
                          <div className="mb-1 text-[10px] font-bold text-gray-500 uppercase">Inferred Type</div>
                          <code className="text-xs whitespace-pre-wrap text-green-300/90">
                            {DETAILS[activePart].type}
                          </code>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center px-4 text-center text-balance text-gray-500"
                  >
                    <p className="text-sm font-medium text-gray-300">Interactive Step Architecture</p>
                    <p className="mt-2 text-xs leading-relaxed opacity-60">
                      Hover to reveal the seamless link between visual concepts and TypeScript code. See how every
                      Input, State, and Output is strictly typed and interconnected.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Code (Sticky) */}
          <div className="sticky top-24 flex flex-col gap-8">
            {/* Code Block */}
            <MacOSWindow
              title="MyStep.ts"
              className="group relative shadow-2xl"
              headerClassName="![&>div:last-child]:hidden"
            >
              <div className="scrollbar-none overflow-x-auto p-5 font-mono text-[11px] leading-7 text-gray-400 selection:bg-white/10 md:text-[13px]">
                {/* Definition */}
                <div className="mb-6">
                  <span className="text-[#8b949e] italic">// 1. Define Step</span>
                  <div className="mt-1">
                    <span className="text-[#ff7b72]">const</span> <span className="text-[#91CBFF]">MyStep</span> ={' '}
                    <span className="text-[#d2a8ff]">step</span>({'{'}
                  </div>
                  <div className="pl-4">
                    <span className="text-[#79c0ff]">kind</span>: <span className="text-[#a5d6ff]">'my-step'</span>,
                    <div className="py-0.5" />
                    <CodeToken
                      active={activePart === 'input'}
                      hoverId="input"
                      setHover={setActivePart}
                      className="text-[#79c0ff]"
                    >
                      inputSchema
                    </CodeToken>
                    : <span className="text-[#e6edf3]">z.object(...)</span>,
                    <div className="py-0.5" />
                    <CodeToken
                      active={activePart === 'output'}
                      hoverId="output"
                      setHover={setActivePart}
                      className="text-[#79c0ff]"
                    >
                      outputSchema
                    </CodeToken>
                    : <span className="text-[#e6edf3]">z.object(...)</span>,
                    <div className="py-0.5" />
                    <CodeToken
                      active={activePart === 'config'}
                      hoverId="config"
                      setHover={setActivePart}
                      className="text-[#79c0ff]"
                    >
                      configSchema
                    </CodeToken>
                    : <span className="text-[#e6edf3]">z.object(...)</span>,
                    <div className="py-0.5" />
                    <CodeToken
                      active={activePart === 'store'}
                      hoverId="store"
                      setHover={setActivePart}
                      className="text-[#79c0ff]"
                    >
                      createStore
                    </CodeToken>
                    : <span className="text-[#d2a8ff]">myStepStore</span>,
                  </div>
                  {'}'}, (args) <span className="text-[#ff7b72]">=&gt;</span> {'{'}
                  <div className="mt-2 pl-4">
                    <span className="text-[#ff7b72]">const</span> {'{ '}
                    <CodeToken
                      active={activePart === 'input'}
                      hoverId="input"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      input
                    </CodeToken>
                    ,{' '}
                    <CodeToken
                      active={activePart === 'config'}
                      hoverId="config"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      config
                    </CodeToken>
                    ,{' '}
                    <CodeToken
                      active={activePart === 'store'}
                      hoverId="store"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      store
                    </CodeToken>
                    {' }'} = args;
                  </div>
                  <div className="pl-4">
                    <span className="text-[#ff7b72]">const</span> {'{ '}
                    <CodeToken
                      active={activePart === 'step'}
                      hoverId="step"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      transitionIn
                    </CodeToken>
                    ,{' '}
                    <CodeToken
                      active={activePart === 'step'}
                      hoverId="step"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      effect
                    </CodeToken>
                    ,{' '}
                    <CodeToken
                      active={activePart === 'step'}
                      hoverId="step"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      transitionOut
                    </CodeToken>
                    ,{' '}
                    <CodeToken
                      active={activePart === 'output'}
                      hoverId="output"
                      setHover={setActivePart}
                      className="text-[#FFB757]"
                    >
                      next
                    </CodeToken>
                    {' }'} = args;
                  </div>
                  <div className="mt-2 pl-4">
                    {/* Effect */}
                    <CodeToken active={activePart === 'step'} hoverId="step" setHover={setActivePart}>
                      <span className="text-[#d2a8ff]">effect</span>
                    </CodeToken>
                    (() <span className="text-[#ff7b72]">=&gt;</span> {'{'} ... {'}'});
                  </div>
                  {/* Return API */}
                  <div className="mt-2 pl-4">
                    <span className="text-[#ff7b72]">return</span> {'{'}
                    <div className="pl-4">
                      <CodeToken active={activePart === 'api'} hoverId="api" setHover={setActivePart}>
                        <span className="text-[#d2a8ff]">execute</span>: (){' '}
                        <span className="text-[#ff7b72]">=&gt;</span> {'{'}
                      </CodeToken>
                      <div className="pl-4">
                        <CodeToken active={activePart === 'store'} hoverId="store" setHover={setActivePart}>
                          <span className="text-[#91CBFF]">store</span>.
                          <span className="text-[#d2a8ff]">increment</span>
                          ();
                        </CodeToken>
                      </div>
                      <div className="pl-4">
                        <CodeToken active={activePart === 'output'} hoverId="output" setHover={setActivePart}>
                          <span className="text-[#d2a8ff]">next</span>
                          (...);
                        </CodeToken>
                      </div>
                      {'}'}
                    </div>
                    {'}'};
                  </div>
                  {'}'});
                </div>

                {/* Instantiation */}
                <div>
                  <span className="text-[#8b949e] italic">// 2. Instantiate</span>
                  <div className="mt-1">
                    <span className="text-[#ff7b72]">const</span> <span className="text-[#91CBFF]">instance</span> ={' '}
                    <span className="text-[#d2a8ff]">MyStep</span>
                    <CodeToken active={activePart === 'config'} hoverId="config" setHover={setActivePart}>
                      ({'{'} ... {'}'})
                    </CodeToken>
                    ;
                  </div>
                  <div className="mt-1">
                    <CodeToken active={activePart === 'api'} hoverId="api" setHover={setActivePart}>
                      <span className="text-[#91CBFF]">instance</span>.state.
                      <span className="text-[#d2a8ff]">execute</span>
                      ();
                    </CodeToken>
                  </div>
                </div>
              </div>
            </MacOSWindow>
          </div>
        </div>
      </div>
    </section>
  );
}

const PART_COLORS: Record<string, string> = {
  input: 'bg-blue-500',
  output: 'bg-green-500',
  config: 'bg-purple-500',
  store: 'bg-orange-500',
  step: 'bg-sky-500',
  effect: 'bg-sky-500',
  api: 'bg-pink-500',
};

const TOKEN_STYLES: Record<string, string> = {
  input: 'border-blue-500/50 bg-blue-500/20 shadow-blue-500/20',
  output: 'border-green-500/50 bg-green-500/20 shadow-green-500/20',
  config: 'border-purple-500/50 bg-purple-500/20 shadow-purple-500/20',
  store: 'border-orange-500/50 bg-orange-500/20 shadow-orange-500/20',
  step: 'border-sky-500/50 bg-sky-500/20 shadow-sky-500/20',
  effect: 'border-sky-500/50 bg-sky-500/20 shadow-sky-500/20',
  api: 'border-pink-500/50 bg-pink-500/20 shadow-pink-500/20',
};

const NODE_STYLES: Record<string, string> = {
  input: 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
  output: 'border-green-500 bg-green-500/10 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]',
  config: 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]',
  store: 'border-orange-500 bg-orange-500/10 shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]',
  api: 'border-pink-500 bg-pink-500/10 shadow-[0_0_30px_-5px_rgba(236,72,153,0.3)]',
  step: 'border-sky-500 bg-sky-500/10 shadow-[0_0_30px_-5px_rgba(14,165,233,0.3)]',
};

const DETAILS: Record<string, any> = {
  input: {
    title: 'Input Validation',
    description:
      'Inputs are validated against schema before entering the business logic. Invalid inputs are rejected automatically.',
    schema: `z.object({
  id: z.string()
})`,
    type: `{
  id: string
}`,
  },
  config: {
    title: 'Static Configuration',
    description:
      'Reusable parameters defined at build time. Guarantees that the step is properly configured before running.',
    schema: `z.object({
  apiKey: z.string()
})`,
    type: `{
  apiKey: string
}`,
  },
  store: {
    title: 'Isolated State',
    description: 'Private, reactive state for this step instance. Access state directly via store methods.',
    schema: `(set) => ({
  count: 0,
  increment: () => set({ count: count + 1 })
})`,
    type: `{
  count: number;
  increment: () => void;
}`,
  },
  output: {
    title: 'Output Guarantee',
    description:
      'The result is strictly checked against the output schema. This ensures downstream consumers always get what they expect.',
    schema: `z.object({
  success: z.boolean()
})`,
    type: `{
  success: boolean
}`,
  },
  step: {
    title: 'Step Logic',
    description:
      'Lifecycle hooks for managing side effects. transitionIn runs on mount, effect runs on every render, transitionOut runs on unmount. Use next() to emit output.',
    schema: null,
    type: null,
  },
  api: {
    title: 'Instance API',
    description:
      'Public methods exposed to the parent app. Allows external triggers, like refreshing data or updating state.',
    schema: null,
    type: null,
  },
};

// Responsive Arrow: Vertical on Mobile, Horizontal on Desktop
function ConnectorArrow({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={cn(
        'z-20 flex shrink-0 items-center justify-center transition-colors delay-75 duration-500',
        active ? color : 'text-neutral-500',
      )}
    >
      {/* Desktop: Horizontal Arrow */}
      <svg aria-hidden="true" className="hidden h-6 w-12 lg:block" viewBox="0 0 48 24" fill="none">
        <line x1="0" y1="12" x2="40" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M 38 12 L 46 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M 42 8 L 48 12 L 42 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Mobile: Vertical Arrow */}
      <svg aria-hidden="true" className="block h-10 w-6 lg:hidden" viewBox="0 0 24 40" fill="none">
        <line x1="12" y1="0" x2="12" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M 12 30 L 12 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M 8 34 L 12 40 L 16 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function ConceptNode({
  id,
  label,
  subLabel,
  icon: Icon,
  active,
  onHover,
  className,
}: {
  id: ConceptPart;
  label: string;
  subLabel?: string;
  icon: any;
  active: boolean;
  onHover: (id: ConceptPart) => void;
  className?: string;
}) {
  const handleClick = () => {
    // Toggle for mobile: if already active, deactivate; otherwise activate
    onHover(active ? null : id);
  };

  return (
    <motion.div
      tabIndex={0}
      role="button"
      aria-label={`${label}${subLabel ? `: ${subLabel}` : ''}`}
      aria-pressed={active}
      className={cn(
        'relative z-10 flex cursor-pointer flex-col items-center justify-center rounded-lg border bg-background/50 backdrop-blur-sm transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active ? 'z-20 scale-105' : 'border-white/10 hover:border-white/20 hover:bg-white/5',
        className,
        active && ((id && NODE_STYLES[id]) || 'border-current bg-background shadow-[0_0_20px_-5px_currentColor]'),
      )}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Icon
        aria-hidden="true"
        className={cn('mb-2 h-5 w-5 transition-opacity duration-300', active ? 'opacity-100' : 'opacity-70 grayscale')}
      />
      <span
        className={cn(
          'text-xs font-bold tracking-wider uppercase transition-opacity duration-300',
          active ? 'opacity-100' : 'opacity-80',
        )}
      >
        {label}
      </span>
      <span className="mt-1 h-4 font-mono text-[10px] text-gray-400">{subLabel || '\u00A0'}</span>
    </motion.div>
  );
}

function CodeToken({
  children,
  active,
  hoverId,
  setHover,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  hoverId: ConceptPart;
  setHover: (id: ConceptPart) => void;
  className?: string;
}) {
  const handleClick = () => {
    // Toggle for mobile: if already active, deactivate; otherwise activate
    setHover(active ? null : hoverId);
  };

  return (
    <span
      tabIndex={0}
      role="button"
      aria-pressed={active}
      className={cn(
        '-mx-1.5 cursor-pointer rounded border border-transparent px-1.5 whitespace-pre transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0A0A0A]',
        active
          ? cn(
              'shadow-[0_0_15px_-3px_currentColor]',
              (hoverId && TOKEN_STYLES[hoverId]) || 'border-white/20 bg-white/10 shadow-white/20',
            )
          : 'text-inherit hover:bg-white/5',
        className,
      )}
      onMouseEnter={() => setHover(hoverId)}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setHover(hoverId)}
      onBlur={() => setHover(null)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </span>
  );
}
