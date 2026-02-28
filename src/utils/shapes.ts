import { CustomShapeConfig, Element } from '../types';

class ShapeRegistryClass {
  shapes: Map<string, CustomShapeConfig> = new Map();

  register(type: string, config: CustomShapeConfig): this {
    this.shapes.set(type, config);
    return this;
  }

  get(type: string): CustomShapeConfig | undefined {
    return this.shapes.get(type);
  }

  getAll(): [string, CustomShapeConfig][] {
    return Array.from(this.shapes.entries());
  }

  has(type: string): boolean {
    return this.shapes.has(type);
  }
}

export const ShapeRegistry = new ShapeRegistryClass();

// Register built-in custom shapes
ShapeRegistry.register('star', {
  name: '星形',
  icon: '★',
  renderer: (rc: any, element: Element, options: any) => {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const rx = Math.abs(element.x2 - element.x1) / 2;
    const ry = Math.abs(element.y2 - element.y1) / 2;
    const points: [number, number][] = [];
    const spikes = 5;

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI / spikes) - Math.PI / 2;
      const r = i % 2 === 0 ? 1 : 0.5;
      points.push([
        cx + rx * r * Math.cos(angle),
        cy + ry * r * Math.sin(angle)
      ]);
    }

    if (element.fill && element.fill !== 'transparent') {
      rc.polygon(points, { ...options, fill: element.fill, fillStyle: element.fillStyle || 'hachure' });
    }
    rc.polygon(points, options);
  },
  hitTest: (element: Element, x: number, y: number) => {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const rx = Math.abs(element.x2 - element.x1) / 2;
    const ry = Math.abs(element.y2 - element.y1) / 2;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
});

ShapeRegistry.register('triangle', {
  name: '三角形',
  icon: '△',
  renderer: (rc: any, element: Element, options: any) => {
    const points: [number, number][] = [
      [(element.x1 + element.x2) / 2, element.y1],
      [element.x2, element.y2],
      [element.x1, element.y2]
    ];

    if (element.fill && element.fill !== 'transparent') {
      rc.polygon(points, { ...options, fill: element.fill, fillStyle: element.fillStyle || 'hachure' });
    }
    rc.polygon(points, options);
  },
  hitTest: (element: Element, x: number, y: number) => {
    const x1 = (element.x1 + element.x2) / 2;
    const y1 = element.y1;
    const x2 = element.x2;
    const y2 = element.y2;
    const x3 = element.x1;
    const y3 = element.y2;

    const sign = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) => {
      return (p1x - p3x) * (p2y - p3y) - (p2x - p3x) * (p1y - p3y);
    };

    const d1 = sign(x, y, x1, y1, x2, y2);
    const d2 = sign(x, y, x2, y2, x3, y3);
    const d3 = sign(x, y, x3, y3, x1, y1);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
  }
});

ShapeRegistry.register('heart', {
  name: '心形',
  icon: '♥',
  renderer: (rc: any, element: Element, options: any) => {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const w = Math.abs(element.x2 - element.x1);
    const h = Math.abs(element.y2 - element.y1);

    const path: string[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

      const px = cx + (x / 16) * w * 0.5;
      const py = cy + (y / 16) * h * 0.5;

      if (i === 0) {
        path.push(['M', px, py].join(' '));
      } else {
        path.push(['L', px, py].join(' '));
      }
    }
    path.push('Z');

    rc.path(path.join(' '), options);
  },
  hitTest: (element: Element, x: number, y: number) => {
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;
    const rx = Math.abs(element.x2 - element.x1) / 2;
    const ry = Math.abs(element.y2 - element.y1) / 2;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }
});
