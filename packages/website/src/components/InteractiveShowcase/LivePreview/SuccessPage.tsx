import { Check } from 'lucide-react';

import Button from '../../Button';
import { SlidePage } from './SlidePage';

interface SuccessPageProps {
  result: {
    name?: string;
    role?: string;
    plan?: string;
    email?: string;
  };
  onRestart: () => void;
  custom: number;
}

export function SuccessPage({ result, onRestart, custom }: SuccessPageProps) {
  return (
    <SlidePage
      pageKey="success"
      custom={custom}
      className="items-center justify-center bg-linear-to-b from-green-950/30 to-black p-6 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
        <Check className="h-10 w-10 text-green-500" />
      </div>
      <h3 className="mb-2 text-2xl font-bold text-white">All Set!</h3>
      <div className="mb-8 space-y-1 text-sm text-gray-400">
        <p>
          Welcome, <span className="font-medium text-white">{result.name || 'User'}</span>
        </p>
        <p>
          Role: <span className="text-white">{result.role || 'N/A'}</span>
        </p>
        <p>
          Plan: <span className="text-white">{result.plan || 'N/A'}</span>
        </p>
        <p className="mt-2 text-xs text-gray-500">{result.email}</p>
      </div>

      <Button onClick={onRestart} variant="secondary" className="rounded-full bg-gray-900 px-8 py-3 hover:bg-gray-800">
        Start Over
      </Button>
    </SlidePage>
  );
}
