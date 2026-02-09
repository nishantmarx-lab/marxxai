import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { WorkflowNode as WNode, NodeType } from './types';
import { NODE_TYPE_CONFIG } from './types';
import { ResearchNodeContent } from './nodes/ResearchNodeContent';
import { TextNodeContent } from './nodes/TextNodeContent';
import { ImageNodeContent } from './nodes/ImageNodeContent';
import { VideoNodeContent } from './nodes/VideoNodeContent';

interface WorkflowNodeProps {
  node: WNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onUpdateNode: (id: string, updates: Partial<WNode>) => void;
}

export function WorkflowNodeComponent({ node, selected, onSelect, onMove, onUpdateNode }: WorkflowNodeProps) {
  const config = NODE_TYPE_CONFIG[node.type];
  const dragRef = useRef<{ startX: number; startY: number; nodeX: number; nodeY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, nodeX: node.x, nodeY: node.y };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onMove(node.id, dragRef.current.nodeX + dx, dragRef.current.nodeY + dy);
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [node.id, node.x, node.y, onSelect, onMove]);

  const runNode = useCallback(() => {
    onUpdateNode(node.id, { status: 'running' });
    setTimeout(() => {
      onUpdateNode(node.id, { status: 'complete' });
    }, 2200);
  }, [node.id, onUpdateNode]);

  const renderContent = () => {
    switch (node.type) {
      case 'research': return <ResearchNodeContent node={node} onRun={runNode} />;
      case 'text': return <TextNodeContent node={node} onRun={runNode} />;
      case 'image': return <ImageNodeContent node={node} onRun={runNode} />;
      case 'video': return <VideoNodeContent node={node} onRun={runNode} />;
      default: return <div className="p-3 text-sm text-muted-foreground">Configure {config.label}...</div>;
    }
  };

  return (
    <motion.div
      className={`absolute select-none cursor-grab active:cursor-grabbing`}
      style={{ left: node.x, top: node.y, zIndex: selected ? 10 : 2 }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`w-[280px] rounded-2xl border transition-all duration-300 ${
          selected
            ? 'border-primary/60 node-glow-blue'
            : node.status === 'running'
            ? 'border-accent/50 node-glow-violet'
            : 'border-[hsl(var(--node-border))] hover:border-primary/30'
        } bg-[hsl(var(--node-bg))] backdrop-blur-sm overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
          <span className="text-sm">{config.icon}</span>
          <span className="text-sm font-medium text-foreground/90">{node.title}</span>
          {node.model && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
              {node.model}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="relative">
          {renderContent()}
        </div>

        {/* Connection handles */}
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted border-2 border-primary/40 hover:border-primary transition-colors" />
        <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted border-2 border-primary/40 hover:border-primary transition-colors" />
      </div>
    </motion.div>
  );
}
