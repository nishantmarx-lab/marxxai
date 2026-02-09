import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toolbar } from '@/components/canvas/Toolbar';
import { WorkflowNodeComponent } from '@/components/canvas/WorkflowNode';
import { ConnectionLines } from '@/components/canvas/ConnectionLines';
import type { WorkflowNode, Connection, NodeType } from '@/components/canvas/types';
import { NODE_TYPE_CONFIG } from '@/components/canvas/types';
import { Bookmark } from 'lucide-react';

let nodeIdCounter = 0;
const makeId = () => `node-${++nodeIdCounter}`;

const Index = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const addNode = useCallback((type: NodeType, x?: number, y?: number) => {
    const config = NODE_TYPE_CONFIG[type];
    const id = makeId();
    const newNode: WorkflowNode = {
      id,
      type,
      x: x ?? 200 + nodes.length * 320,
      y: y ?? 200 + (nodes.length % 2) * 200,
      title: config.label,
      status: 'idle',
      model: type === 'text' ? 'GPT-5.2' : type === 'image' ? 'GPT-Image 1.5' : type === 'video' ? 'Runway Gen-4' : undefined,
    };

    setNodes(prev => {
      const updated = [...prev, newNode];
      // Auto-connect to last node
      if (prev.length > 0) {
        const lastNode = prev[prev.length - 1];
        setConnections(c => [...c, { id: `conn-${lastNode.id}-${id}`, from: lastNode.id, to: id }]);
      }
      return updated;
    });

    setContextMenu(null);
  }, [nodes.length]);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const hasNodes = nodes.length > 0;

  return (
    <div className="w-screen h-screen overflow-hidden canvas-bg relative">
      {/* Canvas grid */}
      <div className="absolute inset-0 canvas-grid" />

      {/* Toolbar */}
      <Toolbar onAddNode={(type) => addNode(type)} />

      {/* Top-right badge */}
      <motion.div
        className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[hsl(var(--node-bg))] border border-border/40 rounded-full px-4 py-2 text-xs text-muted-foreground"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Bookmark className="w-3.5 h-3.5 text-primary" />
        <span>Workflow saved to Brand DNA</span>
      </motion.div>

      {/* Canvas area */}
      <div
        className="absolute inset-0"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Center placeholder */}
        <AnimatePresence>
          {!hasNodes && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-light text-foreground/30 tracking-wide">Build your creative workflow</h2>
                <p className="text-sm text-muted-foreground/50">Click + to add nodes or double-click the canvas</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connections */}
        <ConnectionLines nodes={nodes} connections={connections} />

        {/* Nodes */}
        {nodes.map(node => (
          <div key={node.id} data-node>
            <WorkflowNodeComponent
              node={node}
              selected={selectedNode === node.id}
              onSelect={setSelectedNode}
              onMove={moveNode}
              onUpdateNode={updateNode}
            />
          </div>
        ))}

        {/* Context menu on double-click */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              className="absolute bg-[hsl(var(--popover))] border border-border/60 rounded-2xl p-2 shadow-2xl min-w-[180px] z-40"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-1.5 font-medium">Add Node</p>
              {(['research', 'text', 'image', 'video', 'pretest', 'publish', 'upload'] as NodeType[]).map((type) => {
                const config = NODE_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => addNode(type, contextMenu.x, contextMenu.y)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <span className="text-base">{config.icon}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom-right queue indicator */}
      <motion.div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-[hsl(var(--node-bg))] border border-border/40 rounded-full px-4 py-2 text-xs text-muted-foreground"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="font-medium text-foreground/70">Queue</span>
        <span>0 active</span>
        <span className="text-foreground/40">›</span>
      </motion.div>

      {/* Top-left branding */}
      <motion.div
        className="fixed top-5 left-20 z-50 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">M</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/90 leading-none">Marxx AI</p>
            <p className="text-[10px] text-muted-foreground">Creative Workflows</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
