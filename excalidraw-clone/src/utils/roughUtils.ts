import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';
import type { ExcalidrawElement, StrokeStyle } from '../types';

/**
 * Generates a non-zero positive integer seed.
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}

/**
 * Converts stroke style enum to SVG / roughjs strokeLineDash array.
 */
export function getStrokeLineDash(style: StrokeStyle, strokeWidth: number): number[] {
  switch (style) {
    case 'dashed':
      return [strokeWidth * 4, strokeWidth * 4];
    case 'dotted':
      return [strokeWidth, strokeWidth * 2];
    default:
      return [];
  }
}

/**
 * Maps element visual properties to Rough.js drawing options.
 */
export function getRoughOptions(element: ExcalidrawElement): Options {
  const isFilled = element.backgroundColor && element.backgroundColor !== 'transparent';
  const strokeLineDash = getStrokeLineDash(element.strokeStyle, element.strokeWidth);

  const options: Options = {
    seed: element.seed,
    stroke: element.strokeColor,
    strokeWidth: element.strokeWidth,
    roughness: element.roughness,
    bowing: element.roughness > 0 ? 1.5 : 0,
    strokeLineDash: strokeLineDash.length > 0 ? strokeLineDash : undefined,
  };

  if (isFilled) {
    options.fill = element.backgroundColor;
    options.fillStyle = element.fillStyle;
    options.fillWeight = Math.max(0.5, element.strokeWidth / 2);
    options.hachureGap = element.strokeWidth * 4;
  }

  return options;
}

/**
 * Calculates arrowhead polygon points at the destination of an arrow vector.
 */
function getArrowheadPoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  size = 20,
): { left: [number, number]; tip: [number, number]; right: [number, number] } {
  const angle = Math.atan2(endY - startY, endX - startX);
  const arrowAngle = Math.PI / 6; // 30 degrees

  const leftX = endX - size * Math.cos(angle - arrowAngle);
  const leftY = endY - size * Math.sin(angle - arrowAngle);

  const rightX = endX - size * Math.cos(angle + arrowAngle);
  const rightY = endY - size * Math.sin(angle + arrowAngle);

  return {
    tip: [endX, endY],
    left: [leftX, leftY],
    right: [rightX, rightY],
  };
}

/**
 * Renders an Excalidraw element using rough.js onto a 2D canvas context.
 */
export function renderElement(
  rc: ReturnType<typeof rough.canvas>,
  context: CanvasRenderingContext2D,
  element: ExcalidrawElement,
): void {
  if (element.isDeleted) return;

  context.save();
  context.globalAlpha = (element.opacity ?? 100) / 100;

  // Handle element rotation if present
  if (element.angle !== 0) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    context.translate(cx, cy);
    context.rotate(element.angle);
    context.translate(-cx, -cy);
  }

  const options = getRoughOptions(element);

  switch (element.type) {
    case 'rectangle': {
      rc.rectangle(element.x, element.y, element.width, element.height, options);
      break;
    }

    case 'diamond': {
      const top: [number, number] = [element.x + element.width / 2, element.y];
      const right: [number, number] = [element.x + element.width, element.y + element.height / 2];
      const bottom: [number, number] = [element.x + element.width / 2, element.y + element.height];
      const left: [number, number] = [element.x, element.y + element.height / 2];

      rc.polygon([top, right, bottom, left], options);
      break;
    }

    case 'ellipse': {
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      const w = Math.abs(element.width);
      const h = Math.abs(element.height);
      rc.ellipse(cx, cy, w, h, options);
      break;
    }

    case 'line': {
      if (element.points && element.points.length >= 2) {
        const absolutePoints = element.points.map(([px, py]) => [
          element.x + px,
          element.y + py,
        ] as [number, number]);
        rc.linearPath(absolutePoints, options);
      } else {
        rc.line(element.x, element.y, element.x + element.width, element.y + element.height, options);
      }
      break;
    }

    case 'arrow': {
      let startX = element.x;
      let startY = element.y;
      let endX = element.x + element.width;
      let endY = element.y + element.height;

      if (element.points && element.points.length >= 2) {
        const absolutePoints = element.points.map(([px, py]) => [
          element.x + px,
          element.y + py,
        ] as [number, number]);
        rc.linearPath(absolutePoints, options);

        const last = absolutePoints[absolutePoints.length - 1];
        const prev = absolutePoints[absolutePoints.length - 2];
        startX = prev[0];
        startY = prev[1];
        endX = last[0];
        endY = last[1];
      } else {
        rc.line(startX, startY, endX, endY, options);
      }

      // Draw hand-drawn arrowhead at tip
      const arrowhead = getArrowheadPoints(startX, startY, endX, endY, 15 + element.strokeWidth * 2);
      rc.linearPath([arrowhead.left, arrowhead.tip, arrowhead.right], {
        ...options,
        strokeWidth: element.strokeWidth + 0.5,
      });
      break;
    }

    case 'freedraw': {
      if (element.points && element.points.length > 1) {
        const absolutePoints = element.points.map(([px, py]) => [
          element.x + px,
          element.y + py,
        ] as [number, number]);
        rc.curve(absolutePoints, options);
      }
      break;
    }

    case 'text': {
      if (element.text) {
        const fontSize = element.fontSize || 24;
        const fontFamily = element.fontFamily || 'Caveat, cursive';
        context.font = `${fontSize}px ${fontFamily}`;
        context.fillStyle = element.strokeColor;
        context.textBaseline = 'top';

        const lines = element.text.split('\n');
        const lineHeight = fontSize * 1.25;

        lines.forEach((line, index) => {
          context.fillText(line, element.x, element.y + index * lineHeight);
        });
      }
      break;
    }

    default:
      break;
  }

  context.restore();
}
