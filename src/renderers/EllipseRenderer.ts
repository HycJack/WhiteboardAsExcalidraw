import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class EllipseRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions): void {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const rx = Math.abs(element.x2 - element.x1) / 2;
    const ry = Math.abs(element.y2 - element.y1) / 2;

    if (rx <= 0 || ry <= 0) return;

    if (element.fill && element.fill !== 'transparent') {
      rc.ellipse(cx, cy, rx * 2, ry * 2, {
        ...options,
        fill: element.fill,
        fillStyle: element.fillStyle || 'hachure',
      });
    }
    rc.ellipse(cx, cy, rx * 2, ry * 2, options);
  }

  hitTest(element: Element, x: number, y: number): boolean {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const rx = Math.abs(element.x2 - element.x1) / 2;
    const ry = Math.abs(element.y2 - element.y1) / 2;

    if (rx === 0 || ry === 0) return false;

    const dx = x - cx;
    const dy = y - cy;

    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }

  getBounds(element: Element): { x1: number; y1: number; x2: number; y2: number } {
    return {
      x1: Math.min(element.x1, element.x2),
      y1: Math.min(element.y1, element.y2),
      x2: Math.max(element.x1, element.x2),
      y2: Math.max(element.y1, element.y2),
    };
  }
}
