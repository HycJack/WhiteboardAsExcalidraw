import { ElementRenderer, ElementRendererFactory } from './types';
import { RectangleRenderer } from './RectangleRenderer';
import { EllipseRenderer } from './EllipseRenderer';
import { DiamondRenderer } from './DiamondRenderer';
import { LineRenderer } from './LineRenderer';
import { ArrowRenderer } from './ArrowRenderer';
import { FreedrawRenderer } from './FreedrawRenderer';
import { TextRenderer } from './TextRenderer';
import { ImageRenderer } from './ImageRenderer';
import { WebpageRenderer } from './WebpageRenderer';
import { GeogebraRenderer } from './GeogebraRenderer';

class RendererFactoryClass implements ElementRendererFactory {
  private renderers: Map<string, ElementRenderer> = new Map();

  constructor() {
    this.register('rectangle', new RectangleRenderer());
    this.register('ellipse', new EllipseRenderer());
    this.register('diamond', new DiamondRenderer());
    this.register('line', new LineRenderer());
    this.register('arrow', new ArrowRenderer());
    this.register('freedraw', new FreedrawRenderer());
    this.register('text', new TextRenderer());
    this.register('image', new ImageRenderer());
    this.register('webpage', new WebpageRenderer());
    this.register('geogebra', new GeogebraRenderer());
  }

  createRenderer(type: string): ElementRenderer | null {
    return this.renderers.get(type) || null;
  }

  register(type: string, renderer: ElementRenderer): void {
    this.renderers.set(type, renderer);
  }

  has(type: string): boolean {
    return this.renderers.has(type);
  }

  getAllTypes(): string[] {
    return Array.from(this.renderers.keys());
  }
}

export const RendererFactory = new RendererFactoryClass();
