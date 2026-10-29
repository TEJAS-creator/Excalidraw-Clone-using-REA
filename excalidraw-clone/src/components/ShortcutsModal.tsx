import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { category: 'Drawing Tools', items: [
      { key: 'V / 1', desc: 'Select tool' },
      { key: 'R / 2', desc: 'Rectangle tool' },
      { key: 'D / 3', desc: 'Diamond tool' },
      { key: 'E / 4', desc: 'Ellipse tool' },
      { key: 'A / 5', desc: 'Arrow tool' },
      { key: 'L / 6', desc: 'Line tool' },
      { key: 'P / 7', desc: 'Pencil / Freehand draw' },
      { key: 'T / 8', desc: 'Text tool' },
      { key: '0', desc: 'Eraser tool' },
      { key: 'H', desc: 'Hand (Pan) tool' },
    ]},
    { category: 'Manipulation', items: [
      { key: 'Ctrl + Z', desc: 'Undo action' },
      { key: 'Ctrl + Y / Ctrl + Shift + Z', desc: 'Redo action' },
      { key: 'Ctrl + D', desc: 'Duplicate selected elements' },
      { key: 'Backspace / Del', desc: 'Delete selected elements' },
      { key: 'Shift + Click', desc: 'Multi-select elements' },
      { key: 'Drag handle', desc: 'Resize element' },
    ]},
    { category: 'Canvas Viewport', items: [
      { key: 'Space + Drag', desc: 'Pan infinite canvas' },
      { key: 'Ctrl + Wheel', desc: 'Zoom in / out around cursor' },
      { key: 'Ctrl + 0', desc: 'Reset zoom to 100%' },
      { key: "Ctrl + '", desc: 'Toggle infinite canvas grid' },
      { key: 'Esc', desc: 'Deselect / Cancel active action' },
    ]},
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card shortcuts-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Keyboard size={20} className="modal-sparkle-icon" />
            <h2 className="modal-title">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body shortcuts-grid">
          {shortcuts.map((group) => (
            <div key={group.category} className="shortcut-group">
              <h3 className="shortcut-group-title">{group.category}</h3>
              <div className="shortcut-list">
                {group.items.map((item) => (
                  <div key={item.key} className="shortcut-item">
                    <span className="shortcut-desc">{item.desc}</span>
                    <kbd className="shortcut-kbd">{item.key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
