import { useState } from 'react';
import { Play } from 'lucide-react';
import type { WorkflowNode } from '../types';

interface Props {
  node: WorkflowNode;
  onRun: () => void;
}

const models = ['Runway Gen-4 Turbo', 'Luma Ray 2', 'Kling 3.0 Pro', 'Sora 2 Pro', 'Pika'];

export function VideoNodeContent({ node, onRun }: Props) {
  const [model, setModel] = useState(models[0]);

  if (node.status === 'running') {
    return (
      <div className="p-4 space-y-3">
        <div className="w-full h-28 rounded-lg shimmer" />
        <p className="text-[10px] text-muted-foreground text-center">Rendering video frames…</p>
      </div>
    );
  }

  if (node.status === 'complete') {
    return (
      <div className="p-2">
        <div className="relative w-full h-28 rounded-xl bg-gradient-to-br from-muted to-card flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="relative z-10 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors">
            <Play className="w-4 h-4 text-primary fill-primary" />
          </div>
          <p className="absolute bottom-2 left-3 text-[10px] text-foreground/60">00:15 • 1080p</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <select
        value={model}
        onChange={(e) => setModel(e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/50"
      >
        {models.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <button
        onClick={(e) => { e.stopPropagation(); onRun(); }}
        className="w-full bg-accent/15 hover:bg-accent/25 text-accent text-xs font-medium py-2 rounded-lg transition-colors"
      >
        Generate Video
      </button>
    </div>
  );
}
