import type { PointerEvent, WheelEvent } from 'react';
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import rough from 'roughjs';
import type { AppState, ExcalidrawElement, SelectionBounds } from '../types';
import { renderElement } from '../utils/roughUtils';
import { getCombinedBounds } from '../utils/coordinates';
import { getSelectionHandles } from '../utils/hitTest';
import { RESIZE_HANDLE_SIZE } from '../constants';
import type { InteractionState } from '../interactionHandler';

interface CanvasRendererProps {
  elements: ExcalidrawElement[];
  appState: AppState;
  interaction: InteractionState;
  onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLCanvasElement>) => void;
  onWheel: (e: WheelEvent<HTMLCanvasElement>) => void;
}

export interface CanvasRendererHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const CanvasRenderer = forwardRef<CanvasRendererHandle, CanvasRendererProps>(
  (
    {
      elements,
      appState,
      interaction,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onWheel,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }));

    // Main render loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Handle Retina high-DPI buffer scaling
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Viewport Background
      ctx.fillStyle = appState.viewBackgroundColor;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Subtle Infinite Canvas Grid
      if (appState.gridEnabled) {
        const gridSize = appState.gridSize * appState.zoom;
        if (gridSize > 8) {
          const offsetX = (appState.scrollX * appState.zoom) % gridSize;
          const offsetY = (appState.scrollY * appState.zoom) % gridSize;

          const isDark =
            appState.viewBackgroundColor === '#0f172a' ||
            appState.viewBackgroundColor === '#18181b';
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

          for (let x = offsetX; x < width; x += gridSize) {
            for (let y = offsetY; y < height; y += gridSize) {
              ctx.beginPath();
              ctx.arc(x, y, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 3. Apply Camera Viewport Matrix: Translate & Scale
      ctx.translate(appState.scrollX * appState.zoom, appState.scrollY * appState.zoom);
      ctx.scale(appState.zoom, appState.zoom);

      // 4. Render All Elements using Rough.js
      const rc = rough.canvas(canvas);

      for (const el of elements) {
        if (!el.isDeleted) {
          renderElement(rc, ctx, el);
        }
      }

      // 5. Render Selection Bounding Box & Handles
      const selectedElements = elements.filter(
        (el) => appState.selectedElementIds[el.id] && !el.isDeleted,
      );

      if (selectedElements.length > 0) {
        const bounds: SelectionBounds | null = getCombinedBounds(selectedElements);

        if (bounds) {
          const padding = 6 / appState.zoom;
          const minX = bounds.minX - padding;
          const minY = bounds.minY - padding;
          const maxX = bounds.maxX + padding;
          const maxY = bounds.maxY + padding;
          const w = maxX - minX;
          const h = maxY - minY;

          // Selection dashed outline
          ctx.save();
          ctx.strokeStyle = '#6965db';
          ctx.lineWidth = 1.5 / appState.zoom;
          ctx.setLineDash([4 / appState.zoom, 4 / appState.zoom]);
          ctx.strokeRect(minX, minY, w, h);

          // Render 8 Resize Handles
          const handles = getSelectionHandles({
            minX,
            minY,
            maxX,
            maxY,
            width: w,
            height: h,
          });

          const handleSize = RESIZE_HANDLE_SIZE / appState.zoom;

          for (const handle of handles) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#6965db';
            ctx.lineWidth = 1.5 / appState.zoom;
            ctx.setLineDash([]);

            ctx.fillRect(
              handle.x - handleSize / 2,
              handle.y - handleSize / 2,
              handleSize,
              handleSize,
            );
            ctx.strokeRect(
              handle.x - handleSize / 2,
              handle.y - handleSize / 2,
              handleSize,
              handleSize,
            );
          }

          ctx.restore();
        }
      }

      // 6. Render Marquee Box Selection
      if (interaction.mode === 'marquee' && interaction.marqueeBox) {
        const { minX, minY, maxX, maxY } = interaction.marqueeBox;
        const w = maxX - minX;
        const h = maxY - minY;

        ctx.save();
        ctx.fillStyle = 'rgba(105, 101, 219, 0.08)';
        ctx.strokeStyle = '#6965db';
        ctx.lineWidth = 1 / appState.zoom;
        ctx.setLineDash([3 / appState.zoom, 3 / appState.zoom]);
        ctx.fillRect(minX, minY, w, h);
        ctx.strokeRect(minX, minY, w, h);
        ctx.restore();
      }

      ctx.restore();
    }, [elements, appState, interaction]);

    return (
      <canvas
        ref={canvasRef}
        id="excalidraw-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: interaction.cursor,
          touchAction: 'none',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    );
  },
);

CanvasRenderer.displayName = 'CanvasRenderer';
