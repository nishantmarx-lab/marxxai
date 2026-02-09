import type { WorkflowNode, Connection } from './types';
import { NODE_WIDTH } from './WorkflowNode';

interface ConnectionLinesProps {
  nodes: WorkflowNode[];
  connections: Connection[];
  draggingLine: { startX: number; startY: number; endX: number; endY: number } | null;
  onDeleteConnection: (id: string) => void;
  hoveredConnection: string | null;
  onHoverConnection: (id: string | null) => void;
}

export function getOutputPoint(node: WorkflowNode): { x: number; y: number } {
  // We need the actual node height. Approximate based on type/status.
  const h = estimateNodeHeight(node);
  return { x: node.x + NODE_WIDTH, y: node.y + h / 2 };
}

export function getInputPoint(node: WorkflowNode): { x: number; y: number } {
  const h = estimateNodeHeight(node);
  return { x: node.x, y: node.y + h / 2 };
}

function estimateNodeHeight(node: WorkflowNode): number {
  // Header ~44px + content varies ~80-160
  const base = 44;
  if (node.status === 'complete') {
    if (node.type === 'image') return base + 152;
    if (node.type === 'video') return base + 120;
    return base + 100;
  }
  if (node.status === 'running') return base + 60;
  if (node.type === 'text') return base + 160;
  return base + 100;
}

function buildPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = Math.abs(end.x - start.x) * 0.5;
  const minDx = 50;
  const cx = Math.max(dx, minDx);
  return `M ${start.x} ${start.y} C ${start.x + cx} ${start.y}, ${end.x - cx} ${end.y}, ${end.x} ${end.y}`;
}

export function ConnectionLines({
  nodes, connections, draggingLine,
  onDeleteConnection, hoveredConnection, onHoverConnection,
}: ConnectionLinesProps) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="conn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(210 70% 55% / 0.6)" />
          <stop offset="100%" stopColor="hsl(262 50% 58% / 0.6)" />
        </linearGradient>
        <linearGradient id="conn-gradient-hover" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0 70% 55% / 0.8)" />
          <stop offset="100%" stopColor="hsl(0 50% 58% / 0.8)" />
        </linearGradient>
        <linearGradient id="conn-drag" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(210 80% 65% / 0.8)" />
          <stop offset="100%" stopColor="hsl(262 60% 65% / 0.8)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Existing connections */}
      {connections.map((conn) => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        if (!fromNode || !toNode) return null;

        const start = getOutputPoint(fromNode);
        const end = getInputPoint(toNode);
        const path = buildPath(start, end);
        const isHovered = hoveredConnection === conn.id;

        return (
          <g key={conn.id}>
            {/* Glow layer */}
            <path
              d={path}
              fill="none"
              stroke={isHovered ? "url(#conn-gradient-hover)" : "url(#conn-gradient)"}
              strokeWidth={isHovered ? 4 : 3}
              opacity={isHovered ? 0.5 : 0.3}
              filter="url(#glow)"
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={isHovered ? "url(#conn-gradient-hover)" : "url(#conn-gradient)"}
              strokeWidth={isHovered ? 2.5 : 1.5}
              opacity={isHovered ? 1 : 0.7}
            />
            {/* Flow animation */}
            <path
              d={path}
              fill="none"
              stroke={isHovered ? "hsl(0 70% 60% / 0.6)" : "hsl(210 70% 70% / 0.5)"}
              strokeWidth="1.5"
              className="connection-flow"
            />
            {/* Invisible wide hit area for interaction */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => onHoverConnection(conn.id)}
              onMouseLeave={() => onHoverConnection(null)}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConnection(conn.id);
              }}
            />
            {/* Delete indicator on hover */}
            {isHovered && (
              <>
                <circle
                  cx={(start.x + end.x) / 2}
                  cy={(start.y + end.y) / 2}
                  r="10"
                  fill="hsl(0 70% 50% / 0.9)"
                  style={{ pointerEvents: 'none' }}
                />
                <text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  ×
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Dragging line */}
      {draggingLine && (
        <g>
          <path
            d={buildPath(
              { x: draggingLine.startX, y: draggingLine.startY },
              { x: draggingLine.endX, y: draggingLine.endY },
            )}
            fill="none"
            stroke="url(#conn-drag)"
            strokeWidth="2"
            strokeDasharray="6 4"
            filter="url(#glow)"
          />
          <circle
            cx={draggingLine.endX}
            cy={draggingLine.endY}
            r="5"
            fill="hsl(210 80% 65% / 0.8)"
            filter="url(#glow)"
          />
        </g>
      )}
    </svg>
  );
}
