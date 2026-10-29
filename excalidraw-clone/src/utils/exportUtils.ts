import rough from 'roughjs';
import type { AppState, ExcalidrawElement, ExcalidrawSceneData } from '../types';
import { getCombinedBounds } from './coordinates';
import { renderElement } from './roughUtils';

/**
 * Serializes elements and application state into the standard Excalidraw JSON schema.
 */
export function exportToExcalidrawJSON(
  elements: ExcalidrawElement[],
  appState: AppState,
): string {
  const data: ExcalidrawSceneData = {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw-clone.local',
    elements: elements.filter((el) => !el.isDeleted),
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor,
      gridSize: appState.gridEnabled ? appState.gridSize : null,
    },
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Parses and validates an imported JSON string into Excalidraw elements.
 */
export function parseExcalidrawJSON(
  jsonText: string,
): { elements: ExcalidrawElement[]; appState?: Partial<AppState> } | null {
  try {
    const data = JSON.parse(jsonText);
    if (!data || !Array.isArray(data.elements)) {
      return null;
    }

    const validatedElements: ExcalidrawElement[] = data.elements.map((raw: any) => ({
      id: raw.id || `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: raw.type || 'rectangle',
      x: Number(raw.x) || 0,
      y: Number(raw.y) || 0,
      width: Number(raw.width) || 100,
      height: Number(raw.height) || 100,
      angle: Number(raw.angle) || 0,
      strokeColor: raw.strokeColor || '#1e1e1e',
      backgroundColor: raw.backgroundColor || 'transparent',
      fillStyle: raw.fillStyle || 'hachure',
      strokeWidth: Number(raw.strokeWidth) || 2,
      strokeStyle: raw.strokeStyle || 'solid',
      roughness: typeof raw.roughness === 'number' ? raw.roughness : 1,
      opacity: typeof raw.opacity === 'number' ? raw.opacity : 100,
      seed: Number(raw.seed) || Math.floor(Math.random() * 100000),
      points: Array.isArray(raw.points) ? raw.points : undefined,
      text: raw.text || undefined,
      fontSize: raw.fontSize || 24,
      fontFamily: raw.fontFamily || 'Caveat, cursive',
      isDeleted: false,
      groupIds: Array.isArray(raw.groupIds) ? raw.groupIds : [],
    }));

    return {
      elements: validatedElements,
      appState: data.appState ? {
        viewBackgroundColor: data.appState.viewBackgroundColor || '#ffffff',
      } : undefined,
    };
  } catch (err) {
    console.error('Failed to parse Excalidraw JSON:', err);
    return null;
  }
}

export interface ExportImageOptions {
  padding?: number;
  scale?: number; // Retina high-DPI multiplier (default 2)
  withBackground?: boolean;
  backgroundColor?: string;
}

/**
 * Renders the scene elements onto an offscreen canvas and returns a high-resolution PNG data URL.
 */
export async function exportToPNG(
  elements: ExcalidrawElement[],
  options: ExportImageOptions = {},
): Promise<string | null> {
  const activeElements = elements.filter((el) => !el.isDeleted);
  if (activeElements.length === 0) return null;

  const bounds = getCombinedBounds(activeElements);
  if (!bounds) return null;

  const padding = options.padding ?? 40;
  const scale = options.scale ?? 2; // Default 2x for crisp Retina output
  const withBg = options.withBackground ?? true;
  const bgColor = options.backgroundColor ?? '#ffffff';

  const width = Math.max(10, bounds.width + padding * 2);
  const height = Math.max(10, bounds.height + padding * 2);

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width * scale;
  offscreenCanvas.height = height * scale;

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);

  if (withBg) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  // Translate coordinates so scene content fits into the padded export canvas
  ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

  const rc = rough.canvas(offscreenCanvas);

  for (const el of activeElements) {
    renderElement(rc, ctx, el);
  }

  return offscreenCanvas.toDataURL('image/png');
}

/**
 * Triggers a browser file download for a given Blob or DataURL.
 */
export function triggerFileDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
