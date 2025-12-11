import { SlidePage } from './SlidePage';

export function VerifyPage({ timeLeft, maxTime, custom }: { timeLeft: number; maxTime: number; custom: number }) {
  const fraction = Math.max(0, timeLeft / maxTime);
  const circumference = 2 * Math.PI * 24; // r=24
  const dashOffset = (1 - fraction) * circumference;

  return (
    <SlidePage pageKey="verify" custom={custom} className="items-center justify-center bg-black p-6 text-center">
      <div className="relative mb-8">
        {/* Background Circle */}
        <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />

        <div className="relative z-10 flex h-24 w-24 items-center justify-center">
          {/* Progress SVG */}
          <svg className="absolute h-full w-full -rotate-90">
            <circle cx="48" cy="48" r="24" className="stroke-gray-800" strokeWidth="4" fill="none" />
            <circle
              cx="48"
              cy="48"
              r="24"
              className="stroke-blue-500 transition-all duration-1000 ease-linear"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Center Content */}
          <div className="flex items-center justify-center font-mono text-xl font-bold text-white">{timeLeft}s</div>
        </div>
      </div>

      <h3 className="mb-2 font-semibold text-white">Verifying...</h3>

      <p className="mb-8 text-xs tracking-wider text-gray-500 uppercase">Please wait</p>
    </SlidePage>
  );
}
