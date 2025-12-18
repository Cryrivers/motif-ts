import { cn } from '@/lib/cn';
import { HTMLMotionProps, motion } from 'motion/react';
import { ReactNode } from 'react';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function GlassPanel({ children, className, hoverEffect = false, ...props }: GlassPanelProps) {
  return (
    <motion.div
      className={cn(
        'glass-panel rounded-2xl border border-border',
        hoverEffect && 'transition-all hover:-translate-y-1 hover:bg-surface-hover',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
