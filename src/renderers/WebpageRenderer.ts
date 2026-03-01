import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

export class WebpageRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions, ctx?: CanvasRenderingContext2D): void {
    if (!ctx) return;

    const minX = Math.min(element.x1, element.x2);
    const minY = Math.min(element.y1, element.y2);
    const width = Math.abs(element.x2 - element.x1);
    const height = Math.abs(element.y2 - element.y1);

    // 绘制边框
    ctx.strokeStyle = '#6965db';
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, width, height);

    // 绘制背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(minX, minY, width, height);

    // 绘制标题栏
    ctx.fillStyle = '#6965db';
    ctx.fillRect(minX, minY, width, 30);

    // 绘制标题文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const url = element.text || '网页';
    const displayUrl = url.length > 30 ? url.substring(0, 30) + '...' : url;
    ctx.fillText(displayUrl, minX + 10, minY + 15);

    // 绘制内容区域提示
    ctx.fillStyle = '#adb5bd';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌐 网页嵌入', minX + width / 2, minY + height / 2 - 20);
    ctx.font = '12px sans-serif';
    ctx.fillText('双击在新窗口打开', minX + width / 2, minY + height / 2 + 10);

    // 绘制尺寸信息
    ctx.fillStyle = '#6c757d';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${Math.round(width)} × ${Math.round(height)}`, minX + width / 2, minY + height - 15);
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
