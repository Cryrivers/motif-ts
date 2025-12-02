import { ChevronRight, Mail } from 'lucide-react';
import { motion } from 'motion/react';

import Button from '../../Button';
import { slideVariants } from './animation';

interface InputPageProps {
  onSubmit: (email: string) => void;
  custom: number;
}

export function InputPage({ onSubmit, custom }: InputPageProps) {
  return (
    <motion.div
      key="input"
      custom={custom}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
        <Mail className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Welcome Back</h2>
      <p className="mb-8 text-sm text-gray-400">Enter your email to access your workspace.</p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // @ts-expect-error - accessing form elements directly
          onSubmit(e.target.email.value);
        }}
      >
        <div>
          <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">EMAIL</label>
          <input
            name="email"
            type="email"
            placeholder="name@example.com"
            className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            defaultValue="hello@zhongliang.wang"
          />
        </div>

        <Button type="submit" variant="white" className="w-full">
          Continue <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  );
}
