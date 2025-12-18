import { cn } from '@/lib/cn';
import { ReactNode } from 'react';

interface MacOSWindowProps {
  children: ReactNode;
  className?: string; // Container class
  headerClassName?: string;
  contentClassName?: string;
  title?: string;
  // Option to use glass effect or solid background
  variant?: 'glass' | 'solid';
}

export default function MacOSWindow({
  children,
  className,
  headerClassName,
  contentClassName,
  title,
  variant = 'solid',
}: MacOSWindowProps) {
  // Base container styles
  const containerBase = 'relative overflow-hidden rounded-xl border';
  const containerVariant =
    variant === 'glass'
      ? 'bg-black/20 backdrop-blur-md border-white/5' // Glass style
      : 'bg-background border-border shadow-2xl'; // Solid style (more like CoreConcept)

  // Header styles
  const headerBase = 'flex items-center justify-between border-b px-4 py-3 select-none';
  const headerVariant = variant === 'glass' ? 'border-gray-800/50 bg-black/20' : 'border-white/5 bg-white/2';

  return (
    <div className={cn(containerBase, containerVariant, className)}>
      {/* Window Header */}
      <div className={cn(headerBase, headerVariant, headerClassName)}>
        <div className="group flex gap-2">
          <div className="h-3 w-3 rounded-full bg-[#FF5F56] opacity-80 transition-opacity group-hover:opacity-100" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E] opacity-80 transition-opacity group-hover:opacity-100" />
          <div className="h-3 w-3 rounded-full bg-[#27C93F] opacity-80 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Title (Optional) */}
        {title && <div className="font-mono text-xs font-medium tracking-wide text-muted">{title}</div>}

        {/* Spacer to balance the header if title is centered (simplified approach: just flex-between) */}
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className={cn('relative w-full min-w-0', contentClassName)}>{children}</div>
    </div>
  );
}
