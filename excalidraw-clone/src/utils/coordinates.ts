import type { ExcalidrawElement, Point, SelectionBounds } from '../types';

/**
 * Transforms screen pointer coordinates (e.g. clientX, clientY relative to canvas)
 * into virtual infinite world coordinates.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  scrollX: number,
  scrollY: number,
  zoom: number,
): Point {
  return {
    x: screenX / zoom - scrollX,
    y: screenY / zoom - scrollY,
  };
}

/**
 * Transforms world coordinates into screen coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  scrollX: number,
  scrollY: number,
  zoom: number,
): Point {
  return {
    x: (worldX + scrollX) * zoom,
    y: (worldY + scrollY) * zoom,
  };
}

/**
 * Computes new zoom and adjusted scrollX, scrollY so that the scene point under the cursor
 * remains stationary on screen after zoom.
 */
export function computeZoomAroundPoint(
  cursorScreenX: number,
  cursorScreenY: number,
  currentZoom: number,
  zoomDelta: number,
  scrollX: number,
  scrollY: number,
  minZoom = 0.1,
  maxZoom = 10,
): { newZoom: number; newScrollX: number; newScrollY: number } {
  const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomDelta));
  if (newZoom === currentZoom) {
    return { newZoom: currentZoom, newScrollX: scrollX, newScrollY: scrollY };
  }

  // World point before zoom
  const worldPointX = cursorScreenX / currentZoom - scrollX;
  const worldPointY = cursorScreenY / currentZoom - scrollY;

  // New scroll so worldPoint lands exactly at cursorScreen
  const newScrollX = cursorScreenX / newZoom - worldPointX;
  const newScrollY = cursorScreenY / newZoom - worldPointY;

  return { newZoom, newScrollX, newScrollY };
}

/**
 * Computes the normalized bounding box for an individual element.
 */
export function getElementBounds(element: ExcalidrawElement): SelectionBounds {
  if (element.type === 'freedraw' || element.type === 'line' || element.type === 'arrow') {
    if (!element.points || element.points.length === 0) {
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + element.width,
        maxY: element.y + element.height,
        width: Math.abs(element.width) || 1,
        height: Math.abs(element.height) || 1,
      };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [px, py] of element.points) {
      const absX = element.x + px;
      const absY = element.y + py;
      minX = Math.min(minX, absX);
      minY = Math.min(minY, absY);
      maxX = Math.max(maxX, absX);
      maxY = Math.max(maxY, absY);
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  const minX = Math.min(element.x, element.x + element.width);
  const maxX = Math.max(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const maxY = Math.max(element.y, element.y + element.height);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Computes the unified bounding box encompassing multiple elements.
 */
export function getCombinedBounds(elements: ExcalidrawElement[]): SelectionBounds | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const b = getElementBounds(el);
    minX = Math.min(minX, b.minX);
    minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX);
    maxY = Math.max(maxY, b.maxY);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Checks if two bounding boxes intersect.
 */
export function doBoxesIntersect(b1: SelectionBounds, b2: SelectionBounds): boolean {
  return !(
    b1.maxX < b2.minX ||
    b1.minX > b2.maxX ||
    b1.maxY < b2.minY ||
    b1.minY > b2.maxY
  );
}
