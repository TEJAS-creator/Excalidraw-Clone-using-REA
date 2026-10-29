import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { AppState, ExcalidrawElement } from '../types';
import { worldToScreen } from '../utils/coordinates';

interface TextEditorProps {
  element: ExcalidrawElement | null;
  appState: AppState;
  onCommitText: (elementId: string, text: string, width: number, height: number) => void;
  onCancel: () => void;
}

export const TextEditor = ({
  element,
  appState,
  onCommitText,
  onCancel,
}: TextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState(element?.text || '');

  useEffect(() => {
    if (element) {
      setText(element.text || '');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 20);
    }
  }, [element?.id]);

  if (!element) return null;

  const screenPos = worldToScreen(
    element.x,
    element.y,
    appState.scrollX,
    appState.scrollY,
    appState.zoom,
  );

  const fontSize = (element.fontSize || 24) * appState.zoom;
  const fontFamily = element.fontFamily || 'Caveat, cursive';

  const handleFinish = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      onCancel();
      return;
    }

    // Measure bounding box of multi-line text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let maxWidth = 10;
    const lines = text.split('\n');
    const baseFontSize = element.fontSize || 24;

    if (ctx) {
      ctx.font = `${baseFontSize}px ${fontFamily}`;
      lines.forEach((line) => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) {
          maxWidth = metrics.width;
        }
      });
    }

    const calculatedHeight = lines.length * (baseFontSize * 1.25);
    onCommitText(element.id, text, maxWidth + 10, calculatedHeight);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    // Commit on Shift+Enter or Ctrl+Enter
    if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && e.shiftKey)) {
      e.preventDefault();
      handleFinish();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
        zIndex: 50,
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleFinish}
        onKeyDown={handleKeyDown}
        placeholder="Type something..."
        className="inline-text-editor"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily,
          color: element.strokeColor,
          lineHeight: 1.25,
        }}
      />
    </div>
  );
};
