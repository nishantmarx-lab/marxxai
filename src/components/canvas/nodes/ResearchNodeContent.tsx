import type { WorkflowNode } from '../types';

interface Props {
  node: WorkflowNode;
  onRun: () => void;
}

export function ResearchNodeContent({ node, onRun }: Props) {
  if (node.status === 'running') {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-accent text-sm">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" />
          </div>
          <span className="text-xs text-muted-foreground">Marxx Agent analyzing past ads…</span>
        </div>
      </div>
    );
  }

  if (node.status === 'complete') {
    return (
      <div className="p-4 space-y-2">
        <p className="text-xs font-medium text-primary">Top performing Valentine's Day hooks (last 15 days)</p>
        <ul className="space-y-1.5 text-[11px] text-foreground/70 leading-relaxed">
          <li className="flex gap-2"><span className="text-primary/60">•</span>"People don't remember gifts. They remember effort."</li>
          <li className="flex gap-2"><span className="text-primary/60">•</span>"This is the gift he won't forget."</li>
          <li className="flex gap-2"><span className="text-primary/60">•</span>"Still looking? You're already late."</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <input
        className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        placeholder="Ask Marxx Agent…"
        defaultValue="Analyze top Valentine's Day ad hooks"
        onMouseDown={(e) => e.stopPropagation()}
      />
      <button
        onClick={(e) => { e.stopPropagation(); onRun(); }}
        className="w-full bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium py-2 rounded-lg transition-colors"
      >
        Run Research
      </button>
    </div>
  );
}
