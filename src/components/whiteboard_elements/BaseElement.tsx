import React from 'react';
import { DrawElement } from '../types';

export interface ElementComponentProps {
  element: DrawElement;
  isSelected?: boolean;
  onSelect?: (element: DrawElement) => void;
  onUpdate?: (id: string, updates: Partial<DrawElement>) => void;
  onEdit?: (id: string) => void;
  zoom?: number;
}

export interface CanvasRendererProps {
  ctx: CanvasRenderingContext2D;
  element: DrawElement;
  zoom?: number;
}

export type ElementRenderer = React.FC<ElementComponentProps>;
export type CanvasElementRenderer = (props: CanvasRendererProps) => void;

export interface ElementDefinition {
  type: string;
  name: string;
  icon?: React.ReactNode;
  isCanvasBased: boolean;
  Component?: ElementRenderer;
  renderToCanvas?: CanvasElementRenderer;
  defaultConfig?: Record<string, any>;
}
