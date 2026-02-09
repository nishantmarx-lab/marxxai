import { useState } from 'react';
import type { WorkflowNode } from '../types';

interface Props {
  node: WorkflowNode;
  onRun: () => void;
}

const models = ['OpenAI', 'Anthropic', 'Google'];

export function TextNodeContent({ node, onRun }: Props) {
  const [model, setModel] = useState(models[0]);

  if (node.status === 'running') {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary thinking-dot" />
          </div>
          <span>Generating copy…</span>
        </div>
      </div>
    );
  }

  if (node.status === 'complete') {
    return (
      <div className="p-4 space-y-2">
        <p className="text-[11px] text-foreground/80 leading-relaxed italic">
          "A woman scrolling endlessly at night, realizing the perfect Valentine's gift is harder than expected…"
        </p>
        <p className="text-[10px] text-muted-foreground">Based on the initial recommendation</p>
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
      <textarea
        className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none h-16"
        placeholder="Write a Valentine's ad hook based on research…"
        defaultValue="Write a cinematic ad hook using the top-performing Valentine's Day insights"
        onMouseDown={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onRun(); }}
        className="w-full bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium py-2 rounded-lg transition-colors"
      >
        Generate Text
      </button>
    </div>
  );
}
