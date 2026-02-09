import type { WorkflowNode, Connection } from './types';

interface ConnectionLinesProps {
  nodes: WorkflowNode[];
  connections: Connection[];
}

function getNodeCenter(node: WorkflowNode): { x: number; y: number } {
  return { x: node.x + 140, y: node.y + 80 };
}

function getOutputPoint(node: WorkflowNode): { x: number; y: number } {
  return { x: node.x + 280, y: node.y + 80 };
}

function getInputPoint(node: WorkflowNode): { x: number; y: number } {
  return { x: node.x, y: node.y + 80 };
}

export function ConnectionLines({ nodes, connections }: ConnectionLinesProps) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="conn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(210 70% 55% / 0.6)" />
          <stop offset="100%" stopColor="hsl(262 50% 58% / 0.6)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map((conn) => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        if (!fromNode || !toNode) return null;

        const start = getOutputPoint(fromNode);
        const end = getInputPoint(toNode);
        const dx = Math.abs(end.x - start.x) * 0.5;

        const path = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

        return (
          <g key={conn.id}>
            {/* Glow layer */}
            <path
              d={path}
              fill="none"
              stroke="url(#conn-gradient)"
              strokeWidth="3"
              opacity="0.3"
              filter="url(#glow)"
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke="url(#conn-gradient)"
              strokeWidth="1.5"
              opacity="0.7"
            />
            {/* Flow animation */}
            <path
              d={path}
              fill="none"
              stroke="hsl(210 70% 70% / 0.5)"
              strokeWidth="1.5"
              className="connection-flow"
            />
          </g>
        );
      })}
    </svg>
  );
}
