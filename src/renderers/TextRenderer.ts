import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class TextRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions, ctx?: CanvasRenderingContext2D): void {
    if (!ctx || !element.text) return;

    ctx.save();
    ctx.font = `${element.strokeWidth * 4 + 16}px 'Patrick Hand', cursive`;
    ctx.fillStyle = element.color;
    ctx.textBaseline = 'top';

    const lines = element.text.split('\n');
    const lineHeight = element.strokeWidth * 4 + 20;

    lines.forEach((line, index) => {
      ctx.fillText(line, element.x1, element.y1 + index * lineHeight);
    });

    ctx.restore();
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
