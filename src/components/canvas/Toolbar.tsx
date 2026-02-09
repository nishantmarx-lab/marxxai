import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutTemplate, History, LayoutGrid, Link2, Radio, MessageCircle, HelpCircle, User } from 'lucide-react';
import type { NodeType } from './types';
import { NODE_TYPE_CONFIG } from './types';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
}

const toolbarIcons = [
  { icon: LayoutTemplate, label: 'Templates' },
  { icon: History, label: 'History' },
  { icon: LayoutGrid, label: 'Auto-layout' },
  { icon: Link2, label: 'Connect' },
  { icon: Radio, label: 'Publish' },
  { icon: MessageCircle, label: 'Comments' },
  { icon: HelpCircle, label: 'Help' },
];

const nodeOptions: NodeType[] = ['research', 'text', 'image', 'video', 'pretest', 'publish', 'upload'];

export function Toolbar({ onAddNode }: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed left-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center">
      <motion.div
        className="flex flex-col items-center gap-1 rounded-[28px] bg-[hsl(var(--toolbar-bg))] border border-border/50 p-2 shadow-2xl"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Plus button */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200 hover:shadow-[0_0_16px_-2px_hsl(var(--glow-blue)/0.4)]"
          >
            <Plus className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-14 top-0 bg-[hsl(var(--popover))] border border-border/60 rounded-2xl p-2 shadow-2xl min-w-[180px]"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-1.5 font-medium">Add Node</p>
                {nodeOptions.map((type) => {
                  const config = NODE_TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      onClick={() => { onAddNode(type); setMenuOpen(false); }}
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

        <div className="w-6 h-px bg-border/50 my-1" />

        {toolbarIcons.map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
          >
            <Icon className="w-[18px] h-[18px]" />
          </button>
        ))}

        <div className="w-6 h-px bg-border/50 my-1" />

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </motion.div>
    </div>
  );
}
