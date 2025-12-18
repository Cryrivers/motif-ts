'use client';

import { cn } from '@/lib/cn';
import { Github, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Links configuration
  const LINKS = [
    { label: 'Principles', href: '#principles' },
    { label: 'Architecture', href: '#concept' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Usage', href: '#quick-start' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 z-50 w-full border-b border-border transition-colors duration-300',
          isMobileMenuOpen
            ? 'bg-background'
            : 'bg-background/50 backdrop-blur-md supports-backdrop-filter:bg-background/20',
        )}
      >
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-black"
        >
          Skip to content
        </a>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="#" className="group flex items-center gap-2" aria-label="Motif-ts Home">
            <span className="text-xl font-bold tracking-tight text-white">motif-ts</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            <div className="h-4 w-px bg-border" />

            <a
              href="https://github.com/Cryrivers/motif-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground transition-all hover:bg-surface-hover"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-background pt-24 md:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 pb-10">
              {LINKS.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="block rounded-lg py-4 text-lg font-medium text-muted-foreground transition-colors hover:text-foreground active:bg-surface"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                  <div className="h-px w-full bg-border" />
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + LINKS.length * 0.05 }}
                className="mt-6"
              >
                <a
                  href="https://github.com/Cryrivers/motif-ts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-4 text-base font-medium text-foreground transition-all hover:bg-surface-hover"
                >
                  <Github className="h-5 w-5" />
                  GitHub Repository
                </a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
