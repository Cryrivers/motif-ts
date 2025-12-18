'use client';

import { cn } from '@/lib/cn';
import { Database } from 'lucide-react';
import { useMemo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

export type MotifStepData = {
  label: string;
  inputSchema?: string;
  outputSchema?: string;
  status?: 'idle' | 'transitionIn' | 'ready' | 'transitionOut';
  hasStore?: boolean;
};

const MotifStepNode = ({ data }: NodeProps<MotifStepData>) => {
  // Determine if handles should exist based on schema
  const shouldHaveInput = useMemo(() => {
    return (
      !!data.inputSchema &&
      data.inputSchema !== 'void' &&
      data.inputSchema !== 'z.void()' &&
      data.inputSchema.trim() !== ''
    );
  }, [data.inputSchema]);

  const shouldHaveOutput = useMemo(() => {
    return (
      !!data.outputSchema &&
      data.outputSchema !== 'void' &&
      data.outputSchema !== 'z.void()' &&
      data.outputSchema.trim() !== ''
    );
  }, [data.outputSchema]);

  const getStatusColor = (s?: string, important?: boolean, state: 'input' | 'output' | 'both' = 'both') => {
    if (s === 'transitionIn' && (state === 'input' || state === 'both')) {
      return important
        ? '!border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
        : 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
    } else if (s === 'ready' && state === 'both') {
      return important
        ? '!border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
        : 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
    } else if (s === 'transitionOut' && (state === 'output' || state === 'both')) {
      return important
        ? '!border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        : 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    } else {
      return important ? '!border-border' : 'border-border';
    }
  };

  const getStatusLabel = (s?: string) => {
    switch (s) {
      case 'transitionIn':
        return 'Transition In';
      case 'ready':
        return 'Running';
      case 'transitionOut':
        return 'Transition Out';
      default:
        return 'Idle';
    }
  };

  return (
    <div
      className={cn(
        'min-w-[200px] rounded-xl border-2 bg-background transition-all duration-300',
        getStatusColor(data.status),
      )}
    >
      {/* {targetPosition && shouldHaveInput ? ( */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={true}
        className={cn(
          '!bg-gray-[#0a0a0a] h-3! w-3! border-2! transition-all!',
          getStatusColor(data.status, true, 'input'),
        )}
      />
      {/* ) : null} */}

      {/* Header */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-border bg-secondary/50 p-3">
        <span className="font-bold text-foreground">{data.label}</span>
        {data.hasStore && <Database className="h-4 w-4 text-purple-400" />}
      </div>

      {/* Body */}
      <div className="space-y-2 p-3">
        {data.inputSchema && (
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="text-blue-400">In:</span> {data.inputSchema}
          </div>
        )}
        {data.outputSchema && (
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="text-green-400">Out:</span> {data.outputSchema}
          </div>
        )}

        {/* Status Badge */}
        <div
          className={cn('mt-2 w-fit rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase', {
            'bg-secondary text-muted': data.status === 'idle',
            'bg-yellow-500/20 text-yellow-400': data.status === 'transitionIn',
            'bg-green-500/20 text-green-400': data.status === 'ready',
            'bg-blue-500/20 text-blue-400': data.status === 'transitionOut',
          })}
        >
          {getStatusLabel(data.status)}
        </div>
      </div>
      {/* {sourcePosition && shouldHaveOutput ? ( */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={true}
        className={cn(
          'h-3! w-3! border-2! bg-background! transition-all!',
          getStatusColor(data.status, true, 'output'),
        )}
      />
      {/* ) : null} */}
    </div>
  );
};

export default MotifStepNode;
