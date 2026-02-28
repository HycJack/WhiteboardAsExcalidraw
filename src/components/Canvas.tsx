import React, { useRef, useEffect, useCallback, useState } from 'react';
import rough from 'roughjs';
import { useStore } from '../store';
import { Element, Point, ToolType } from '../types';
import { ShapeRegistry } from '../utils/shapes';

type RoughCanvasType = ReturnType<typeof rough.canvas>;

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate' | 'start' | 'end' | null;

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { state, dispatch, generateId, generateSeed } = useStore();
  const [currentElement, setCurrentElement] = useState<Element | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<Element | null>(null);
  const [textInputPos, setTextInputPos] = useState<{x: number, y: number} | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const startPosRef = useRef<Point | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const currentElementRef = useRef<Element | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStartElement, setResizeStartElement] = useState<Element | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateStartElement, setRotateStartElement] = useState<Element | null>(null);
  const rotateStartAngleRef = useRef<number>(0);

  stateRef.current = state;
  currentElementRef.current = currentElement;

  const getRotatedCursor = useCallback((handle: string, rotation: number): string => {
    const handleAngles: Record<string, number> = {
      'e': 0,
      'se': 45,
      's': 90,
      'sw': 135,
      'w': 180,
      'nw': 225,
      'n': 270,
      'ne': 315
    };

    const baseAngle = handleAngles[handle] ?? 0;
    const actualAngle = baseAngle + rotation;

    const normalizedAngle = ((actualAngle % 360) + 360) % 360;

    if ((normalizedAngle >= 337.5 || normalizedAngle < 22.5) || (normalizedAngle >= 157.5 && normalizedAngle < 202.5)) {
      return 'ew-resize';
    }
    if ((normalizedAngle >= 22.5 && normalizedAngle < 67.5) || (normalizedAngle >= 202.5 && normalizedAngle < 247.5)) {
      return 'nesw-resize';
    }
    if ((normalizedAngle >= 67.5 && normalizedAngle < 112.5) || (normalizedAngle >= 247.5 && normalizedAngle < 292.5)) {
      return 'ns-resize';
    }
    return 'nwse-resize';
  }, []);

  const getCursorStyle = useCallback((): string => {
    if (state.isSpacePressed) return 'grab';
    if (state.tool !== 'select') return 'crosshair';
    if (isRotating) return 'grabbing';
    
    const element = state.selectedElements.length > 0 
      ? state.elements.find(el => el.id === state.selectedElements[0]) 
      : null;
    const rotation = element?.rotation || 0;

    if (isResizing && resizeHandle) {
      if (resizeHandle === 'start' || resizeHandle === 'end') return 'move';
      return getRotatedCursor(resizeHandle, rotation);
    }
    if (hoveredHandle) {
      if (hoveredHandle === 'rotate') return 'grab';
      if (hoveredHandle === 'start' || hoveredHandle === 'end') return 'move';
      return getRotatedCursor(hoveredHandle, rotation);
    }
    return 'default';
  }, [state.isSpacePressed, state.tool, isResizing, resizeHandle, hoveredHandle, isRotating, state.selectedElements, state.elements, getRotatedCursor]);

  const getMousePos = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const currentState = stateRef.current;
    return {
      x: (e.clientX - rect.left - currentState.panX) / currentState.zoom,
      y: (e.clientY - rect.top - currentState.panY) / currentState.zoom
    };
  }, []);

  const drawElement = useCallback((rc: RoughCanvasType, element: Element, ctx: CanvasRenderingContext2D, selectedElements: string[]) => {
    const options = {
      stroke: element.color,
      strokeWidth: element.strokeWidth,
      roughness: element.roughness || 1.5,
      bowing: 1,
      seed: element.seed,
      strokeLineDash: element.strokeStyle === 'dashed' ? [10, 5] :
                     element.strokeStyle === 'dotted' ? [2, 4] : undefined
    };

    ctx.save();
    ctx.globalAlpha = (element.opacity || 100) / 100;

    const rotation = element.rotation || 0;
    if (rotation !== 0) {
      const cx = (element.x1 + element.x2) / 2;
      const cy = (element.y1 + element.y2) / 2;
      ctx.translate(cx, cy);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }

    switch (element.type) {
      case 'rectangle':
        if (element.fill && element.fill !== 'transparent') {
          rc.rectangle(element.x1, element.y1, element.x2 - element.x1, element.y2 - element.y1, {
            ...options,
            fill: element.fill,
            fillStyle: element.fillStyle || 'hachure'
          });
        }
        rc.rectangle(element.x1, element.y1, element.x2 - element.x1, element.y2 - element.y1, options);
        break;

      case 'ellipse': {
        const cx = (element.x1 + element.x2) / 2;
        const cy = (element.y1 + element.y2) / 2;
        const rx = Math.abs(element.x2 - element.x1) / 2;
        const ry = Math.abs(element.y2 - element.y1) / 2;
        if (rx > 0 && ry > 0) {
          if (element.fill && element.fill !== 'transparent') {
            rc.ellipse(cx, cy, rx * 2, ry * 2, {
              ...options,
              fill: element.fill,
              fillStyle: element.fillStyle || 'hachure'
            });
          }
          rc.ellipse(cx, cy, rx * 2, ry * 2, options);
        }
        break;
      }

      case 'diamond': {
        const mx = (element.x1 + element.x2) / 2;
        const my = (element.y1 + element.y2) / 2;
        const diamondPoints: [number, number][] = [
          [mx, element.y1],
          [element.x2, my],
          [mx, element.y2],
          [element.x1, my]
        ];
        if (element.fill && element.fill !== 'transparent') {
          rc.polygon(diamondPoints, {
            ...options,
            fill: element.fill,
            fillStyle: element.fillStyle || 'hachure'
          });
        }
        rc.polygon(diamondPoints, options);
        break;
      }

      case 'arrow':
        rc.line(element.x1, element.y1, element.x2, element.y2, options);
        const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1);
        const headLen = 15 + element.strokeWidth;
        const arrowPoints: [number, number][] = [
          [element.x2, element.y2],
          [element.x2 - headLen * Math.cos(angle - Math.PI / 6), element.y2 - headLen * Math.sin(angle - Math.PI / 6)],
          [element.x2 - headLen * Math.cos(angle + Math.PI / 6), element.y2 - headLen * Math.sin(angle + Math.PI / 6)]
        ];
        rc.polygon(arrowPoints, options);
        break;

      case 'line':
        rc.line(element.x1, element.y1, element.x2, element.y2, options);
        break;

      case 'freedraw':
        if (element.points && element.points.length > 1) {
          for (let i = 1; i < element.points.length; i++) {
            rc.line(
              element.points[i - 1].x,
              element.points[i - 1].y,
              element.points[i].x,
              element.points[i].y,
              options
            );
          }
        }
        break;

      case 'text':
        if (element.text) {
          ctx.font = `${20 + element.strokeWidth * 2}px 'Patrick Hand', cursive`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x1, element.y1);
        }
        break;

      default:
        if (ShapeRegistry.has(element.type)) {
          const customShape = ShapeRegistry.get(element.type);
          if (customShape?.renderer) {
            customShape.renderer(rc, element, options);
          }
        }
    }

    if (selectedElements.includes(element.id)) {
      drawSelectionBox(ctx, element);
    }

    ctx.restore();
  }, []);

  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D, element: Element) => {
    const x = Math.min(element.x1, element.x2);
    const y = Math.min(element.y1, element.y2);
    const w = Math.abs(element.x2 - element.x1);
    const h = Math.abs(element.y2 - element.y1);

    ctx.save();

    const handleSize = 8;
    ctx.fillStyle = '#ffffff';
    ctx.setLineDash([]);

    let handles: { pos: [number, number]; cursor: string; handle: ResizeHandle }[] = [];

    if (element.type === 'line' || element.type === 'arrow') {
      handles = [
        { pos: [element.x1, element.y1], cursor: 'move', handle: 'start' },
        { pos: [element.x2, element.y2], cursor: 'move', handle: 'end' }
      ];
    } else {
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);

      handles = [
        { pos: [x - 4, y - 4], cursor: 'nw-resize', handle: 'nw' },
        { pos: [x + w / 2, y - 4], cursor: 'n-resize', handle: 'n' },
        { pos: [x + w + 4, y - 4], cursor: 'ne-resize', handle: 'ne' },
        { pos: [x + w + 4, y + h / 2], cursor: 'e-resize', handle: 'e' },
        { pos: [x + w + 4, y + h + 4], cursor: 'se-resize', handle: 'se' },
        { pos: [x + w / 2, y + h + 4], cursor: 's-resize', handle: 's' },
        { pos: [x - 4, y + h + 4], cursor: 'sw-resize', handle: 'sw' },
        { pos: [x - 4, y + h / 2], cursor: 'w-resize', handle: 'w' }
      ];
    }

    handles.forEach(({ pos: [hx, hy] }) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize);
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx - handleSize/2, hy - handleSize/2, handleSize, handleSize);
    });

    if (element.type !== 'line' && element.type !== 'arrow') {
      const rotateHandleY = y - 30;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 4);
      ctx.lineTo(x + w / 2, rotateHandleY + 8);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + w / 2, rotateHandleY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#6965db';
      ctx.lineWidth = 2;
      ctx.stroke();

      (element as any)._handles = [...handles, { pos: [x + w / 2, rotateHandleY] as [number, number], cursor: 'grab', handle: 'rotate' as ResizeHandle }];
    } else {
      (element as any)._handles = handles;
    }

    ctx.restore();
  }, []);

  const render = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const currentState = stateRef.current;
      const currentEl = currentElementRef.current;

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

      offCtx.save();
      offCtx.translate(currentState.panX, currentState.panY);
      offCtx.scale(currentState.zoom, currentState.zoom);

      const rc = rough.canvas(offscreen);

      currentState.elements.forEach(element => {
        drawElement(rc, element, offCtx, currentState.selectedElements);
      });

      if (currentEl) {
        drawElement(rc, currentEl, offCtx, []);
      }

      offCtx.restore();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0);

      animationFrameRef.current = null;
    });
  }, [drawElement]);

  const getSelectedElement = (): Element | null => {
    if (state.selectedElements.length === 0) return null;
    return state.elements.find(el => el.id === state.selectedElements[0]) || null;
  };

  const getHandleAtPosition = (x: number, y: number): ResizeHandle => {
    const element = getSelectedElement();
    if (!element) return null;

    const handles = (element as any)._handles as { pos: [number, number]; handle: ResizeHandle }[] || [];
    const handleSize = 10;
    const rotation = element.rotation || 0;
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;

    let testX = x;
    let testY = y;

    if (rotation !== 0) {
      const rad = -rotation * Math.PI / 180;
      const dx = x - cx;
      const dy = y - cy;
      testX = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      testY = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }

    for (const { pos: [hx, hy], handle } of handles) {
      if (testX >= hx - handleSize && testX <= hx + handleSize &&
          testY >= hy - handleSize && testY <= hy + handleSize) {
        return handle;
      }
    }
    return null;
  };

  const isPointInElement = (x: number, y: number, element: Element): boolean => {
    const tolerance = 10;
    const rotation = element.rotation || 0;
    const cx = (element.x1 + element.x2) / 2;
    const cy = (element.y1 + element.y2) / 2;

    let testX = x;
    let testY = y;

    if (rotation !== 0) {
      const rad = -rotation * Math.PI / 180;
      const dx = x - cx;
      const dy = y - cy;
      testX = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      testY = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }

    if (ShapeRegistry.has(element.type)) {
      const customShape = ShapeRegistry.get(element.type);
      if (customShape?.hitTest) {
        return customShape.hitTest(element, testX, testY);
      }
    }

    switch (element.type) {
      case 'rectangle':
      case 'diamond':
        const minX = Math.min(element.x1, element.x2) - tolerance;
        const maxX = Math.max(element.x1, element.x2) + tolerance;
        const minY = Math.min(element.y1, element.y2) - tolerance;
        const maxY = Math.max(element.y1, element.y2) + tolerance;
        return testX >= minX && testX <= maxX && testY >= minY && testY <= maxY;

      case 'ellipse': {
        const ecx = (element.x1 + element.x2) / 2;
        const ecy = (element.y1 + element.y2) / 2;
        const erx = Math.abs(element.x2 - element.x1) / 2 + tolerance;
        const ery = Math.abs(element.y2 - element.y1) / 2 + tolerance;
        return ((testX - ecx) ** 2 / erx ** 2 + (testY - ecy) ** 2 / ery ** 2) <= 1;
      }

      case 'arrow':
      case 'line':
        return distToSegment(testX, testY, element.x1, element.y1, element.x2, element.y2) < tolerance;

      case 'freedraw':
        if (element.points) {
          for (let i = 1; i < element.points.length; i++) {
            if (distToSegment(testX, testY, element.points[i-1].x, element.points[i-1].y,
              element.points[i].x, element.points[i].y) < tolerance) {
              return true;
            }
          }
        }
        return false;

      case 'text':
        const textWidth = element.text ? element.text.length * 12 : 100;
        return testX >= element.x1 && testX <= element.x1 + textWidth &&
               testY >= element.y1 - 20 && testY <= element.y1 + 5;

      default:
        return false;
    }
  };

  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx: number, yy: number;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const getElementAtPosition = (x: number, y: number): Element | null => {
    for (let i = state.elements.length - 1; i >= 0; i--) {
      if (isPointInElement(x, y, state.elements[i])) {
        return state.elements[i];
      }
    }
    return null;
  };

  const createElement = (type: ToolType, x1: number, y1: number, x2: number, y2: number): Element => {
    return {
      id: generateId(),
      type,
      x1,
      y1,
      x2,
      y2,
      color: state.currentColor,
      fill: state.currentFill,
      strokeWidth: state.strokeWidth,
      strokeStyle: state.strokeStyle,
      fillStyle: state.fillStyle,
      roughness: state.roughness,
      opacity: state.opacity,
      points: [],
      text: '',
      seed: generateSeed(),
      rotation: 0
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果正在编辑文本，不处理鼠标事件
    if (editingTextElement) {
      handleTextInputComplete();
      return;
    }

    const pos = getMousePos(e);
    startPosRef.current = pos;

    if (state.isSpacePressed || e.button === 1) {
      dispatch({ type: 'SET_IS_PANNING', payload: true });
      return;
    }

    if (state.tool === 'select') {
      if (state.selectedElements.length > 0) {
        const handle = getHandleAtPosition(pos.x, pos.y);
        if (handle) {
          const element = getSelectedElement();
          if (element) {
            if (handle === 'rotate') {
              setIsRotating(true);
              setRotateStartElement({ ...element });
              const cx = (element.x1 + element.x2) / 2;
              const cy = (element.y1 + element.y2) / 2;
              rotateStartAngleRef.current = Math.atan2(pos.y - cy, pos.x - cx);
            } else {
              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStartElement({ ...element });
            }
            return;
          }
        }
      }

      const element = getElementAtPosition(pos.x, pos.y);
      if (element) {
        if (!e.shiftKey) {
          dispatch({ type: 'SELECT_ELEMENTS', payload: [element.id] });
        } else {
          if (state.selectedElements.includes(element.id)) {
            dispatch({ type: 'SELECT_ELEMENTS', payload: state.selectedElements.filter(id => id !== element.id) });
          } else {
            dispatch({ type: 'SELECT_ELEMENTS', payload: [...state.selectedElements, element.id] });
          }
        }
      } else {
        dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
      }
      render();
      return;
    }

    // 文本工具：点击时直接显示输入框
    if (state.tool === 'text') {
      const element = createElement(state.tool, pos.x, pos.y, pos.x, pos.y);
      element.text = '';
      setEditingTextElement(element);
      setTextInputPos({ x: pos.x, y: pos.y });
      setTextInputValue('');
      // 延迟聚焦输入框，确保DOM渲染完成
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);
      return;
    }

    dispatch({ type: 'SET_IS_DRAWING', payload: true });

    if (state.tool === 'freedraw') {
      const element = createElement(state.tool, pos.x, pos.y, pos.x, pos.y);
      element.points = [{ x: pos.x, y: pos.y }];
      setCurrentElement(element);
    } else {
      const element = createElement(state.tool, pos.x, pos.y, pos.x, pos.y);
      setCurrentElement(element);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);

    if (state.isPanning) {
      dispatch({ type: 'SET_PAN', payload: { x: state.panX + e.movementX, y: state.panY + e.movementY } });
      render();
      return;
    }

    // 处理调整大小
    if (isResizing && resizeHandle && resizeStartElement && state.selectedElements.length > 0) {
      let dx = pos.x - startPosRef.current!.x;
      let dy = pos.y - startPosRef.current!.y;
      const element = resizeStartElement;
      const rotation = element.rotation || 0;

      if (rotation !== 0 && resizeHandle !== 'start' && resizeHandle !== 'end') {
        const rad = -rotation * Math.PI / 180;
        const newDx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const newDy = dx * Math.sin(rad) + dy * Math.cos(rad);
        dx = newDx;
        dy = newDy;
      }

      let newX1 = element.x1;
      let newY1 = element.y1;
      let newX2 = element.x2;
      let newY2 = element.y2;

      switch (resizeHandle) {
        case 'start':
          newX1 = element.x1 + dx;
          newY1 = element.y1 + dy;
          break;
        case 'end':
          newX2 = element.x2 + dx;
          newY2 = element.y2 + dy;
          break;
        case 'nw':
          newX1 = element.x1 + dx;
          newY1 = element.y1 + dy;
          break;
        case 'n':
          newY1 = element.y1 + dy;
          break;
        case 'ne':
          newX2 = element.x2 + dx;
          newY1 = element.y1 + dy;
          break;
        case 'e':
          newX2 = element.x2 + dx;
          break;
        case 'se':
          newX2 = element.x2 + dx;
          newY2 = element.y2 + dy;
          break;
        case 's':
          newY2 = element.y2 + dy;
          break;
        case 'sw':
          newX1 = element.x1 + dx;
          newY2 = element.y2 + dy;
          break;
        case 'w':
          newX1 = element.x1 + dx;
          break;
      }

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: {
          id: state.selectedElements[0],
          updates: { x1: newX1, y1: newY1, x2: newX2, y2: newY2 }
        }
      });
      render();
      return;
    }

    if (isRotating && rotateStartElement && state.selectedElements.length > 0) {
      const element = rotateStartElement;
      const cx = (element.x1 + element.x2) / 2;
      const cy = (element.y1 + element.y2) / 2;
      const currentAngle = Math.atan2(pos.y - cy, pos.x - cx);
      const angleDiff = currentAngle - rotateStartAngleRef.current;
      const initialRotation = element.rotation || 0;
      const rotation = initialRotation + (angleDiff * 180 / Math.PI);

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: {
          id: state.selectedElements[0],
          updates: { rotation: Math.round(rotation) }
        }
      });
      render();
      return;
    }

    // 处理移动
    if (state.tool === 'select' && e.buttons === 1 && state.selectedElements.length > 0 && startPosRef.current) {
      const dx = pos.x - startPosRef.current.x;
      const dy = pos.y - startPosRef.current.y;

      state.selectedElements.forEach(id => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          dispatch({
            type: 'UPDATE_ELEMENT',
            payload: {
              id,
              updates: {
                x1: element.x1 + dx,
                y1: element.y1 + dy,
                x2: element.x2 + dx,
                y2: element.y2 + dy,
                points: element.points?.map(p => ({ x: p.x + dx, y: p.y + dy }))
              }
            }
          });
        }
      });

      startPosRef.current = pos;
      render();
      return;
    }

    if (state.isDrawing && currentElement) {
      if (state.tool === 'freedraw') {
        const updated = { ...currentElement };
        updated.points = [...updated.points, { x: pos.x, y: pos.y }];
        updated.x2 = pos.x;
        updated.y2 = pos.y;
        setCurrentElement(updated);
      } else {
        setCurrentElement({ ...currentElement, x2: pos.x, y2: pos.y });
      }
      render();
    }

    if (state.tool === 'select' && state.selectedElements.length > 0 && !state.isDrawing && !isResizing && !isRotating) {
      const handle = getHandleAtPosition(pos.x, pos.y);
      if (handle !== hoveredHandle) {
        setHoveredHandle(handle);
      }
    } else if (hoveredHandle !== null) {
      setHoveredHandle(null);
    }
  };

  const handleMouseUp = () => {
    if (state.isPanning) {
      dispatch({ type: 'SET_IS_PANNING', payload: false });
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartElement(null);
      dispatch({ type: 'SAVE_HISTORY' });
      render();
      return;
    }

    if (isRotating) {
      setIsRotating(false);
      setRotateStartElement(null);
      dispatch({ type: 'SAVE_HISTORY' });
      render();
      return;
    }

    if (state.isDrawing && currentElement) {
      dispatch({ type: 'SET_IS_DRAWING', payload: false });

      const w = Math.abs(currentElement.x2 - currentElement.x1);
      const h = Math.abs(currentElement.y2 - currentElement.y1);

      if (currentElement.type === 'freedraw') {
        if (currentElement.points.length >= 2) {
          dispatch({ type: 'ADD_ELEMENT', payload: currentElement });
          dispatch({ type: 'SAVE_HISTORY' });
          if (!state.toolLocked) {
            dispatch({ type: 'SET_TOOL', payload: 'select' });
            dispatch({ type: 'SELECT_ELEMENTS', payload: [currentElement.id] });
          }
        }
      } else if (w >= 5 || h >= 5) {
        dispatch({ type: 'ADD_ELEMENT', payload: currentElement });
        dispatch({ type: 'SAVE_HISTORY' });
        if (!state.toolLocked) {
          dispatch({ type: 'SET_TOOL', payload: 'select' });
          dispatch({ type: 'SELECT_ELEMENTS', payload: [currentElement.id] });
        }
      }

      setCurrentElement(null);
      render();
    }

    startPosRef.current = null;
  };

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredHandle(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, state.zoom * delta));

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      dispatch({
        type: 'SET_PAN',
        payload: {
          x: mouseX - (mouseX - state.panX) * (newZoom / state.zoom),
          y: mouseY - (mouseY - state.panY) * (newZoom / state.zoom)
        }
      });
      dispatch({ type: 'SET_ZOOM', payload: newZoom });
      render();
    } else {
      dispatch({ type: 'SET_PAN', payload: { x: state.panX - e.deltaX, y: state.panY - e.deltaY } });
      render();
    }
  };

  // 处理文本输入完成
  const handleTextInputComplete = () => {
    if (editingTextElement && textInputValue.trim()) {
      // 创建带有文字的文本元素
      const textElement = {
        ...editingTextElement,
        text: textInputValue,
        x2: editingTextElement.x1 + textInputValue.length * 12,
        y2: editingTextElement.y1 + 30
      };
      dispatch({ type: 'ADD_ELEMENT', payload: textElement });
      dispatch({ type: 'SAVE_HISTORY' });
      if (!state.toolLocked) {
        dispatch({ type: 'SET_TOOL', payload: 'select' });
        dispatch({ type: 'SELECT_ELEMENTS', payload: [textElement.id] });
      }
    }
    // 清除编辑状态
    setEditingTextElement(null);
    setTextInputPos(null);
    setTextInputValue('');
    render();
  };

  // 处理文本输入框按键事件
  const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTextInputComplete();
    } else if (e.key === 'Escape') {
      // 取消文本输入
      setEditingTextElement(null);
      setTextInputPos(null);
      setTextInputValue('');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        render();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑文本，只处理ESC键
      if (editingTextElement) {
        if (e.key === 'Escape') {
          setEditingTextElement(null);
          setTextInputPos(null);
          setTextInputValue('');
        }
        return;
      }

      if (e.code === 'Space' && !state.isSpacePressed) {
        dispatch({ type: 'SET_IS_SPACE_PRESSED', payload: true });
        e.preventDefault();
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v': dispatch({ type: 'SET_TOOL', payload: 'select' }); break;
          case 'r': dispatch({ type: 'SET_TOOL', payload: 'rectangle' }); break;
          case 'o': dispatch({ type: 'SET_TOOL', payload: 'ellipse' }); break;
          case 'd': dispatch({ type: 'SET_TOOL', payload: 'diamond' }); break;
          case 'a': dispatch({ type: 'SET_TOOL', payload: 'arrow' }); break;
          case 'l': dispatch({ type: 'SET_TOOL', payload: 'line' }); break;
          case 'p': dispatch({ type: 'SET_TOOL', payload: 'freedraw' }); break;
          case 't': dispatch({ type: 'SET_TOOL', payload: 'text' }); break;
          case 'delete':
          case 'backspace':
            if (state.selectedElements.length > 0) {
              dispatch({ type: 'DELETE_ELEMENTS', payload: state.selectedElements });
              dispatch({ type: 'SAVE_HISTORY' });
            }
            break;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        dispatch({ type: 'SET_IS_SPACE_PRESSED', payload: false });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.isSpacePressed, state.selectedElements, dispatch, editingTextElement]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0"
        style={{
          cursor: getCursorStyle()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      {/* 文本输入框 */}
      {textInputPos && (
        <input
          ref={textInputRef}
          type="text"
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={handleTextInputKeyDown}
          onBlur={handleTextInputComplete}
          className="fixed bg-transparent border-2 border-[#6965db] outline-none px-2 py-1 text-lg"
          style={{
            left: textInputPos.x * state.zoom + state.panX,
            top: textInputPos.y * state.zoom + state.panY - 10,
            color: state.currentColor,
            fontSize: `${(20 + state.strokeWidth * 2) * state.zoom}px`,
            fontFamily: "'Patrick Hand', cursive",
            minWidth: '100px'
          }}
          autoFocus
        />
      )}
    </>
  );
}
