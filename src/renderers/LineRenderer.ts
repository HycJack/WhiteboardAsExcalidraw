import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class LineRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions): void {
    rc.line(element.x1, element.y1, element.x2, element.y2, options);
  }

  hitTest(element: Element, x: number, y: number): boolean {
    const threshold = Math.max(element.strokeWidth || 4, 8);

    const dx = element.x2 - element.x1;
    const dy = element.y2 - element.y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const dist = Math.sqrt((x - element.x1) ** 2 + (y - element.y1) ** 2);
      return dist <= threshold;
    }

    const t = Math.max(0, Math.min(1, ((x - element.x1) * dx + (y - element.y1) * dy) / (length * length)));
    const projX = element.x1 + t * dx;
    const projY = element.y1 + t * dy;

    const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    return dist <= threshold;
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
