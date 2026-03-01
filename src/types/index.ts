export type ToolType =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'image'
  | 'eraser'
  | 'star'
  | 'triangle'
  | 'heart'
  | 'webpage'
  | 'geogebra';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type FillStyle = 'none' | 'hachure' | 'solid' | 'zigzag' | 'cross-hatch';

export interface Point {
  x: number;
  y: number;
}

export interface Element {
  id: string;
  type: ToolType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  fill: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  fillStyle: FillStyle;
  roughness: number;
  opacity: number;
  points: Point[];
  text: string;
  seed: number;
  rotation: number;
  cornerStyle?: 'rounded' | 'sharp';
  link?: string;
  imageSrc?: string;
}

export interface AppState {
  tool: ToolType;
  elements: Element[];
  selectedElements: string[];
  currentColor: string;
  currentFill: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  fillStyle: FillStyle;
  roughness: number;
  opacity: number;
  zoom: number;
  panX: number;
  panY: number;
  isDrawing: boolean;
  isPanning: boolean;
  isSpacePressed: boolean;
  toolLocked: boolean;
  history: Element[][];
  historyIndex: number;
  shouldFocusContent: boolean;
}

export interface CustomShapeConfig {
  name: string;
  icon: string;
  renderer: (rc: any, element: Element, options: any) => void;
  hitTest: (element: Element, x: number, y: number) => boolean;
}
