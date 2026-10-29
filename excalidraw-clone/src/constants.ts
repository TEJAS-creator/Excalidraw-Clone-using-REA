import type { AppState, FillStyle, StrokeStyle } from './types';

export const STROKE_COLORS = [
  '#1e1e1e', // Charcoal Black
  '#e03131', // Vibrant Red
  '#2f9e44', // Forest Green
  '#1971c2', // Ocean Blue
  '#f08c00', // Amber Orange
  '#9c36b5', // Royal Violet
  '#099268', // Teal
  '#e8590c', // Tangerine
  '#868e96', // Slate Grey
  '#ffffff', // Pure White
];

export const BACKGROUND_COLORS = [
  'transparent',
  '#ffc9c9', // Soft Pastel Red
  '#b2f2bb', // Soft Pastel Green
  '#a5d8ff', // Soft Pastel Blue
  '#ffec99', // Soft Pastel Yellow
  '#eebefa', // Soft Pastel Purple
  '#c3fae8', // Soft Pastel Teal
  '#ffd8a8', // Soft Pastel Orange
  '#e9ecef', // Soft Grey
  '#ffffff', // Pure White
];

export const CANVAS_BACKGROUNDS = [
  { label: 'Clean White', value: '#ffffff' },
  { label: 'Warm Cream', value: '#fdfbf7' },
  { label: 'Architect Blueprint', value: '#0f172a' },
  { label: 'Slate Dark', value: '#18181b' },
];

export const FILL_STYLES: { id: FillStyle; label: string; icon: string }[] = [
  { id: 'hachure', label: 'Hachure', icon: '///' },
  { id: 'cross-hatch', label: 'Cross-hatch', icon: '###' },
  { id: 'solid', label: 'Solid', icon: '■' },
  { id: 'dots', label: 'Dots', icon: '•••' },
  { id: 'zigzag', label: 'Zigzag', icon: '〰' },
];

export const STROKE_WIDTHS = [
  { value: 1, label: 'Thin' },
  { value: 2, label: 'Regular' },
  { value: 4, label: 'Bold' },
  { value: 6, label: 'Extra' },
];

export const STROKE_STYLES: { id: StrokeStyle; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
];

export const ROUGHNESS_LEVELS = [
  { value: 0, label: 'Architect' },
  { value: 1, label: 'Artist' },
  { value: 2, label: 'Cartoonist' },
];

export const FONT_SIZES = [
  { value: 16, label: 'Small' },
  { value: 24, label: 'Medium' },
  { value: 36, label: 'Large' },
  { value: 48, label: 'Huge' },
];

export const FONT_FAMILIES = [
  { value: 'Caveat, cursive', label: 'Caveat' },
  { value: 'Kalam, cursive', label: 'Kalam' },
  { value: 'Inter, sans-serif', label: 'Inter' },
];

export const DEFAULT_APP_STATE: AppState = {
  viewBackgroundColor: '#ffffff',
  zoom: 1,
  scrollX: 0,
  scrollY: 0,
  activeTool: 'selection',
  selectedElementIds: {},
  draggingElementId: null,
  resizingHandle: null,
  isPanning: false,
  isSpacePressed: false,
  gridEnabled: true,
  gridSize: 20,
  currentItemStrokeColor: '#1e1e1e',
  currentItemBackgroundColor: 'transparent',
  currentItemFillStyle: 'hachure',
  currentItemStrokeWidth: 2,
  currentItemStrokeStyle: 'solid',
  currentItemRoughness: 1,
  currentItemOpacity: 100,
  currentItemFontSize: 24,
  currentItemFontFamily: 'Caveat, cursive',
  editingTextElementId: null,
};

export const RESIZE_HANDLE_SIZE = 8;
export const HIT_TEST_THRESHOLD = 8;
