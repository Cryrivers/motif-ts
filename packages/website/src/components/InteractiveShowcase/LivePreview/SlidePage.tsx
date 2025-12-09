'use client';

import { cn } from '@/lib/cn';
import { motion, Variants } from 'motion/react';
import { ReactNode } from 'react';

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

interface SlidePageProps {
  pageKey: string;
  custom: number;
  children: ReactNode;
  className?: string;
}

export function SlidePage({ pageKey, custom, children, className }: SlidePageProps) {
  return (
    <motion.div
      key={pageKey}
      custom={custom}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn('absolute inset-0 flex flex-col', className)}
    >
      {children}
    </motion.div>
  );
}
