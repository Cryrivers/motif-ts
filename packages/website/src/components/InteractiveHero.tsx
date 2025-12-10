'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactFlow, { Background, Edge, Node, useEdgesState, useNodesState } from 'reactflow';

import 'reactflow/dist/style.css';

import { cn } from '@/lib/cn';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

import Button from './Button';
import GlassPanel from './GlassPanel';
import MotifStepNode, { MotifStepData } from './MotifStepNode';

const nodeTypes = {
  motifStep: MotifStepNode,
};

const initialNodes: Node<MotifStepData>[] = [
  {
    id: '1',
    type: 'motifStep',
    data: {
      label: 'User Signup',
      inputSchema: 'z.void()',
      outputSchema: 'User',
      status: 'idle',
    },
    position: { x: 0, y: 200 },
  },
  {
    id: '2',
    type: 'motifStep',
    data: {
      label: 'Check Region',
      inputSchema: 'User',
      outputSchema: 'Region',
      status: 'idle',
    },
    position: { x: 250, y: 200 },
  },
  {
    id: '3',
    type: 'motifStep',
    data: {
      label: 'Enrich Data',
      inputSchema: 'User',
      outputSchema: 'EnrichedUser',
      hasStore: true,
      status: 'idle',
    },
    position: { x: 500, y: 50 },
  },
  {
    id: '4',
    type: 'motifStep',
    data: {
      label: 'GDPR Check',
      inputSchema: 'User',
      outputSchema: 'Compliance',
      status: 'idle',
    },
    position: { x: 500, y: 350 },
  },
  {
    id: '5',
    type: 'motifStep',
    data: {
      label: 'Score Lead',
      inputSchema: 'EnrichedUser',
      outputSchema: 'Score',
      status: 'idle',
    },
    position: { x: 750, y: 50 },
  },
  {
    id: '6',
    type: 'motifStep',
    data: {
      label: 'Consent Log',
      inputSchema: 'Compliance',
      outputSchema: 'LogEntry',
      hasStore: true,
      status: 'idle',
    },
    position: { x: 750, y: 350 },
  },
  {
    id: '7',
    type: 'motifStep',
    data: {
      label: 'Manual Review',
      inputSchema: 'LogEntry',
      outputSchema: 'ReviewResult',
      status: 'idle',
    },
    position: { x: 1000, y: 350 },
  },
  {
    id: '8',
    type: 'motifStep',
    data: {
      label: 'Decision',
      inputSchema: 'Score | Review',
      outputSchema: 'Action',
      status: 'idle',
    },
    position: { x: 1250, y: 200 },
  },
  {
    id: '9',
    type: 'motifStep',
    data: {
      label: 'Notify Sales',
      inputSchema: 'Action',
      outputSchema: 'void',
      status: 'idle',
    },
    position: { x: 1500, y: 100 },
  },
  {
    id: '10',
    type: 'motifStep',
    data: {
      label: 'Add to Nurture',
      inputSchema: 'Action',
      outputSchema: 'void',
      status: 'idle',
    },
    position: { x: 1500, y: 300 },
  },
  {
    id: '11',
    type: 'motifStep',
    data: {
      label: 'Sync to CRM',
      inputSchema: 'User',
      outputSchema: 'CRMRecord',
      hasStore: true,
      status: 'idle',
    },
    position: { x: 1750, y: 200 },
  },
  {
    id: '12',
    type: 'motifStep',
    data: {
      label: 'Success',
      inputSchema: 'void',
      outputSchema: 'void',
      status: 'idle',
    },
    position: { x: 2000, y: 200 },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    animated: true,
    style: { stroke: '#555' },
    label: 'US/CA',
    labelStyle: { fill: '#a1a1aa', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.9, rx: 4, ry: 4 },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    animated: true,
    style: { stroke: '#555' },
    label: 'EU/UK',
    labelStyle: { fill: '#a1a1aa', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.9, rx: 4, ry: 4 },
  },
  {
    id: 'e3-5',
    source: '3',
    target: '5',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e6-7',
    source: '6',
    target: '7',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e5-8',
    source: '5',
    target: '8',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e7-8',
    source: '7',
    target: '8',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e8-9',
    source: '8',
    target: '9',
    animated: true,
    style: { stroke: '#555' },
    label: 'High Priority',
    labelStyle: { fill: '#a1a1aa', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.9, rx: 4, ry: 4 },
  },
  {
    id: 'e8-10',
    source: '8',
    target: '10',
    animated: true,
    style: { stroke: '#555' },
    label: 'Standard',
    labelStyle: { fill: '#a1a1aa', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#18181b', fillOpacity: 0.9, rx: 4, ry: 4 },
  },
  {
    id: 'e9-11',
    source: '9',
    target: '11',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e10-11',
    source: '10',
    target: '11',
    animated: true,
    style: { stroke: '#555' },
  },
  {
    id: 'e11-12',
    source: '11',
    target: '12',
    animated: true,
    style: { stroke: '#555' },
  },
];

export default function InteractiveHero() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isRunning, setIsRunning] = useState(false);

  const updateNodeStatus = useCallback(
    (id: string, status: MotifStepData['status']) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, status } };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const runSimulation = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Reset all nodes
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })));

    let currentNodeId = '1';

    // Build adjacency list for traversal
    const adjacency: Record<string, string[]> = {};
    initialEdges.forEach((edge) => {
      if (!adjacency[edge.source]) adjacency[edge.source] = [];
      adjacency[edge.source].push(edge.target);
    });

    while (currentNodeId) {
      // Transition In
      updateNodeStatus(currentNodeId, 'transitionIn');
      await new Promise((r) => setTimeout(r, 600));

      // Ready (Processing)
      updateNodeStatus(currentNodeId, 'ready');
      await new Promise((r) => setTimeout(r, 800));

      // Transition Out
      updateNodeStatus(currentNodeId, 'transitionOut');
      await new Promise((r) => setTimeout(r, 400));

      // Idle (Done)
      updateNodeStatus(currentNodeId, 'idle');

      // Find next steps
      const nextOptions = adjacency[currentNodeId];
      if (!nextOptions || nextOptions.length === 0) {
        currentNodeId = ''; // End of flow
      } else {
        // Randomly pick next node if multiple branches
        currentNodeId = nextOptions[Math.floor(Math.random() * nextOptions.length)];
      }
    }

    setIsRunning(false);
  }, [isRunning, setNodes, updateNodeStatus]);

  // Auto-run simulation
  useEffect(() => {
    const interval = setInterval(() => {
      runSimulation();
    }, 35000);

    // Initial run after mount
    const timer = setTimeout(() => {
      runSimulation();
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [runSimulation]);

  return (
    <section className="flex flex-col items-center justify-center pt-20">
      {/* Background Grid */}
      <div className="grid-bg pointer-events-none absolute inset-0 z-0" />

      <div className="mb-10 max-w-3xl px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-5xl font-semibold tracking-tighter md:text-8xl"
        >
          Workflow Orchestration <br />
          <span className="text-gradient">Reimagined</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 text-xl text-gray-400"
        >
          Dead simple. Fully typed. Effortlessly orchestrated.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center gap-4"
        >
          <a href="https://github.com/Cryrivers/motif-ts" target="_blank" rel="noopener noreferrer">
            <Button variant="glass" size="lg" className="group rounded-full px-8 py-3">
              Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Interactive Graph Container - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="relative hidden h-[500px] w-full max-w-6xl md:block"
      >
        <GlassPanel className="h-full w-full overflow-hidden border-gray-800 shadow-2xl">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            className="pointer-events-none"
            fitView={true}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            panOnScroll={false}
            panOnDrag={false}
            zoomOnDoubleClick={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#333" gap={20} size={1} />
          </ReactFlow>
        </GlassPanel>

        {/* Overlay Badge */}
        <div className="glass-button absolute top-4 right-4 flex items-center gap-2 rounded-full px-3 py-1 text-xs text-gray-400">
          <div className={cn('h-2 w-2 rounded-full', isRunning ? 'animate-pulse bg-green-500' : 'bg-gray-500')} />
          {isRunning ? 'Workflow Running...' : 'Idle'}
        </div>
      </motion.div>

      {/* Mobile: Simplified workflow visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mx-4 block md:hidden"
      >
        <GlassPanel className="border-gray-800 p-6 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', isRunning ? 'animate-pulse bg-green-500' : 'bg-gray-500')} />
            <span className="text-sm text-gray-400">{isRunning ? 'Workflow Running...' : 'Interactive Demo'}</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-500">
            Explore the full interactive workflow diagram on a larger screen.
          </p>
        </GlassPanel>
      </motion.div>
    </section>
  );
}
