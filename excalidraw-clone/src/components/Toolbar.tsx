import type { ReactNode } from 'react';
import {
  MousePointer2,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Eraser,
  Hand,
} from 'lucide-react';
import type { ToolType } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolConfig {
  id: ToolType;
  label: string;
  icon: ReactNode;
  shortcut: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onSelectTool }) => {
  const tools: ToolConfig[] = [
    { id: 'pan', label: 'Hand (Pan Canvas)', icon: <Hand size={18} />, shortcut: 'H' },
    { id: 'selection', label: 'Selection', icon: <MousePointer2 size={18} />, shortcut: 'V' },
    { id: 'rectangle', label: 'Rectangle', icon: <Square size={18} />, shortcut: 'R' },
    { id: 'diamond', label: 'Diamond', icon: <Diamond size={18} />, shortcut: 'D' },
    { id: 'ellipse', label: 'Ellipse', icon: <Circle size={18} />, shortcut: 'E' },
    { id: 'arrow', label: 'Arrow', icon: <ArrowRight size={18} />, shortcut: 'A' },
    { id: 'line', label: 'Line', icon: <Minus size={18} />, shortcut: 'L' },
    { id: 'freedraw', label: 'Draw (Pencil)', icon: <Pencil size={18} />, shortcut: 'P' },
    { id: 'text', label: 'Text', icon: <Type size={18} />, shortcut: 'T' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser size={18} />, shortcut: '0' },
  ];

  return (
    <nav
      aria-label="Drawing Tools"
      className="toolbar-container"
    >
      <div className="toolbar-island">
        {tools.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              id={`tool-btn-${tool.id}`}
              className={`tool-button ${isActive ? 'tool-button-active' : ''}`}
              onClick={() => onSelectTool(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={tool.label}
              aria-pressed={isActive}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-shortcut-badge">{tool.shortcut}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
