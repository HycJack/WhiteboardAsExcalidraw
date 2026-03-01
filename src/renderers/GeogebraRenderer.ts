import { ElementRenderer, RenderOptions, RoughCanvas } from './types';
import { Element } from '../types';

// GeoGebra 图标 base64
const GEOGEBRA_ICON = 'data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAcWDQ1YIxUVhAoGBjdFTEwCbWxsAmVlZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAcHAAYDg5NhlBQ679ycv9fOzvUTU5OmWZmZpJlZWV6YmNjOhANDUAgExN3EQoKQgAAAAMAAAAAAAAAAAAAAABSMTEALRwcf818fP//np7/lltb+kZFRcZmZma9ZmZm3VJSUuVnQUHtvnFx/3ZGRuIOCAg+IxUVAAAAAABlZWUAcHNzEUZDQ7VySEj+qWRk+lQyMrkMEhIhcHBwDGptbR82MDCHq2ho+v+fn/+8cXH7IxUVY0QoKAAAAAAAZWVlAGVlZWNjZGTkNzU1dBMKCloGBAQhLRoaAAAAAAATDAwAAAAAI2I7O8itZ2f9Z0ND+jQzM2QvJiYAZWVlAGdnZwdmZmakZmZmpGdnZwZmZmYAAAAAAAAAAAAAAAAAAAAAAAAAAAEHAwMqHRMTZUxMTMVkZGS7ZmZmEmVlZQBVV1cWVlhYx1JUVHiFh4cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsrm5AFlYWABoaGhFZmZm5WZmZldkZGQAJBgYa2E/P+5VNjbNDwgINycXFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABfYGAAYGFhD1xdXb9XWFiUAAAAAWc9PejtjY3/14CA/0AmJp4AAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIxkZABAMDDJNNjbUVjo63x0TE1dgOTni5IiI/816ev88JSWfAAAABQICAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU6IyOaznp6/+WIiP9gOTniGxAQVFMxMbhPOTnkTUxMtmtsbBdkZGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGQScnntiBgf/ujo7/Zz096AAAAAEAAAAMT1BQP2VlZdNlZWWpZmZmJwoICCMXDg5bCQYGMgAAAAJQUFAAbW9vDkhGRqNaPz/3ZDw8zyIVFWUAAAAAZWVlAGVlZQBlZWU8ZmZmw1ZXV9RYODjRq2Zm+nNFRdgiHR1LaGhoQWVlZadlZWXoUFJSbgAAABQAAAACAAAAAAAAAABlZWUAZWVlAG1ubhw6OTmXml5e+/+fn//DdXX/RT0962ZmZuBlZWXJZWVlWGxsbAVoaGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAOCQkAAAAAIWM7O8u/cnL/gU1N6DgzM31oaWk9ZWVlFWVlZQFlZWUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEKBgY5IhQUhhUNDVIAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwP8AAMADAADAAwAAgAMAAIODAAAPgQAAH/EAAA/wAAAH8AAAB+AAAAfgAAAAIAAA4AAAAPADAAD4BwAA+D8AAA==';

export class GeogebraRenderer implements ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions, ctx?: CanvasRenderingContext2D): void {
    if (!ctx) return;

    const minX = Math.min(element.x1, element.x2);
    const minY = Math.min(element.y1, element.y2);
    const width = Math.abs(element.x2 - element.x1);
    const height = Math.abs(element.y2 - element.y1);

    // 绘制边框
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 2;
    ctx.strokeRect(minX, minY, width, height);

    // 绘制背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(minX, minY, width, height);

    // 绘制标题栏
    ctx.fillStyle = '#6c5ce7';
    ctx.fillRect(minX, minY, width, 30);

    // 绘制 GeoGebra 图标
    const iconSize = 20;
    const iconX = minX + 8;
    const iconY = minY + 5;
    
    // 创建图标图片
    const img = new Image();
    img.src = GEOGEBRA_ICON;
    
    // 如果图片已加载，绘制它
    if (img.complete) {
      ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
    } else {
      // 图片未加载时，绘制一个占位符
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(iconX, iconY, iconSize, iconSize);
    }

    // 绘制标题文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const resourceId = element.text || 'GeoGebra';
    const displayId = resourceId.length > 20 ? resourceId.substring(0, 20) + '...' : resourceId;
    ctx.fillText(displayId, minX + 32, minY + 15);

    // 绘制内容区域提示
    ctx.fillStyle = '#6c5ce7';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GeoGebra', minX + width / 2, minY + height / 2 - 20);
    ctx.fillStyle = '#adb5bd';
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
