import React, { useState } from 'react';
import { useStore } from '../store';
import { ToolType } from '../types';
import { ShapeRegistry } from '../utils/shapes';

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  title: string;
}

function ToolButton({ tool, icon, title }: ToolButtonProps) {
  const { state, dispatch } = useStore();
  const isActive = state.tool === tool;

  return (
    <button
      className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
        isActive ? 'bg-[#6965db] text-white' : 'hover:bg-gray-100'
      }`}
      onClick={() => dispatch({ type: 'SET_TOOL', payload: tool })}
      title={title}
    >
      {icon}
    </button>
  );
}

export default function Toolbar() {
  const { state, dispatch } = useStore();
  const [showCustomShapes, setShowCustomShapes] = useState(false);

  const tools: { tool: ToolType; icon: React.ReactNode; title: string }[] = [
    {
      tool: 'select',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </svg>
      ),
      title: '选择 (V)'
    },
    {
      tool: 'rectangle',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
      ),
      title: '矩形 (R)'
    },
    {
      tool: 'ellipse',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="10" ry="8"/>
        </svg>
      ),
      title: '椭圆 (O)'
    },
    {
      tool: 'diamond',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l10 10-10 10L2 12z"/>
        </svg>
      ),
      title: '菱形 (D)'
    },
    {
      tool: 'arrow',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      ),
      title: '箭头 (A)'
    },
    {
      tool: 'line',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="19" x2="19" y2="5"/>
        </svg>
      ),
      title: '直线 (L)'
    },
    {
      tool: 'freedraw',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        </svg>
      ),
      title: '自由绘制 (P)'
    },
    {
      tool: 'text',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      ),
      title: '文本 (T)'
    }
  ];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-white rounded-xl shadow-lg z-50">
      <button
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
          state.toolLocked ? 'bg-[#6965db] text-white' : 'hover:bg-gray-100'
        }`}
        onClick={() => dispatch({ type: 'SET_TOOL_LOCKED', payload: !state.toolLocked })}
        title={state.toolLocked ? '解锁工具' : '锁定工具'}
      >
        {state.toolLocked ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
        )}
      </button>

      <div className="w-px h-7 bg-gray-200 mx-1" />

      {tools.map(({ tool, icon, title }) => (
        <ToolButton key={tool} tool={tool} icon={icon} title={title} />
      ))}

      <div className="w-px h-7 bg-gray-200 mx-1" />

      <div className="relative">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          onClick={() => setShowCustomShapes(!showCustomShapes)}
          title="自定义图形"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>

        {showCustomShapes && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg py-1 min-w-[140px]">
            {ShapeRegistry.getAll().map(([type, config]) => (
              <button
                key={type}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  state.tool === type ? 'bg-purple-50 text-[#6965db]' : ''
                }`}
                onClick={() => {
                  dispatch({ type: 'SET_TOOL', payload: type as ToolType });
                  setShowCustomShapes(false);
                }}
              >
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
