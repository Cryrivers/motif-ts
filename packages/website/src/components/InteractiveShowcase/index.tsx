'use client';

import { conditionalEdge } from '@motif-ts/core/edge/non-serializable';
import { useIsWorkflowRunning } from '@motif-ts/react';
import { Play, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import ReactFlow, { Background, Edge, MarkerType, Node, useEdgesState, useNodesState } from 'reactflow';

import 'reactflow/dist/style.css';

import { cn } from '@/lib/cn';

import Button from '../Button';
import GlassPanel from '../GlassPanel';
import MotifStepNode, { MotifStepData } from '../MotifStepNode';
import SectionHeading from '../SectionHeading';
import LivePreview from './LivePreview';
import { initiateWorkflow, InputStep, PlanStep, ProfileStep, SuccessStep, VerifyStep } from './utils';
import YourCode from './YourCode';

const nodeTypes = {
  motifStep: MotifStepNode,
};

const STEPS_INFO = [
  {
    id: 'input',
    label: 'User Input',
    code: '({ next }) => ({ submit: (email) => next({ email }) })',
    input: 'void',
    output: '{ email }',
  },
  {
    id: 'verify',
    label: 'Verify Email',
    code: 'async ({ next }) => { await api.check(); next({ ...input, isVerified: true }) }',
    input: '{ email }',
    output: '{ email, isVerified }',
  },
  {
    id: 'profile',
    label: 'Profile',
    code: '({ next, input }) => ({ submit: (name, role) => next({ ...input, name, role }) })',
    input: '{ email }',
    output: '{ email, name, role }',
  },
  {
    id: 'plan',
    label: 'Select Plan',
    code: '({ next, input }) => ({ select: (plan) => next({ ...input, plan }) })',
    input: '{ email }',
    output: '{ email, plan }',
  },
  {
    id: 'success',
    label: 'Success',
    code: '({ input }) => <SuccessUI data={input} />',
    input: '{ ...data }',
    output: 'void',
  },
];

export default function InteractiveShowcase() {
  const [activeSteps, setActiveSteps] = useState<string[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [useConditional, setUseConditional] = useState(false);
  const [errorShake, setErrorShake] = useState<string | null>(null);

  const [yourWorkflow, setYourWorkflow] = useState(initiateWorkflow);

  // @ts-expect-error fix type error
  const isRunning = useIsWorkflowRunning(yourWorkflow);

  const isValidConnection = (prevId: string, nextId: string) => {
    // Input must be first
    if (prevId === 'input') return nextId !== 'input';

    // Success must be last (nothing connects FROM success)
    if (prevId === 'success') return false;

    // Can't connect to Input (except as first, handled above)
    if (nextId === 'input') return false;

    // Prevent self-loops for simplicity in this demo
    if (prevId === nextId) return false;

    return true;
  };

  const addStep = (stepId: string) => {
    if (activeSteps.includes(stepId)) return;

    // Check validity with previous step
    if (activeSteps.length > 0) {
      const prevStepId = activeSteps[activeSteps.length - 1];
      if (!isValidConnection(prevStepId, stepId)) {
        setErrorShake(stepId);
        setTimeout(() => setErrorShake(null), 500);
        return;
      }
    } else {
      // First step MUST be input
      if (stepId !== 'input') {
        setErrorShake(stepId);
        setTimeout(() => setErrorShake(null), 500);
        return;
      }
    }

    const newActiveSteps = [...activeSteps, stepId];
    setActiveSteps(newActiveSteps);

    const stepInfo = STEPS_INFO.find((s) => s.id === stepId)!;
    const newNode: Node<MotifStepData> = {
      id: stepId,
      type: 'motifStep',
      data: {
        label: stepInfo.label,
        inputSchema: stepInfo.input,
        outputSchema: stepInfo.output,
        status: 'idle',
      },
      position: { x: 250, y: newActiveSteps.length * 150 },
    };

    setNodes((nds) => [...nds, newNode]);

    if (newActiveSteps.length > 1) {
      const prevStepId = newActiveSteps[newActiveSteps.length - 2];
      const newEdge: Edge = {
        id: `e${prevStepId}-${stepId}`,
        source: prevStepId,
        target: stepId,
        animated: true,
        style: { stroke: '#333' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#333' },
      };

      if (useConditional && prevStepId === 'input' && stepId === 'verify') {
        newEdge.label = 'valid?';
        newEdge.style = { stroke: '#eab308' };
        newEdge.markerEnd = { type: MarkerType.ArrowClosed, color: '#eab308' };
      }

      setEdges((eds) => [...eds, newEdge]);
    }
  };

  const resetBuilder = () => {
    setActiveSteps([]);
    setNodes([]);
    setEdges([]);
    yourWorkflow.stop();
    setYourWorkflow(initiateWorkflow);
  };

  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === 'input' && edge.target === 'verify') {
          return {
            ...edge,
            label: useConditional ? 'valid?' : undefined,
            style: { stroke: useConditional ? '#eab308' : '#333' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: useConditional ? '#eab308' : '#333',
            },
          };
        }
        return edge;
      }),
    );
  }, [useConditional, setEdges]);

  const runWorkflow = async () => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    try {
      // Create instances
      const stepInstances: any[] = [];
      const instanceMap = new Map<string, any>();

      activeSteps.forEach((id) => {
        let instance;
        if (id === 'input') instance = InputStep();
        else if (id === 'verify') instance = VerifyStep();
        else if (id === 'profile') instance = ProfileStep();
        else if (id === 'plan') instance = PlanStep();
        else if (id === 'success') instance = SuccessStep();

        if (instance) {
          stepInstances.push(instance);
          instanceMap.set(id, instance);
        }
      });

      yourWorkflow.register(stepInstances);

      for (let i = 0; i < activeSteps.length - 1; i++) {
        const currentId = activeSteps[i];
        const nextId = activeSteps[i + 1];
        const current = instanceMap.get(currentId);
        const next = instanceMap.get(nextId);

        if (useConditional && currentId === 'input') {
          yourWorkflow.connect(conditionalEdge(current, next, () => true));
        } else {
          yourWorkflow.connect(current, next);
        }
      }

      const unsub = yourWorkflow.subscribe((currentStep) => {
        const { kind, status } = currentStep;
        if (status === 'transitionIn' || status === 'ready' || status === 'transitionOut') {
          // Update status for the current node, and reset others to idle
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === kind) {
                return { ...node, data: { ...node.data, status } };
              }
              // If it's not the current node, ensure it's idle
              return { ...node, data: { ...node.data, status: 'idle' } };
            }),
          );
        }
      });

      const unsubFinish = yourWorkflow.onFinish(() => {
        handleRestart();
      });

      const firstStepId = activeSteps[0];
      if (firstStepId) {
        const firstInstance = instanceMap.get(firstStepId);
        yourWorkflow.start(firstInstance);
      }

      return () => {
        unsub();
        unsubFinish();
      };
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRestart = () => {
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));
    yourWorkflow.stop();
    setYourWorkflow(initiateWorkflow);
  };

  function captialize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  const generateCode = () => {
    const stepDefs = activeSteps.map((id) => `const ${captialize(id)} = step({ kind: '${id}' }, ...);`).join('\n');
    const creations = activeSteps.map((id) => `const ${id} = ${captialize(id)}();`).join('\n');
    const registrations = `flow.register([${activeSteps.join(', ')}])`;
    const connections = activeSteps
      .slice(0, -1)
      .map((id, i) => {
        const nextId = activeSteps[i + 1];
        if (useConditional && id === 'input' && nextId === 'verify') {
          return `    .connect(conditionalEdge(${id}, ${nextId}, 'true'))`;
        }
        return `    .connect(${id}, ${nextId})`;
      })
      .join('\n');

    return `import { workflow, step, conditionalEdge } from '@motif-ts/core';

// Your Workflow Definition
${stepDefs}

${creations}

const flow = workflow([${activeSteps.map((id) => captialize(id)).join(', ')}]);

${registrations}
${connections}
    .start();`;
  };

  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          title="Build in Seconds"
          description="Compose workflows visually or with code. motif-ts keeps them in sync."
        />

        <div className="grid h-[1600px] gap-8 md:h-[850px] md:grid-cols-2">
          {/* Visual Builder */}
          <GlassPanel className="relative flex flex-col overflow-hidden border-gray-800">
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
              {STEPS_INFO.map((step) => (
                <motion.button
                  key={step.id}
                  onClick={() => addStep(step.id)}
                  disabled={activeSteps.includes(step.id)}
                  animate={errorShake === step.id ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cn('rounded-full border px-3 py-1 text-sm backdrop-blur-md transition-all', {
                    'border-red-500 bg-red-500/20 text-red-400': errorShake === step.id,
                    'cursor-not-allowed border-gray-700 bg-gray-800/50 text-gray-500':
                      activeSteps.includes(step.id) && errorShake !== step.id,
                    'border-blue-500/50 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20':
                      !activeSteps.includes(step.id) && errorShake !== step.id,
                  })}
                >
                  + {step.label}
                </motion.button>
              ))}
              {activeSteps.length > 0 && (
                <button
                  onClick={resetBuilder}
                  className="rounded-full border border-red-500/50 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/20"
                  title="Reset"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative flex-1 bg-[#0a0c10]">
              {activeSteps.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-600">
                  <p>Add steps to start building...</p>
                </div>
              )}
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#333" gap={20} size={1} />
              </ReactFlow>
            </div>

            <div className="z-10 flex items-center justify-between border-t border-gray-800 bg-black/40 p-4 backdrop-blur-md">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white">
                <input
                  type="checkbox"
                  checked={useConditional}
                  onChange={(e) => setUseConditional(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                Use Conditional Edge
              </label>

              <Button
                onClick={runWorkflow}
                disabled={activeSteps.length === 0 || isRunning}
                variant="primary"
                className={cn(activeSteps.length === 0 || isRunning ? 'bg-gray-800 text-gray-500' : '')}
              >
                <Play className="mr-2 h-4 w-4" />
                {isRunning ? 'Running...' : 'Run Workflow'}
              </Button>
            </div>
          </GlassPanel>

          {/* Right Panel: Flip Card (Code vs Live Preview) */}
          <div className="group relative h-full" style={{ perspective: '1000px' }}>
            <motion.div
              className="relative h-full w-full"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isRunning ? 180 : 0 }}
              transition={{
                duration: 0.6,
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
            >
              <YourCode generateCode={generateCode} />
              {isRunning ? <LivePreview workflow={yourWorkflow} handleRestart={handleRestart} /> : null}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
