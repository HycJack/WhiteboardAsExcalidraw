export type ToolType = 'select' | 'rectangle' | 'circle' | 'line' | 'pen' | 'bezier' | 'text' | 'diamond' | 'hand' | 'image' | 'arrow' | 'iframe' | 'geogebra';

export interface DrawElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
  color: string;
  strokeWidth: number;
  borderStyle?: string;
  text?: string;
  points?: { x: number; y: number }[];
  image?: string;
  src?: string;
  config?: Record<string, any>;
  geogebraCommand?: string;
  appName?: string;
}

export interface WhiteboardProps {
  elements?: DrawElement[];
  onElementsChange?: (elements: DrawElement[]) => void;
  onAPIReady?: (api: WhiteboardAPI) => void;
  onElementDeleted?: (id: string, element: DrawElement) => void;
}

// Whiteboard API for AI function calls
export interface WhiteboardAPI {
  addElement: (element: Omit<DrawElement, 'id'>) => string;
  updateElement: (id: string, updates: Partial<DrawElement>) => boolean;
  removeElement: (id: string) => boolean;
  clearCanvas: () => void;
  getElements: () => DrawElement[];
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  undo: () => void;
  redo: () => void;
  clearSelection: () => void;
}
