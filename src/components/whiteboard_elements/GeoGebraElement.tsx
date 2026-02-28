import React, { useEffect, useRef, useState } from 'react';
import { ElementComponentProps, ElementDefinition } from './BaseElement';
import { elementRegistry } from './ElementRegistry';

interface GeoGebraComponentProps extends ElementComponentProps {
  onUpdate?: (id: string, updates: Partial<any>) => void;
}

const GeoGebraComponent: React.FC<GeoGebraComponentProps> = ({ element, isSelected, onSelect, onUpdate, zoom = 1 }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ggbAppRef = useRef<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: element.x, y: element.y, width: element.width, height: element.height });
  const [isInteractive, setIsInteractive] = useState(false);
  const isLoadedRef = useRef(false);
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && containerRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true;
      const loadGeoGebra = () => {
        const GGBApplet = (window as any).GGBApplet;
        if (GGBApplet) {
          let appName = element.type || 'geometry';
          let enable3D = appName === '3d';
          
          const params: any = {
            appName: appName,
            width: element.width,
            height: element.height,
            showToolBar: false,
            showAlgebraInput: false,
            showMenuBar: false,
            enableShiftDragZoom: true,
            borderColor: "#FFFFFF",         // 无边框
            enableRightClick: false,
            showResetIcon: false,
            enableLabelDrags: true,
            enableCAS: false,
            enable3D: enable3D,
            useBrowserForJS: false,
            
            "appletOnLoad": (api: any) => {
                
                api.evalCommand('SetPerspective("-A")');
            }
          };
          
          const applet = new GGBApplet(params, true);
          applet.inject(containerRef.current);
          ggbAppRef.current = applet;
          isLoadedRef.current = true;
          
          console.log('GeoGebra command:', element.geogebraCommand);
          if (element.geogebraCommand) {
            setTimeout(() => {
              if (ggbAppRef.current) {
                try {
                  const ggbApplet = ggbAppRef.current.getAppletObject();
                  if (ggbApplet && typeof ggbApplet.evalCommand === 'function') {
                    const commands = element.geogebraCommand.split('\n').filter(cmd => cmd.trim());
                    commands.forEach((command, index) => {
                      setTimeout(() => {
                        try {
                          ggbApplet.evalCommand(command.trim());
                        } catch (error) {
                          console.error(`Error executing GeoGebra command at line ${index + 1}:`, error);
                        }
                      }, index * 100);
                    });
                  } else {
                    console.error('GeoGebra applet not ready or evalCommand not available');
                  }
                } catch (error) {
                  console.error('Error executing GeoGebra commands:', error);
                }
              }
            }, 1000);
          }
        }
      };

      if ((window as any).ggbApplet) {
        loadGeoGebra();
      } else {
        const script = document.createElement('script');
        script.src = 'https://www.geogebra.org/apps/deployggb.js';
        script.onload = loadGeoGebra;
        document.head.appendChild(script);
      }
      
      return () => {
        isInitializedRef.current = false;
        isLoadedRef.current = false;
      };
    }
  }, [element.appName]);

  useEffect(() => {
    if (isLoadedRef.current && ggbAppRef.current && element.geogebraCommand) {
      console.log('Executing GeoGebra commands:', element.geogebraCommand);
      try {
        const ggbApplet = ggbAppRef.current.getAppletObject();
        if (ggbApplet && typeof ggbApplet.evalCommand === 'function') {
          const commands = element.geogebraCommand.split('\n').filter(cmd => cmd.trim());
          commands.forEach((command, index) => {
            setTimeout(() => {
              try {
                ggbApplet.evalCommand(command.trim());
              } catch (error) {
                console.error(`Error executing GeoGebra command at line ${index + 1}:`, error);
              }
            }, index * 100);
          });
        } else {
          console.error('GeoGebra applet not ready or evalCommand not available');
        }
      } catch (error) {
        console.error('Error executing GeoGebra commands:', error);
      }
    }
  }, [element.geogebraCommand]);

  useEffect(() => {
    if (isLoadedRef.current && ggbAppRef.current) {
      try {
        const ggbApplet = ggbAppRef.current.getAppletObject();
        if (ggbApplet && typeof ggbApplet.setSize === 'function') {
          ggbApplet.setSize(element.width, element.height);
        }
      } catch (error) {
        console.error('Error resizing GeoGebra:', error);
      }
    }
  }, [element.width, element.height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSelected || isInteractive) return;
    e.stopPropagation();
    
    const rect = outerRef.current?.getBoundingClientRect();
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
      const minSize = 200;
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

  return (
    <div
      ref={outerRef}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        // border: isSelected ? `2px solid ${element.color}` : `1px solid ${element.color}`,
        borderRadius: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isSelected ? 1000 : 1,
        pointerEvents: 'auto',
        overflow: 'hidden',
        backgroundColor: '#fff',
        willChange: 'transform',
        backfaceVisibility: 'hidden' as const
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsInteractive(!isInteractive);
      }}
      onKeyDown={(e) => {
        if (!isInteractive) {
          e.stopPropagation();
        }
      }}
    >
      {isSelected && !isInteractive && (
        <>
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
      
      <div
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
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
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: isInteractive ? 'auto' : 'none'
          }}
        />
      </div>
    </div>
  );
};

elementRegistry.register({
  type: 'geogebra',
  name: 'GeoGebra',
  isCanvasBased: false,
  Component: GeoGebraComponent,
  defaultConfig: {
    width: 600,
    height: 450
  }
});

export { GeoGebraComponent };
