import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class RectangleRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions): void {
    const width = element.x2 - element.x1;
    const height = element.y2 - element.y1;

    if (element.fill && element.fill !== 'transparent') {
      rc.rectangle(element.x1, element.y1, width, height, {
        ...options,
        fill: element.fill,
        fillStyle: element.fillStyle || 'hachure',
      });
    }
    rc.rectangle(element.x1, element.y1, width, height, options);
  }

  hitTest(element: Element, x: number, y: number): boolean {
    const minX = Math.min(element.x1, element.x2);
    const maxX = Math.max(element.x1, element.x2);
    const minY = Math.min(element.y1, element.y2);
    const maxY = Math.max(element.y1, element.y2);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
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
