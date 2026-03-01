import React, { useRef, useEffect, useCallback, useState } from 'react';
import rough from 'roughjs';
import { useStore } from '../store';
import { Element, Point, ToolType } from '../types';
import { ShapeRegistry } from '../utils/shapes';
import { RendererFactory, RenderOptions } from '../renderers';

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

  // 框选相关状态
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [selectionStartPos, setSelectionStartPos] = useState<Point | null>(null);

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
    if (state.isPanning) return 'grabbing';
    if (state.isSpacePressed) return 'grab';
    if (state.tool === 'eraser') return 'not-allowed';
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
  }, [state.isSpacePressed, state.isPanning, state.tool, isResizing, resizeHandle, hoveredHandle, isRotating, state.selectedElements, state.elements, getRotatedCursor]);

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
    const options: RenderOptions = {
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

    const renderer = RendererFactory.createRenderer(element.type);
    if (renderer) {
      renderer.render(rc as any, element, options, ctx);
    } else if (ShapeRegistry.has(element.type)) {
      const customShape = ShapeRegistry.get(element.type);
      if (customShape?.renderer) {
        // Add fill options for custom shapes
        // Only apply fill when fillStyle is not 'none' and fill is not transparent
        const hasFill = element.fillStyle !== 'none' && element.fill && element.fill !== 'transparent';
        const shapeOptions = {
          ...options,
          fill: hasFill ? element.fill : undefined,
          fillStyle: element.fillStyle === 'none' ? undefined : (element.fillStyle || 'hachure')
        };
        customShape.renderer(rc, element, shapeOptions);
      }
    }

    if (selectedElements.includes(element.id)) {
      drawSelectionBox(ctx, element);
    }

    ctx.restore();
  }, []);

  const drawSelectionBox = useCallback((ctx: CanvasRenderingContext2D, element: Element) => {
    let x: number, y: number, w: number, h: number;

    // For freedraw, use the actual points bounds
    if (element.type === 'freedraw' && element.points && element.points.length > 0) {
      let minX = element.points[0].x;
      let maxX = element.points[0].x;
      let minY = element.points[0].y;
      let maxY = element.points[0].y;

      for (const point of element.points) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      x = minX;
      y = minY;
      w = maxX - minX;
      h = maxY - minY;
    } else {
      x = Math.min(element.x1, element.x2);
      y = Math.min(element.y1, element.y2);
      w = Math.abs(element.x2 - element.x1);
      h = Math.abs(element.y2 - element.y1);
    }

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
      const dpr = window.devicePixelRatio || 1;

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
      offCtx.translate(currentState.panX * dpr, currentState.panY * dpr);
      offCtx.scale(currentState.zoom * dpr, currentState.zoom * dpr);

      const rc = rough.canvas(offscreen);

      currentState.elements.forEach(element => {
        drawElement(rc, element, offCtx, currentState.selectedElements);
      });

      if (currentEl) {
        drawElement(rc, currentEl, offCtx, []);
      }

      // 绘制框选框
      if (selectionBox) {
        const minX = Math.min(selectionBox.x1, selectionBox.x2);
        const maxX = Math.max(selectionBox.x1, selectionBox.x2);
        const minY = Math.min(selectionBox.y1, selectionBox.y2);
        const maxY = Math.max(selectionBox.y1, selectionBox.y2);

        offCtx.save();
        offCtx.strokeStyle = '#6965db';
        offCtx.fillStyle = 'rgba(105, 101, 219, 0.1)';
        offCtx.lineWidth = 1;
        offCtx.setLineDash([5, 5]);
        offCtx.fillRect(minX, minY, maxX - minX, maxY - minY);
        offCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        offCtx.restore();
      }

      offCtx.restore();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0);

      animationFrameRef.current = null;
    });
  }, [drawElement, selectionBox]);

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

      case 'image':
      case 'webpage':
      case 'geogebra': {
        const embedMinX = Math.min(element.x1, element.x2) - tolerance;
        const embedMaxX = Math.max(element.x1, element.x2) + tolerance;
        const embedMinY = Math.min(element.y1, element.y2) - tolerance;
        const embedMaxY = Math.max(element.y1, element.y2) + tolerance;
        return testX >= embedMinX && testX <= embedMaxX && testY >= embedMinY && testY <= embedMaxY;
      }

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
        render();
        return;
      } else {
        // 点击空白处，开始框选
        if (!e.shiftKey) {
          dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
        }
        setIsSelecting(true);
        setSelectionStartPos(pos);
        setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
        render();
        return;
      }
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

    // 橡皮擦工具：点击删除元素
    if (state.tool === 'eraser') {
      const element = getElementAtPosition(pos.x, pos.y);
      if (element) {
        dispatch({ type: 'DELETE_ELEMENTS', payload: [element.id] });
        dispatch({ type: 'SAVE_HISTORY' });
        render();
      }
      return;
    }

    // 图片工具：点击时打开文件选择
    if (state.tool === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const imageSrc = event.target?.result as string;
            // 创建临时图片获取实际尺寸
            const img = new Image();
            img.onload = () => {
              const element = createElement('image', pos.x, pos.y, pos.x + img.width, pos.y + img.height);
              element.imageSrc = imageSrc;
              dispatch({ type: 'ADD_ELEMENT', payload: element });
              dispatch({ type: 'SAVE_HISTORY' });
              dispatch({ type: 'SELECT_ELEMENTS', payload: [element.id] });
              if (!state.toolLocked) {
                dispatch({ type: 'SET_TOOL', payload: 'select' });
              }
              render();
            };
            img.src = imageSrc;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    // 网页工具：点击时输入网址
    if (state.tool === 'webpage') {
      const url = prompt('请输入网页地址:', 'https://');
      if (url && url !== 'https://') {
        const element = createElement('webpage', pos.x, pos.y, pos.x + 800, pos.y + 600);
        element.text = url;
        dispatch({ type: 'ADD_ELEMENT', payload: element });
        dispatch({ type: 'SAVE_HISTORY' });
        dispatch({ type: 'SELECT_ELEMENTS', payload: [element.id] });
        if (!state.toolLocked) {
          dispatch({ type: 'SET_TOOL', payload: 'select' });
        }
        render();
      }
      return;
    }

    // GeoGebra工具：点击时输入GeoGebra资源ID或URL
    if (state.tool === 'geogebra') {
      const input = prompt('请输入 GeoGebra 资源 ID 或链接:', '');
      if (input) {
        // 提取资源ID
        let resourceId = input;
        const match = input.match(/(?:geogebra\.org\/m\/|material\/|id=)([a-zA-Z0-9]+)/);
        if (match) {
          resourceId = match[1];
        }
        const element = createElement('geogebra', pos.x, pos.y, pos.x + 800, pos.y + 600);
        element.text = resourceId;
        dispatch({ type: 'ADD_ELEMENT', payload: element });
        dispatch({ type: 'SAVE_HISTORY' });
        dispatch({ type: 'SELECT_ELEMENTS', payload: [element.id] });
        if (!state.toolLocked) {
          dispatch({ type: 'SET_TOOL', payload: 'select' });
        }
        render();
      }
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

    // 处理框选
    if (isSelecting && selectionStartPos) {
      setSelectionBox({
        x1: selectionStartPos.x,
        y1: selectionStartPos.y,
        x2: pos.x,
        y2: pos.y
      });
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

      // Calculate scale factors for freedraw
      const oldWidth = element.x2 - element.x1;
      const oldHeight = element.y2 - element.y1;
      const newWidth = newX2 - newX1;
      const newHeight = newY2 - newY1;
      
      const updates: any = { x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
      
      // For freedraw, scale the points
      if (element.type === 'freedraw' && element.points && element.points.length > 0) {
        const scaleX = oldWidth !== 0 ? newWidth / oldWidth : 1;
        const scaleY = oldHeight !== 0 ? newHeight / oldHeight : 1;
        
        updates.points = element.points.map(p => ({
          x: newX1 + (p.x - element.x1) * scaleX,
          y: newY1 + (p.y - element.y1) * scaleY
        }));
      }

      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: {
          id: state.selectedElements[0],
          updates
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

    // 处理框选结束
    if (isSelecting && selectionBox) {
      const minX = Math.min(selectionBox.x1, selectionBox.x2);
      const maxX = Math.max(selectionBox.x1, selectionBox.x2);
      const minY = Math.min(selectionBox.y1, selectionBox.y2);
      const maxY = Math.max(selectionBox.y1, selectionBox.y2);

      // 只有当框选区域大于一定阈值时才选择元素
      if (Math.abs(selectionBox.x2 - selectionBox.x1) > 5 || Math.abs(selectionBox.y2 - selectionBox.y1) > 5) {
        const selectedIds = state.elements
          .filter(el => {
            const elMinX = Math.min(el.x1, el.x2);
            const elMaxX = Math.max(el.x1, el.x2);
            const elMinY = Math.min(el.y1, el.y2);
            const elMaxY = Math.max(el.y1, el.y2);
            // 检查元素是否与框选区域相交
            return elMaxX >= minX && elMinX <= maxX && elMaxY >= minY && elMinY <= maxY;
          })
          .map(el => el.id);

        dispatch({ type: 'SELECT_ELEMENTS', payload: selectedIds });
      }

      setIsSelecting(false);
      setSelectionBox(null);
      setSelectionStartPos(null);
      render();
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
        const canvas = canvasRef.current;
        const dpr = window.devicePixelRatio || 1;

        // Set CSS size to window size
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';

        // Set actual canvas size (scaled by DPR for high DPI displays)
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

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
    render();
  }, [state.elements, render]);

  // Re-render when zoom or pan changes
  useEffect(() => {
    render();
  }, [state.zoom, state.panX, state.panY, render]);

  // Auto focus to content area only on initial load (when elements first become available)
  const initialFocusDoneRef = useRef(false);
  useEffect(() => {
    if (!initialFocusDoneRef.current && state.elements.length > 0 && canvasRef.current) {
      initialFocusDoneRef.current = true;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      // Use CSS pixels (logical pixels) for calculations
      const canvasWidth = (canvas.width / dpr) || window.innerWidth;
      const canvasHeight = (canvas.height / dpr) || window.innerHeight;

      // Calculate bounding box of all elements
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasValidElement = false;

      for (const element of state.elements) {
        const x1 = Math.min(element.x1, element.x2);
        const y1 = Math.min(element.y1, element.y2);
        const x2 = Math.max(element.x1, element.x2);
        const y2 = Math.max(element.y1, element.y2);

        if (element.points && element.points.length > 0) {
          for (const point of element.points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          }
          hasValidElement = true;
        } else if (x2 - x1 > 0 || y2 - y1 > 0) {
          minX = Math.min(minX, x1);
          minY = Math.min(minY, y1);
          maxX = Math.max(maxX, x2);
          maxY = Math.max(maxY, y2);
          hasValidElement = true;
        }
      }

      if (hasValidElement && isFinite(minX)) {
        // Add padding
        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // Calculate zoom to fit content (using CSS pixels)
        const zoomX = canvasWidth / contentWidth;
        const zoomY = canvasHeight / contentHeight;
        const newZoom = Math.min(zoomX, zoomY, 1); // Max zoom 100%

        // Calculate pan to center content
        const newPanX = (canvasWidth - contentWidth * newZoom) / 2 - minX * newZoom;
        const newPanY = (canvasHeight - contentHeight * newZoom) / 2 - minY * newZoom;

        dispatch({ type: 'SET_ZOOM', payload: newZoom });
        dispatch({ type: 'SET_PAN', payload: { x: newPanX, y: newPanY } });
      }
    }
  }, [state.elements]); // Only runs when elements change, but only executes once

  // Function to focus to content area
  const focusToContent = useCallback(() => {
    if (state.elements.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = (canvas.width / dpr) || window.innerWidth;
    const canvasHeight = (canvas.height / dpr) || window.innerHeight;

    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasValidElement = false;

    for (const element of state.elements) {
      const x1 = Math.min(element.x1, element.x2);
      const y1 = Math.min(element.y1, element.y2);
      const x2 = Math.max(element.x1, element.x2);
      const y2 = Math.max(element.y1, element.y2);

      if (element.points && element.points.length > 0) {
        for (const point of element.points) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
        hasValidElement = true;
      } else if (x2 - x1 > 0 || y2 - y1 > 0) {
        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
        hasValidElement = true;
      }
    }

    if (hasValidElement && isFinite(minX)) {
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;

      const zoomX = canvasWidth / contentWidth;
      const zoomY = canvasHeight / contentHeight;
      const newZoom = Math.min(zoomX, zoomY, 1);

      const newPanX = (canvasWidth - contentWidth * newZoom) / 2 - minX * newZoom;
      const newPanY = (canvasHeight - contentHeight * newZoom) / 2 - minY * newZoom;

      dispatch({ type: 'SET_ZOOM', payload: newZoom });
      dispatch({ type: 'SET_PAN', payload: { x: newPanX, y: newPanY } });
    }
  }, [state.elements, dispatch]);

  // Check if content is visible in viewport
  const isContentVisible = useCallback(() => {
    if (state.elements.length === 0) return true;

    // Calculate content bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const element of state.elements) {
      const x1 = Math.min(element.x1, element.x2);
      const y1 = Math.min(element.y1, element.y2);
      const x2 = Math.max(element.x1, element.x2);
      const y2 = Math.max(element.y1, element.y2);

      if (element.points && element.points.length > 0) {
        for (const point of element.points) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
      } else {
        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
        maxX = Math.max(maxX, x2);
        maxY = Math.max(maxY, y2);
      }
    }

    if (!isFinite(minX)) return true;

    // Check if any part of content is visible in viewport
    const viewportLeft = -state.panX / state.zoom;
    const viewportTop = -state.panY / state.zoom;
    const viewportRight = viewportLeft + window.innerWidth / state.zoom;
    const viewportBottom = viewportTop + window.innerHeight / state.zoom;

    // Content is visible if it overlaps with viewport
    return !(maxX < viewportLeft || minX > viewportRight || maxY < viewportTop || minY > viewportBottom);
  }, [state.elements, state.panX, state.panY, state.zoom]);

  const [showFocusButton, setShowFocusButton] = useState(false);

  useEffect(() => {
    setShowFocusButton(state.elements.length > 0 && !isContentVisible());
  }, [state.elements, state.panX, state.panY, state.zoom, isContentVisible]);

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
      {/* 回到内容区域按钮 */}
      {showFocusButton && (
        <button
          onClick={focusToContent}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-[#6965db] text-white rounded-full shadow-lg hover:bg-[#5a52d0] transition-all animate-in fade-in slide-in-from-bottom-2"
          title="回到内容区域"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <span className="text-sm font-medium">回到内容区域</span>
        </button>
      )}
    </>
  );
}
