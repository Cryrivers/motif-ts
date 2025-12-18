'use client';

import { cn } from '@/lib/cn';
import { motion } from 'motion/react';

interface SectionHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export default function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn('mb-16 text-center', className)}
    >
      <h2 className="mb-6 bg-linear-to-b from-white to-white/60 bg-clip-text text-3xl leading-[1.2] font-bold tracking-tight text-transparent md:text-5xl">
        {title}
      </h2>
      {description && <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{description}</p>}
    </motion.div>
  );
}
