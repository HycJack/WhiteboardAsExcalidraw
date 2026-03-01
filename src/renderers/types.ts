import { Element } from '../types';

export interface RenderOptions {
  stroke: string;
  strokeWidth: number;
  roughness: number;
  bowing: number;
  seed: number;
  strokeLineDash?: number[];
  fill?: string;
  fillStyle?: string;
}

export interface RoughCanvas {
  rectangle(x: number, y: number, width: number, height: number, options: any): void;
  ellipse(x: number, y: number, width: number, height: number, options: any): void;
  polygon(points: [number, number][], options: any): void;
  line(x1: number, y1: number, x2: number, y2: number, options: any): void;
  curve(points: [number, number][], options: any): void;
}

export interface ElementRenderer {
  render(rc: RoughCanvas, element: Element, options: RenderOptions, ctx?: CanvasRenderingContext2D): void;
  hitTest(element: Element, x: number, y: number): boolean;
  getBounds(element: Element): { x1: number; y1: number; x2: number; y2: number };
}

export interface ElementRendererFactory {
  createRenderer(type: string): ElementRenderer | null;
  register(type: string, renderer: ElementRenderer): void;
}
