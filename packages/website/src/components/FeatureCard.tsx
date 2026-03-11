import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import GlassPanel from './GlassPanel';
import { cn } from '@/lib/cn';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  footer?: ReactNode;
  className?: string;
  delay?: number;
}

export default function FeatureCard({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  footer,
  className,
  delay = 0,
}: FeatureCardProps) {
  return (
    <GlassPanel
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={cn('flex flex-col p-8', className)}
    >
      <div className="flex items-center gap-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-6 leading-relaxed text-gray-400">{description}</p>
      {footer && <div className="mt-auto pt-6">{footer}</div>}
    </GlassPanel>
  );
}
