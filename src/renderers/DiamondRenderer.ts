import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class DiamondRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions): void {
    const mx = (element.x1 + element.x2) / 2;
    const my = (element.y1 + element.y2) / 2;
    const diamondPoints: [number, number][] = [
      [mx, element.y1],
      [element.x2, my],
      [mx, element.y2],
      [element.x1, my]
    ];

    if (element.fill && element.fill !== 'transparent') {
      rc.polygon(diamondPoints, {
        ...options,
        fill: element.fill,
        fillStyle: element.fillStyle || 'hachure'
      });
    }
    rc.polygon(diamondPoints, options);
  }

  hitTest(element: Element, x: number, y: number): boolean {
    const mx = (element.x1 + element.x2) / 2;
    const my = (element.y1 + element.y2) / 2;

    const sign = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) => {
      return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
    };

    const d1 = sign(x, y, mx, element.y1, element.x2, my);
    const d2 = sign(x, y, element.x2, my, mx, element.y2);
    const d3 = sign(x, y, mx, element.y2, element.x1, my);
    const d4 = sign(x, y, element.x1, my, mx, element.y1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);

    return !(hasNeg && hasPos);
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
