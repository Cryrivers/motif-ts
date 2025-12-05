'use client';

import { useWorkflow } from '@motif-ts/react';
import { ArrowLeft, BatteryFull, Smartphone, Square } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { FC, useState } from 'react';

import GlassPanel from '../../GlassPanel';
import { InteractiveWorkflow } from '../utils';
import { InputPage } from './InputPage';
import { PlanPage } from './PlanPage';
import { ProfilePage } from './ProfilePage';
import { SuccessPage } from './SuccessPage';
import { VerifyPage } from './VerifyPage';

const stepsOrder = ['input', 'verify', 'profile', 'plan', 'success'];

const LivePreview: FC<{ workflow: InteractiveWorkflow; handleRestart: () => void }> = ({ workflow, handleRestart }) => {
  const current = useWorkflow(workflow);
  const [navState, setNavState] = useState({ kind: current.kind, direction: 1 });

  if (navState.kind !== current.kind) {
    const prevIndex = stepsOrder.indexOf(navState.kind);
    const currentIndex = stepsOrder.indexOf(current.kind);
    const direction = currentIndex > prevIndex ? 1 : -1;
    setNavState({ kind: current.kind, direction });
  }

  return (
    <GlassPanel
      className="absolute inset-0 flex flex-col overflow-hidden border-gray-800 bg-black"
      style={{
        transform: 'rotateY(180deg)',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="flex items-center justify-between border-b border-gray-800 bg-blue-500/10 px-6 py-4 font-medium text-white">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-blue-400" />
          Live Preview
        </div>
        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 rounded bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          <Square className="h-3 w-3 fill-current" />
          Stop Running
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-linear-to-br from-gray-900 to-black p-8">
        {/* Mobile Device Frame */}
        <div className="relative mx-auto flex h-[630px] w-[300px] flex-col overflow-hidden rounded-[3rem] border-12 border-gray-800 bg-gray-900 shadow-2xl ring-1 ring-white/5">
          {/* Status Bar */}
          <div className="z-10 flex h-12 w-full items-center justify-between px-6 pt-4 text-[10px] text-white">
            <span className="pl-1 font-medium">9:41</span>
            <BatteryFull className="h-4 w-4" />
          </div>

          {/* Navigation Bar */}
          <div className="relative z-10 flex h-10 w-full items-center px-4">
            {current.canGoBack && (
              <button
                onClick={workflow.goBack}
                className="flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          {/* Screen Content */}
          <div className="relative flex flex-1 flex-col overflow-hidden bg-gray-950">
            <AnimatePresence mode="wait" custom={navState.direction}>
              {current.kind === 'input' && <InputPage onSubmit={current.state.submit} custom={navState.direction} />}

              {current.kind === 'verify' && (
                <VerifyPage
                  timeLeft={current.state.timeLeft}
                  maxTime={current.state.maxTime}
                  isActive={current.state.isActive}
                  onStart={current.state.start}
                  custom={navState.direction}
                />
              )}

              {current.kind === 'profile' && (
                <ProfilePage onSubmit={current.state.submitProfile} custom={navState.direction} />
              )}

              {current.kind === 'plan' && <PlanPage onSelect={current.state.selectPlan} custom={navState.direction} />}

              {current.kind === 'success' && (
                <SuccessPage result={current.state.data} onRestart={handleRestart} custom={navState.direction} />
              )}
            </AnimatePresence>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-800" />
        </div>
      </div>
    </GlassPanel>
  );
};

export default LivePreview;
