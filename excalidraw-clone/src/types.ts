export type ToolType =
  | 'selection'
  | 'rectangle'
  | 'diamond'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'eraser'
  | 'pan';

export type FillStyle = 'solid' | 'hachure' | 'cross-hatch' | 'zigzag' | 'dots';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotation';

export interface Point {
  x: number;
  y: number;
}

export interface ExcalidrawElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // in radians
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  roughness: number; // 0: clean, 1: artist, 2: cartoon
  opacity: number; // 0 to 100
  seed: number; // Invariant seed for rough.js rendering consistency
  points?: [number, number][]; // Relative points for freedraw, line, and arrow
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isDeleted?: boolean;
  groupIds?: string[];
}

export interface AppState {
  viewBackgroundColor: string;
  zoom: number; // 1 = 100%
  scrollX: number;
  scrollY: number;
  activeTool: ToolType;
  selectedElementIds: Record<string, boolean>;
  draggingElementId: string | null;
  resizingHandle: ResizeHandle | null;
  isPanning: boolean;
  isSpacePressed: boolean;
  gridEnabled: boolean;
  gridSize: number;
  // Current tool defaults for newly created elements
  currentItemStrokeColor: string;
  currentItemBackgroundColor: string;
  currentItemFillStyle: FillStyle;
  currentItemStrokeWidth: number;
  currentItemStrokeStyle: StrokeStyle;
  currentItemRoughness: number;
  currentItemOpacity: number;
  currentItemFontSize: number;
  currentItemFontFamily: string;
  // Editing state for inline text
  editingTextElementId: string | null;
}

export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface ExcalidrawSceneData {
  type: 'excalidraw';
  version: 2;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    viewBackgroundColor: string;
    gridSize: number | null;
  };
}
