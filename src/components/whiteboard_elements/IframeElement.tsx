import React, { useState, useRef, useEffect } from 'react';
import { ElementComponentProps, ElementDefinition } from './BaseElement';
import { elementRegistry } from './ElementRegistry';
import { ExternalLink, X, Maximize2, Minimize2 } from 'lucide-react';

interface IframeComponentProps extends ElementComponentProps {
  onUpdate?: (id: string, updates: Partial<any>) => void;
}

const IframeComponent: React.FC<IframeComponentProps> = ({ element, isSelected, onSelect, onUpdate, zoom = 1 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(element.src || 'https://www.example.com');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: element.x, y: element.y, width: element.width, height: element.height });
  const [loadError, setLoadError] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUrl(element.src || 'https://www.example.com');
    setLoadError(false);
  }, [element.src]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected || isInteractive) return;
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handleSize = 15;
    
    const handles = [
      { name: 'nw', x: -handleSize, y: -handleSize },
      { name: 'ne', x: element.width - handleSize, y: -handleSize },
      { name: 'sw', x: -handleSize, y: element.height - handleSize },
      { name: 'se', x: element.width - handleSize, y: element.height - handleSize }
    ];
    
    const clickedHandle = handles.find(h => 
      x >= h.x && x <= h.x + handleSize * 2 &&
      y >= h.y && y <= h.y + handleSize * 2
    );
    
    if (clickedHandle) {
      setIsResizing(true);
      setResizeHandle(clickedHandle.name);
    } else {
      setIsDragging(true);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: element.x, y: element.y, width: element.width, height: element.height });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    e.stopPropagation();
    
    const dx = (e.clientX - dragStart.x) / zoom;
    const dy = (e.clientY - dragStart.y) / zoom;
    
    if (isDragging) {
      const newX = elementStart.x + dx;
      const newY = elementStart.y + dy;
      onUpdate?.(element.id, { x: newX, y: newY });
    } else if (isResizing) {
      const minSize = 100;
      let updates: any = {};
      
      if (resizeHandle === 'se') {
        updates.width = Math.max(minSize, elementStart.width + dx);
        updates.height = Math.max(minSize, elementStart.height + dy);
      } else if (resizeHandle === 'sw') {
        updates.x = elementStart.x + dx;
        updates.width = Math.max(minSize, elementStart.width - dx);
        updates.height = Math.max(minSize, elementStart.height + dy);
      } else if (resizeHandle === 'ne') {
        updates.y = elementStart.y + dy;
        updates.width = Math.max(minSize, elementStart.width + dx);
        updates.height = Math.max(minSize, elementStart.height - dy);
      } else if (resizeHandle === 'nw') {
        updates.x = elementStart.x + dx;
        updates.y = elementStart.y + dy;
        updates.width = Math.max(minSize, elementStart.width - dx);
        updates.height = Math.max(minSize, elementStart.height - dy);
      }
      
      onUpdate?.(element.id, updates);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleSaveUrl = () => {
    if (url.trim()) {
      onUpdate?.(element.id, { src: url.trim() });
      setIsEditing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInteractive(!isInteractive);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        border: isSelected ? `2px solid ${element.color}` : `1px solid ${element.color}`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 1000 : 1,
        pointerEvents: 'auto',
        willChange: 'transform',
        backfaceVisibility: 'hidden' as const
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing && (
        <div 
          className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 w-full px-4">
            <ExternalLink className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveUrl();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              placeholder="Enter URL..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              autoFocus
            />
          </div>
          <p className="text-xs text-amber-600 px-4 text-center">
            注意：Google、Facebook、Twitter 等网站禁止在 iframe 中嵌入
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {isSelected && !isEditing && !isInteractive && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-600 transition-colors flex items-center gap-1 shadow-lg"
          >
            <ExternalLink className="w-3 h-3" />
            Edit URL
          </button>
          
          <div 
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-nw-resize hover:bg-blue-600 hover:scale-125 transition-all"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          />
          <div 
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-ne-resize hover:bg-blue-600 hover:scale-125 transition-all"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          />
          <div 
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 rounded-full cursor-sw-resize hover:bg-blue-600 hover:scale-125 transition-all"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          />
          <div 
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-se-resize hover:bg-blue-600 hover:scale-125 transition-all"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          />
        </>
      )}
      
      {isInteractive && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
          <span>双击退出交互模式</span>
        </div>
      )}
      
      {loadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-600 p-4 text-center">
          <X className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm font-medium mb-1">无法加载此页面</p>
          <p className="text-xs text-gray-500 mb-3">该网站禁止在 iframe 中嵌入</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
          >
            更换 URL
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: isInteractive ? 'none' : 'auto',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(element);
            }}
          />
          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: isInteractive ? 'auto' : 'none'
            }}
            title="Iframe Component"
            onError={() => setLoadError(true)}
          />
        </div>
      )}
    </div>
  );
};

elementRegistry.register({
  type: 'iframe',
  name: 'Iframe',
  isCanvasBased: false,
  Component: IframeComponent,
  defaultConfig: {
    width: 400,
    height: 300,
    src: 'https://www.example.com'
  }
});

export { IframeComponent };
