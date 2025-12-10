'use client';

import { cn } from '@/lib/cn';
import { Box, Code2, Layers, Terminal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import MacOSWindow from './MacOSWindow';

type CodeBlock = {
  label: string;
  value: string;
  iconName: 'terminal' | 'box' | 'layers' | 'code';
  description: string;
  codeHtml: string;
};

const iconMap = {
  terminal: Terminal,
  box: Box,
  layers: Layers,
  code: Code2,
};

const colorMap = {
  terminal: { text: 'text-blue-400', bg: 'bg-blue-500/10' },
  box: { text: 'text-purple-400', bg: 'bg-purple-500/10' },
  layers: { text: 'text-pink-400', bg: 'bg-pink-500/10' },
  code: { text: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function InteractiveUsage({ blocks }: { blocks: CodeBlock[] }) {
  const [activeTab, setActiveTab] = useState(blocks[0].value);
  const activeBlock = blocks.find((b) => b.value === activeTab) || blocks[0];
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
                  ? 'bg-white/10 lg:bg-white/5'
                  : 'bg-white/5 hover:bg-white/10 lg:bg-transparent lg:hover:bg-white/5',
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
                    isActive ? 'text-white' : 'text-gray-300 group-hover:text-white',
                    'lg:mb-1',
                  )}
                >
                  {block.label}
                </h3>
                <p className="hidden text-sm leading-relaxed text-gray-500 lg:block">{block.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Code Window */}
      <div className="lg:col-span-3">
        <MacOSWindow
          className="flex h-full min-h-[400px] flex-col overflow-hidden border-gray-800"
          contentClassName="flex-1 flex flex-col min-h-0"
          title={`${activeBlock.label.toLowerCase().replace(/\s+/g, '-')}.ts`}
          variant="glass"
          headerClassName="bg-black/20 border-gray-800"
        >
          {/* Code Content */}
          <div className="relative w-full min-w-0 flex-1 overflow-hidden bg-[#0a0c10]">
            <div className="custom-scrollbar absolute inset-0 overflow-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-xs md:text-sm [&_pre]:m-0! [&_pre]:bg-transparent!"
                  dangerouslySetInnerHTML={{ __html: activeBlock.codeHtml }}
                />
              </AnimatePresence>
            </div>
          </div>
        </MacOSWindow>
      </div>
    </div>
  );
}
