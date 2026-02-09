import { useState } from 'react';
import type { WorkflowNode } from '../types';
import adImage from '@/assets/ad-image-valentine.jpg';

interface Props {
  node: WorkflowNode;
  onRun: () => void;
}

const models = ['GPT-Image 1.5', 'Flux 2', 'Ideogram 3.0', 'Stable Diffusion 3.5'];

export function ImageNodeContent({ node, onRun }: Props) {
  const [model, setModel] = useState(models[0]);

  if (node.status === 'running') {
    return (
      <div className="p-4 space-y-3">
        <div className="w-full h-32 rounded-lg shimmer" />
        <p className="text-[10px] text-muted-foreground text-center">Generating image…</p>
      </div>
    );
  }

  if (node.status === 'complete') {
    return (
      <div className="p-2">
        <img
          src={adImage}
          alt="Generated ad creative"
          className="w-full h-36 object-cover rounded-xl"
        />
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
        Generate Image
      </button>
    </div>
  );
}
