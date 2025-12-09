import { cn } from '@/lib/cn';
import { ReactNode } from 'react';

import SectionHeading from './SectionHeading';

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export default function Section({ id, title, description, children, className, containerClassName }: SectionProps) {
  return (
    <section id={id} className={cn('relative px-6 py-20', className)}>
      <div className={cn('mx-auto max-w-7xl', containerClassName)}>
        <SectionHeading title={title} description={description} />
        {children}
      </div>
    </section>
  );
}
