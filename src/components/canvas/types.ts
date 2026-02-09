export type NodeType = 'research' | 'text' | 'image' | 'video' | 'pretest' | 'publish' | 'upload';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  title: string;
  status: 'idle' | 'running' | 'complete';
  model?: string;
  output?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, { label: string; icon: string; color: string }> = {
  research: { label: 'Research', icon: '🔍', color: 'primary' },
  text: { label: 'Text', icon: '✍️', color: 'primary' },
  image: { label: 'Image', icon: '🖼', color: 'accent' },
  video: { label: 'Video', icon: '🎬', color: 'accent' },
  pretest: { label: 'Pre-Test', icon: '📊', color: 'primary' },
  publish: { label: 'Publish', icon: '🚀', color: 'accent' },
  upload: { label: 'Upload', icon: '📁', color: 'primary' },
};
