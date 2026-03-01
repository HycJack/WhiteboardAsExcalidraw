import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class FreedrawRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions): void {
    if (!element.points || element.points.length <= 1) return;

    for (let i = 1; i < element.points.length; i++) {
      rc.line(
        element.points[i - 1].x,
        element.points[i - 1].y,
        element.points[i].x,
        element.points[i].y,
        options
      );
    }
  }

  hitTest(element: Element, x: number, y: number): boolean {
    if (!element.points || element.points.length < 2) return false;

    const threshold = Math.max(element.strokeWidth || 4, 8);

    for (let i = 1; i < element.points.length; i++) {
      const p1 = element.points[i - 1];
      const p2 = element.points[i];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        const dist = Math.sqrt((x - p1.x) ** 2 + (y - p1.y) ** 2);
        if (dist <= threshold) return true;
        continue;
      }

      const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (y - p1.y) * dy) / (length * length)));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;

      const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
      if (dist <= threshold) return true;
    }

    return false;
  }

  getBounds(element: Element): { x1: number; y1: number; x2: number; y2: number } {
    if (!element.points || element.points.length === 0) {
      return { x1: element.x1, y1: element.y1, x2: element.x2, y2: element.y2 };
    }

    let minX = element.points[0].x;
    let maxX = element.points[0].x;
    let minY = element.points[0].y;
    let maxY = element.points[0].y;

    for (const point of element.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  }
}
