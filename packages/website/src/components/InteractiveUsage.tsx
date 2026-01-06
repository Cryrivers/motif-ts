'use client';

import { cn } from '@/lib/cn';
import { Box, BrainCircuit, Code2, Layers, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import MacOSWindow from './MacOSWindow';

type CodeBlock = {
  label: string;
  value: string;
  iconName: 'terminal' | 'box' | 'layers' | 'code' | 'brain';
  description: string;

  codeHtml?: string;
  variants?: {
    label: string;
    value: string;
    codeHtml: string;
    filename?: string;
  }[];
};

const iconMap = {
  terminal: Terminal,
  box: Box,
  layers: Layers,
  code: Code2,
  brain: BrainCircuit,
};

const colorMap = {
  terminal: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  box: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  layers: { text: 'text-pink-400', bg: 'bg-pink-500/10' },
  code: { text: 'text-orange-400', bg: 'bg-orange-500/10' },
  brain: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function InteractiveUsage({ blocks }: { blocks: CodeBlock[] }) {
  const [activeTab, setActiveTab] = useState(blocks[0].value);
  const activeBlock = blocks.find((b) => b.value === activeTab) || blocks[0];
  const [activeVariantValue, setActiveVariantValue] = useState<string | undefined>(undefined);

  const activeVariant = activeBlock.variants?.find((v) => v.value === activeVariantValue) || activeBlock.variants?.[0];
  const currentCodeHtml = activeVariant ? activeVariant.codeHtml : activeBlock.codeHtml;
  const currentTitle = activeVariant?.filename || `${activeBlock.label.toLowerCase().replace(/\s+/g, '-')}.ts`;
  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Sidebar / Tabs */}
      <div className="flex w-full gap-4 overflow-x-auto pb-4 lg:col-span-2 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0">
        {blocks.map((block) => {
          const Icon = iconMap[block.iconName];
          const colors = colorMap[block.iconName];
          const isActive = activeTab === block.value;

          return (
            <button
              key={block.value}
              onClick={() => setActiveTab(block.value)}
              className={cn(
                'group flex min-w-[160px] shrink-0 items-center gap-3 rounded-xl p-3 text-left transition-all duration-300 lg:w-full lg:items-start lg:gap-4 lg:p-4',
                isActive
                  ? 'bg-surface-hover lg:bg-white/5'
                  : 'bg-surface hover:bg-surface-hover lg:bg-transparent lg:hover:bg-surface',
              )}
            >
              <div
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  colors.bg,
                  colors.text,
                  isActive ? '' : 'opacity-80 group-hover:opacity-100',
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={cn(
                    'font-semibold',
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground',
                    'lg:mb-1',
                  )}
                >
                  {block.label}
                </h3>
                <p className="hidden text-sm leading-relaxed text-muted lg:block">{block.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Window */}
      <div className="lg:col-span-3">
        <MacOSWindow
          className="flex h-full min-h-[400px] flex-col overflow-hidden border-border"
          contentClassName="flex-1 flex flex-col min-h-0"
          title={currentTitle}
          variant="glass"
          headerClassName="bg-black/20 border-border"
        >
          {/* Code Content */}
          {activeBlock.variants && (
            <div className="flex border-b border-border bg-black/10 px-4">
              {activeBlock.variants.map((variant) => (
                <button
                  key={variant.value}
                  onClick={() => setActiveVariantValue(variant.value)}
                  className={cn(
                    'border-b-2 px-4 py-2 text-xs font-medium transition-colors',
                    (activeVariantValue || activeBlock.variants![0].value) === variant.value
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}
          <div className="relative w-full min-w-0 flex-1 overflow-hidden bg-background">
            <div className="custom-scrollbar absolute inset-0 overflow-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-xs md:text-sm [&_pre]:m-0! [&_pre]:bg-transparent!"
                  dangerouslySetInnerHTML={{ __html: currentCodeHtml || '' }}
                />
              </AnimatePresence>
            </div>
          </div>
        </MacOSWindow>
      </div>
    </div>
  );
}
