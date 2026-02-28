import React from 'react';
import { useStore } from '../store';

export default function BottomControls() {
  const { state, dispatch } = useStore();

  const setZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(5, state.zoom * delta));
    dispatch({ type: 'SET_ZOOM', payload: newZoom });
  };

  const exportToPNG = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    state.elements.forEach(element => {
      minX = Math.min(minX, element.x1, element.x2);
      minY = Math.min(minY, element.y1, element.y2);
      maxX = Math.max(maxX, element.x1, element.x2);
      maxY = Math.max(maxY, element.y1, element.y2);
    });

    if (state.elements.length === 0) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    }

    const padding = 50;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(-minX + padding, -minY + padding);

    // Import roughjs dynamically for export
    import('roughjs').then(({ default: rough }) => {
      const rc = rough.canvas(canvas);

      state.elements.forEach(element => {
        const options = {
          stroke: element.color,
          strokeWidth: element.strokeWidth,
          roughness: element.roughness || 1.5,
          bowing: 1,
          seed: element.seed,
          strokeLineDash: element.strokeStyle === 'dashed' ? [10, 5] :
                         element.strokeStyle === 'dotted' ? [2, 4] : undefined
        };

        ctx.globalAlpha = (element.opacity || 100) / 100;

        const rotation = element.rotation || 0;
        if (rotation !== 0) {
          const cx = (element.x1 + element.x2) / 2;
          const cy = (element.y1 + element.y2) / 2;
          ctx.save();
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
        }

        if (rotation !== 0) {
          ctx.restore();
        }

        ctx.globalAlpha = 1;
      });

      const link = document.createElement('a');
      link.download = 'whiteboard-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const clearCanvas = () => {
    if (confirm('确定要清空画布吗？')) {
      dispatch({ type: 'SET_ELEMENTS', payload: [] });
      dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
      dispatch({ type: 'SAVE_HISTORY' });
    }
  };

  return (
    <>
      {/* Bottom Left Controls */}
      <div className="fixed bottom-4 left-4 flex items-center gap-2 px-2 py-2 bg-white rounded-xl shadow-md z-50">
        <div className="flex items-center gap-1 px-2">
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setZoom(0.8)}
            title="缩小"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[48px] text-center">
            {Math.round(state.zoom * 100)}%
          </span>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
            onClick={() => setZoom(1.2)}
            title="放大"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => dispatch({ type: 'UNDO' })}
          title="撤销 (Ctrl+Z)"
          disabled={state.historyIndex <= 0}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => dispatch({ type: 'REDO' })}
          title="重做 (Ctrl+Shift+Z)"
          disabled={state.historyIndex >= state.history.length - 1}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
          </svg>
        </button>
      </div>

      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <button
          className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg shadow-md text-sm font-medium hover:bg-gray-50"
          onClick={clearCanvas}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清空
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-2 bg-[#6965db] text-white rounded-lg shadow-md text-sm font-medium hover:bg-[#5a52d0]"
          onClick={exportToPNG}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出
        </button>
      </div>

      {/* Shortcuts Hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-400 bg-white px-3 py-2 rounded-lg shadow-md">
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">V</kbd> 选择{' '}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">R</kbd> 矩形{' '}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">Space</kbd>+拖动 移动
      </div>
    </>
  );
}
