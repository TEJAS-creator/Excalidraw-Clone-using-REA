import type { ExcalidrawElement, ResizeHandle, SelectionBounds } from '../types';
import { getElementBounds } from './coordinates';
import { HIT_TEST_THRESHOLD, RESIZE_HANDLE_SIZE } from '../constants';

/**
 * Calculates perpendicular distance from point (px, py) to line segment (x1, y1)-(x2, y2).
 */
function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  // Projection parameter t
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(px - projX, py - projY);
}

/**
 * Checks if a point hits a given element in world coordinates.
 */
export function isPointHittingElement(
  x: number,
  y: number,
  element: ExcalidrawElement,
  threshold = HIT_TEST_THRESHOLD,
): boolean {
  if (element.isDeleted) return false;

  const bounds = getElementBounds(element);
  const effectiveThreshold = threshold + element.strokeWidth / 2;

  // Quick bounding box check with threshold padding
  if (
    x < bounds.minX - effectiveThreshold ||
    x > bounds.maxX + effectiveThreshold ||
    y < bounds.minY - effectiveThreshold ||
    y > bounds.maxY + effectiveThreshold
  ) {
    return false;
  }

  const isFilled = element.backgroundColor && element.backgroundColor !== 'transparent';

  switch (element.type) {
    case 'rectangle': {
      if (isFilled) {
        return (
          x >= bounds.minX &&
          x <= bounds.maxX &&
          y >= bounds.minY &&
          y <= bounds.maxY
        );
      }
      // Check borders
      const d1 = distanceToSegment(x, y, bounds.minX, bounds.minY, bounds.maxX, bounds.minY);
      const d2 = distanceToSegment(x, y, bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY);
      const d3 = distanceToSegment(x, y, bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY);
      const d4 = distanceToSegment(x, y, bounds.minX, bounds.maxY, bounds.minX, bounds.minY);
      return Math.min(d1, d2, d3, d4) <= effectiveThreshold;
    }

    case 'diamond': {
      const top = { x: bounds.minX + bounds.width / 2, y: bounds.minY };
      const right = { x: bounds.maxX, y: bounds.minY + bounds.height / 2 };
      const bottom = { x: bounds.minX + bounds.width / 2, y: bounds.maxY };
      const left = { x: bounds.minX, y: bounds.minY + bounds.height / 2 };

      if (isFilled) {
        // Point in diamond formula: |dx| / (w/2) + |dy| / (h/2) <= 1
        const cx = bounds.minX + bounds.width / 2;
        const cy = bounds.minY + bounds.height / 2;
        const rx = bounds.width / 2;
        const ry = bounds.height / 2;
        if (rx <= 0 || ry <= 0) return false;
        return Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1.05;
      }

      const d1 = distanceToSegment(x, y, top.x, top.y, right.x, right.y);
      const d2 = distanceToSegment(x, y, right.x, right.y, bottom.x, bottom.y);
      const d3 = distanceToSegment(x, y, bottom.x, bottom.y, left.x, left.y);
      const d4 = distanceToSegment(x, y, left.x, left.y, top.x, top.y);
      return Math.min(d1, d2, d3, d4) <= effectiveThreshold;
    }

    case 'ellipse': {
      const cx = bounds.minX + bounds.width / 2;
      const cy = bounds.minY + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      if (rx <= 0 || ry <= 0) return false;

      const normDist = ((x - cx) * (x - cx)) / (rx * rx) + ((y - cy) * (y - cy)) / (ry * ry);

      if (isFilled) {
        return normDist <= 1.1;
      }
      // Perimeter distance approximation
      const r = Math.sqrt(normDist);
      const avgRadius = (rx + ry) / 2;
      const deltaPx = Math.abs(r - 1) * avgRadius;
      return deltaPx <= effectiveThreshold;
    }

    case 'line':
    case 'arrow': {
      if (element.points && element.points.length >= 2) {
        for (let i = 0; i < element.points.length - 1; i++) {
          const [p1x, p1y] = element.points[i];
          const [p2x, p2y] = element.points[i + 1];
          const dist = distanceToSegment(
            x,
            y,
            element.x + p1x,
            element.y + p1y,
            element.x + p2x,
            element.y + p2y,
          );
          if (dist <= effectiveThreshold) return true;
        }
        return false;
      }
      return (
        distanceToSegment(
          x,
          y,
          element.x,
          element.y,
          element.x + element.width,
          element.y + element.height,
        ) <= effectiveThreshold
      );
    }

    case 'freedraw': {
      if (!element.points || element.points.length < 2) return false;
      for (let i = 0; i < element.points.length - 1; i++) {
        const [p1x, p1y] = element.points[i];
        const [p2x, p2y] = element.points[i + 1];
        const dist = distanceToSegment(
          x,
          y,
          element.x + p1x,
          element.y + p1y,
          element.x + p2x,
          element.y + p2y,
        );
        if (dist <= effectiveThreshold) return true;
      }
      return false;
    }

    case 'text': {
      return (
        x >= bounds.minX &&
        x <= bounds.maxX &&
        y >= bounds.minY &&
        y <= bounds.maxY
      );
    }

    default:
      return false;
  }
}

export interface HandlePosition {
  handle: ResizeHandle;
  x: number;
  y: number;
}

/**
 * Returns world coordinates for all 8 resize handles around a selection bounding box.
 */
export function getSelectionHandles(bounds: SelectionBounds): HandlePosition[] {
  const { minX, minY, maxX, maxY, width, height } = bounds;
  const midX = minX + width / 2;
  const midY = minY + height / 2;

  return [
    { handle: 'nw', x: minX, y: minY },
    { handle: 'n', x: midX, y: minY },
    { handle: 'ne', x: maxX, y: minY },
    { handle: 'e', x: maxX, y: midY },
    { handle: 'se', x: maxX, y: maxY },
    { handle: 's', x: midX, y: maxY },
    { handle: 'sw', x: minX, y: maxY },
    { handle: 'w', x: minX, y: midY },
  ];
}

/**
 * Tests if world point (x, y) is on a resize handle, adjusting hit radius for zoom.
 */
export function getResizeHandleAtPoint(
  x: number,
  y: number,
  bounds: SelectionBounds,
  zoom: number,
): ResizeHandle | null {
  const handles = getSelectionHandles(bounds);
  const handleRadiusInWorld = (RESIZE_HANDLE_SIZE / 2 + 3) / zoom;

  for (const h of handles) {
    if (Math.hypot(x - h.x, y - h.y) <= handleRadiusInWorld) {
      return h.handle;
    }
  }

  return null;
}

/**
 * Returns the CSS cursor for a given resize handle.
 */
export function getCursorForResizeHandle(handle: ResizeHandle | null): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'rotation':
      return 'grab';
    default:
      return 'default';
  }
}
