import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toolbar } from '@/components/canvas/Toolbar';
import { WorkflowNodeComponent, NODE_WIDTH } from '@/components/canvas/WorkflowNode';
import { ConnectionLines, getOutputPoint, getInputPoint } from '@/components/canvas/ConnectionLines';
import type { WorkflowNode, Connection, NodeType } from '@/components/canvas/types';
import { NODE_TYPE_CONFIG } from '@/components/canvas/types';
import { Bookmark } from 'lucide-react';

let nodeIdCounter = 0;
const makeId = () => `node-${++nodeIdCounter}`;

interface DragState {
  fromNodeId: string;
  fromSide: 'left' | 'right';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

function getHandlePosition(node: WorkflowNode, side: 'left' | 'right') {
  if (side === 'right') return getOutputPoint(node);
  return getInputPoint(node);
}

const HANDLE_HIT_RADIUS = 24;

const Index = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ nodeId: string; side: 'left' | 'right' } | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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

    setNodes(prev => [...prev, newNode]);
    setContextMenu(null);
  }, [nodes.length]);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const deleteConnection = useCallback((connId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
    setHoveredConnection(null);
  }, []);

  // ---- Handle drag-to-connect ----
  const handleHandleDragStart = useCallback((nodeId: string, side: 'left' | 'right', e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const pos = getHandlePosition(node, side);
    setDragState({
      fromNodeId: nodeId,
      fromSide: side,
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y,
    });
  }, [nodes]);

  // Find closest handle to cursor
  const findDropTarget = useCallback((cursorX: number, cursorY: number, fromNodeId: string): { nodeId: string; side: 'left' | 'right' } | null => {
    let best: { nodeId: string; side: 'left' | 'right'; dist: number } | null = null;

    for (const node of nodes) {
      if (node.id === fromNodeId) continue;
      for (const side of ['left', 'right'] as const) {
        const pos = getHandlePosition(node, side);
        const dist = Math.hypot(cursorX - pos.x, cursorY - pos.y);
        if (dist < HANDLE_HIT_RADIUS && (!best || dist < best.dist)) {
          best = { nodeId: node.id, side, dist };
        }
      }
    }
    return best ? { nodeId: best.nodeId, side: best.side } : null;
  }, [nodes]);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update the dragging line from the current handle position (node may have moved)
      const node = nodes.find(n => n.id === dragState.fromNodeId);
      if (node) {
        const pos = getHandlePosition(node, dragState.fromSide);
        setDragState(prev => prev ? { ...prev, startX: pos.x, startY: pos.y, endX: x, endY: y } : null);
      } else {
        setDragState(prev => prev ? { ...prev, endX: x, endY: y } : null);
      }

      const target = findDropTarget(x, y, dragState.fromNodeId);
      setDropTarget(target);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) { setDragState(null); setDropTarget(null); return; }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const target = findDropTarget(x, y, dragState.fromNodeId);

      if (target) {
        // Determine from/to: right→left is natural (output→input)
        let fromId = dragState.fromNodeId;
        let toId = target.nodeId;

        // If dragging from left handle to right handle, reverse
        if (dragState.fromSide === 'left' && target.side === 'right') {
          fromId = target.nodeId;
          toId = dragState.fromNodeId;
        }

        // Check no duplicate
        const exists = connections.some(c => c.from === fromId && c.to === toId);
        // Check no self-connection
        if (fromId !== toId && !exists) {
          const connId = `conn-${fromId}-${toId}-${Date.now()}`;
          setConnections(prev => [...prev, { id: connId, from: fromId, to: toId }]);
        }
      } else {
        // Dropped on empty canvas — show context menu to create & connect
        setContextMenu({ x, y });
      }

      setDragState(null);
      setDropTarget(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, nodes, connections, findDropTarget]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node-id]')) return;
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node-id]')) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const draggingLine = dragState ? {
    startX: dragState.startX,
    startY: dragState.startY,
    endX: dragState.endX,
    endY: dragState.endY,
  } : null;

  const hasNodes = nodes.length > 0;

  return (
    <div className="w-screen h-screen overflow-hidden canvas-bg relative">
      <div className="absolute inset-0 canvas-grid" />

      <Toolbar onAddNode={(type) => addNode(type)} />

      <motion.div
        className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[hsl(var(--node-bg))] border border-border/40 rounded-full px-4 py-2 text-xs text-muted-foreground"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Bookmark className="w-3.5 h-3.5 text-primary" />
        <span>Workflow saved to Brand DNA</span>
      </motion.div>

      <div
        ref={canvasRef}
        className={`absolute inset-0 ${dragState ? 'cursor-crosshair' : ''}`}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
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

        <ConnectionLines
          nodes={nodes}
          connections={connections}
          draggingLine={draggingLine}
          onDeleteConnection={deleteConnection}
          hoveredConnection={hoveredConnection}
          onHoverConnection={setHoveredConnection}
        />

        {nodes.map(node => (
          <div key={node.id} data-node>
            <WorkflowNodeComponent
              node={node}
              selected={selectedNode === node.id}
              onSelect={setSelectedNode}
              onMove={moveNode}
              onUpdateNode={updateNode}
              onHandleDragStart={handleHandleDragStart}
              isDropTarget={dropTarget?.nodeId === node.id}
              dropSide={dropTarget?.nodeId === node.id ? dropTarget.side : null}
            />
          </div>
        ))}

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
