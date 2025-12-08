'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md supports-backdrop-filter:bg-black/20">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-black"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row md:gap-0">
        <Link href="#" className="group flex items-center gap-2" aria-label="Motif-ts Home">
          <span className="text-xl font-bold tracking-tight text-white">motif-ts</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="#principles" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
            Design Principles
          </Link>
          <Link href="#architecture" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
            Architecture
          </Link>
          <Link href="#capabilities" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
            Core Capabilities
          </Link>
          <Link href="#quick-start" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
            Quick Start
          </Link>

          <div className="hidden h-4 w-px bg-white/10 md:block" />

          <a
            href="https://github.com/Cryrivers/motif-ts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/5 bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
