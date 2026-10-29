import type { RefObject, Dispatch, SetStateAction } from 'react';
import type { AppState, ExcalidrawElement, ResizeHandle, ToolType } from './types';
import { generateSeed } from './utils/roughUtils';

export type InteractionMode =
  | 'idle'
  | 'panning'
  | 'drawing'
  | 'dragging'
  | 'resizing'
  | 'marquee';

export interface InteractionState {
  mode: InteractionMode;
  startX: number;
  startY: number;
  startWorldX: number;
  startWorldY: number;
  activeResizeHandle: ResizeHandle | null;
  currentDrawingElementId: string | null;
  dragInitialPositions: Record<string, { x: number; y: number; points?: [number, number][] }>;
  marqueeBox: { minX: number; minY: number; maxX: number; maxY: number } | null;
  cursor: string;
}

export const INITIAL_INTERACTION_STATE: InteractionState = {
  mode: 'idle',
  startX: 0,
  startY: 0,
  startWorldX: 0,
  startWorldY: 0,
  activeResizeHandle: null,
  currentDrawingElementId: null,
  dragInitialPositions: {},
  marqueeBox: null,
  cursor: 'default',
};

export interface InteractionHandlerProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  elements: ExcalidrawElement[];
  setElements: Dispatch<SetStateAction<ExcalidrawElement[]>>;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
  pushToHistory: (newElements: ExcalidrawElement[]) => void;
  openTextEditor: (elementId: string, worldX: number, worldY: number) => void;
}

export function createNewElement(
  tool: ToolType,
  x: number,
  y: number,
  appState: AppState,
): ExcalidrawElement {
  const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const seed = generateSeed();

  const base: ExcalidrawElement = {
    id,
    type: tool,
    x,
    y,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: appState.currentItemStrokeColor,
    backgroundColor: appState.currentItemBackgroundColor,
    fillStyle: appState.currentItemFillStyle,
    strokeWidth: appState.currentItemStrokeWidth,
    strokeStyle: appState.currentItemStrokeStyle,
    roughness: appState.currentItemRoughness,
    opacity: appState.currentItemOpacity,
    seed,
    isDeleted: false,
    groupIds: [],
  };

  if (tool === 'freedraw') {
    base.points = [[0, 0]];
  } else if (tool === 'line' || tool === 'arrow') {
    base.points = [
      [0, 0],
      [0, 0],
    ];
  } else if (tool === 'text') {
    base.text = '';
    base.fontSize = appState.currentItemFontSize;
    base.fontFamily = appState.currentItemFontFamily;
  }

  return base;
}
