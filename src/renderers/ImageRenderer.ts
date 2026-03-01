import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class ImageRenderer implements ElementRenderer {
  private imageCache: Map<string, HTMLImageElement> = new Map();

  render(rc: RoughCanvas, element: Element, options: RenderOptions, ctx?: CanvasRenderingContext2D): void {
    if (!ctx || !element.imageSrc) return;

    const minX = Math.min(element.x1, element.x2);
    const minY = Math.min(element.y1, element.y2);
    const width = Math.abs(element.x2 - element.x1);
    const height = Math.abs(element.y2 - element.y1);

    // 检查缓存
    let img = this.imageCache.get(element.imageSrc);
    if (!img) {
      img = new Image();
      img.src = element.imageSrc;
      this.imageCache.set(element.imageSrc, img);
    }

    // 如果图片已加载，绘制它
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, minX, minY, width, height);
    } else {
      // 图片未加载完成，绘制占位符
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(minX, minY, width, height);
      ctx.fillStyle = '#6965db';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('图片', minX + width / 2, minY + height / 2);

      // 图片加载完成后重新渲染
      img.onload = () => {
        // 触发重新渲染
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const event = new Event('imageLoaded');
          canvas.dispatchEvent(event);
        }
      };
    }
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
