import { ChevronRight, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

import Button from '../../Button';
import { slideVariants } from './animation';

interface PlanPageProps {
  onSelect: (plan: string) => void;
  custom: number;
}

export function PlanPage({ onSelect, custom }: PlanPageProps) {
  return (
    <motion.div
      key="plan"
      custom={custom}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-green-600 to-teal-600 shadow-lg shadow-green-500/20">
        <CreditCard className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Select Plan</h2>
      <p className="mb-8 text-sm text-gray-400">Choose a plan that fits your needs.</p>

      <div className="space-y-3">
        {['Free', 'Pro', 'Team'].map((plan) => (
          <Button
            key={plan}
            variant="secondary"
            onClick={() => onSelect(plan)}
            className="group w-full justify-between border-gray-800 bg-gray-900 p-4 hover:border-green-500/50 hover:bg-gray-800"
          >
            <span className="font-medium text-white">{plan}</span>
            <ChevronRight className="h-4 w-4 text-gray-600 transition-colors group-hover:text-green-500" />
          </Button>
        ))}
      </div>
    </motion.div>
  );
}
