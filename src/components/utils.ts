import { DrawElement } from './types';

export const distanceToLineSegment = (x: number, y: number, p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  const A = x - p1.x;
  const B = y - p1.y;
  const C = p2.x - p1.x;
  const D = p2.y - p1.y;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) { xx = p1.x; yy = p1.y; }
  else if (param > 1) { xx = p2.x; yy = p2.y; }
  else { xx = p1.x + param * C; yy = p1.y + param * D; }
  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

export const isPointNearLine = (x: number, y: number, el: DrawElement, zoom: number) => {
  if (!el.points || el.points.length < 2) return false;
  const threshold = 10 / zoom;
  for (let i = 0; i < el.points.length - 1; i++) {
    const dist = distanceToLineSegment(x, y, el.points[i], el.points[i + 1]);
    if (dist < threshold) return true;
  }
  return false;
};

export const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>, pan: { x: number; y: number }, zoom: number) => {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - pan.x) / zoom,
    y: (e.clientY - rect.top - pan.y) / zoom
  };
};

export const getCoordinatesFromMouseEvent = (e: React.MouseEvent, canvas: HTMLCanvasElement, pan: { x: number; y: number }, zoom: number) => {
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - pan.x) / zoom,
    y: (e.clientY - rect.top - pan.y) / zoom
  };
};

export const calculateBoundingBox = (element: DrawElement) => {
  let boundingBox = { x: element.x, y: element.y, width: element.width, height: element.height };
  
  if (element.type === 'circle') {
    // For circle (now ellipse), calculate actual bounding box
    const radiusX = Math.abs(element.width) / 2;
    const radiusY = Math.abs(element.height) / 2;
    const centerX = element.x + radiusX;
    const centerY = element.y + radiusY;
    boundingBox = {
      x: centerX - radiusX,
      y: centerY - radiusY,
      width: radiusX * 2,
      height: radiusY * 2
    };
  } else if ((element.type === 'line' || element.type === 'arrow' || element.type === 'pen' || element.type === 'bezier') && element.points && element.points.length > 0) {
    // For line, arrow, pen, or bezier, calculate bounding box from all points
    let minX = element.points[0].x;
    let minY = element.points[0].y;
    let maxX = element.points[0].x;
    let maxY = element.points[0].y;
    
    for (const point of element.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    // For arrow, add extra space for arrowhead
    if (element.type === 'arrow') {
      const headLength = 15;
      minX -= headLength;
      minY -= headLength;
      maxX += headLength;
      maxY += headLength;
    }
    
    boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (element.type === 'diamond') {
    // For diamond, use the same bounding box as the rectangle
    boundingBox = { x: element.x, y: element.y, width: element.width, height: element.height };
  }
  
  // Ensure width and height are positive
  if (boundingBox.width < 0) {
    boundingBox.x += boundingBox.width;
    boundingBox.width = Math.abs(boundingBox.width);
  }
  if (boundingBox.height < 0) {
    boundingBox.y += boundingBox.height;
    boundingBox.height = Math.abs(boundingBox.height);
  }
  
  return boundingBox;
};
