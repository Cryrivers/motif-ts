'use client';

import { cn } from '@/lib/cn';
import { Code, Play } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { createHighlighter, Highlighter } from 'shiki';

import Button from '../../Button';
import GlassPanel from '../../GlassPanel';

// --- Shiki Hook ---
const useShiki = (code: string) => {
  const [html, setHtml] = useState<string | null>(null);
  const highlighterRef = useRef<Highlighter | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!highlighterRef.current) {
        highlighterRef.current = await createHighlighter({
          themes: ['github-dark-high-contrast'],
          langs: ['typescript'],
        });
      }

      if (mounted && highlighterRef.current) {
        const highlighted = highlighterRef.current.codeToHtml(code, {
          lang: 'typescript',
          theme: 'github-dark-high-contrast',
        });
        setHtml(highlighted);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [code]);

  return html;
};

const CodeBlock = ({ code }: { code: string }) => {
  const html = useShiki(code);

  if (!html) {
    return <div className="font-mono text-sm leading-relaxed whitespace-pre text-gray-300">{code}</div>;
  }

  return (
    <div
      className="font-mono text-sm leading-relaxed whitespace-pre [&>pre]:bg-transparent! [&>pre]:p-0!"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface YourCodeProps {
  generateCode: () => string;
  onRun: () => void;
  disabled: boolean;
  isRunning: boolean;
}

const YourCode: FC<YourCodeProps> = ({ generateCode, onRun, disabled, isRunning }) => {
  /* Front Face: Generated Code */

  return (
    <GlassPanel
      className="absolute inset-0 flex flex-col overflow-hidden border-gray-800 bg-[#0a0c10]"
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="flex items-center justify-between border-b border-gray-800 bg-white/5 px-6 py-4 font-medium text-gray-500">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Your Code
        </div>
        <Button onClick={onRun} disabled={disabled} variant="primary" size="sm">
          <Play className="mr-2 h-3 w-3 fill-current" />
          {isRunning ? 'Running...' : 'Run Workflow'}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <CodeBlock code={generateCode()} />
      </div>
    </GlassPanel>
  );
};

export default YourCode;
