import { ChevronRight, User } from 'lucide-react';
import { motion } from 'motion/react';

import Button from '../../Button';
import { slideVariants } from './animation';

interface ProfilePageProps {
  onSubmit: (name: string, role: string) => void;
  custom: number;
}

export function ProfilePage({ onSubmit, custom }: ProfilePageProps) {
  return (
    <motion.div
      key="profile"
      custom={custom}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col justify-center bg-linear-to-b from-gray-900 to-black p-6"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
        <User className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">Your Profile</h2>
      <p className="mb-8 text-sm text-gray-400">Tell us a bit about yourself.</p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          // @ts-expect-error - accessing form elements directly
          onSubmit(e.target.name.value, e.target.role.value);
        }}
      >
        <div>
          <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">NAME</label>
          <input
            name="name"
            type="text"
            placeholder="John Doe"
            className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            defaultValue="Zhongliang Wang"
          />
        </div>
        <div>
          <label className="mb-1 ml-1 block text-xs font-medium text-gray-500">ROLE</label>
          <input
            name="role"
            type="text"
            placeholder="Developer"
            className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-3.5 text-sm text-white transition-all placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            defaultValue="Engineer"
          />
        </div>

        <Button type="submit" variant="white" className="w-full">
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  );
}
