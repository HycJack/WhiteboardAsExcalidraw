import React from 'react';
import { useStore } from '../store';

const COLORS = [
  '#1e1e1e', '#e03131', '#2f9e44', '#1971c2',
  '#f08c00', '#9c36b5', '#006d75', '#ffffff', 'transparent'
];

const FILL_COLORS = [
  'transparent', '#1e1e1e', '#e03131', '#2f9e44',
  '#1971c2', '#f08c00', '#9c36b5', '#006d75', '#ffffff'
];

const STROKE_WIDTHS = [2, 4, 6];
const STROKE_STYLES = ['solid', 'dashed', 'dotted'] as const;
const FILL_STYLES = ['none', 'hachure', 'solid', 'zigzag', 'cross-hatch'] as const;

export default function PropertiesPanel() {
  const { state, dispatch } = useStore();

  const selectedElement = state.selectedElements.length > 0
    ? state.elements.find(el => el.id === state.selectedElements[0])
    : null;

  if (!selectedElement) return null;

  const updateProperty = (property: string, value: any) => {
    state.selectedElements.forEach(id => {
      dispatch({
        type: 'UPDATE_ELEMENT',
        payload: { id, updates: { [property]: value } }
      });
    });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  return (
    <div className="fixed top-20 left-4 w-[260px] max-h-[calc(100vh-160px)] overflow-y-auto bg-white rounded-xl shadow-lg p-4 z-50">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">属性</div>

      {/* Stroke Color */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">线条颜色</span>
        <div className="grid grid-cols-5 gap-1.5">
          {COLORS.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded-md border-2 transition-all ${
                selectedElement.color === color ? 'border-[#6965db] shadow-lg' : 'border-transparent'
              }`}
              style={{
                background: color === 'transparent'
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : color,
                backgroundSize: '8px 8px'
              }}
              onClick={() => updateProperty('color', color)}
            />
          ))}
        </div>
      </div>

      {/* Fill Color */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">填充颜色</span>
        <div className="grid grid-cols-5 gap-1.5">
          {FILL_COLORS.map(color => (
            <button
              key={color}
              className={`w-8 h-8 rounded-md border-2 transition-all ${
                (selectedElement.fill || 'transparent') === color ? 'border-[#6965db] shadow-lg' : 'border-transparent'
              }`}
              style={{
                background: color === 'transparent'
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : color,
                backgroundSize: '8px 8px'
              }}
              onClick={() => updateProperty('fill', color)}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">线条粗细</span>
        <div className="flex gap-1.5">
          {STROKE_WIDTHS.map(width => (
            <button
              key={width}
              className={`flex-1 py-2 text-xs rounded-md border transition-all ${
                selectedElement.strokeWidth === width
                  ? 'border-[#6965db] bg-purple-50 text-[#6965db]'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => updateProperty('strokeWidth', width)}
            >
              {width === 2 ? '细' : width === 4 ? '中' : '粗'}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Style */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">线条样式</span>
        <div className="flex gap-1.5">
          {STROKE_STYLES.map(style => (
            <button
              key={style}
              className={`flex-1 py-1.5 px-2 text-xs rounded-md border transition-all flex items-center justify-center ${
                (selectedElement.strokeStyle || 'solid') === style
                  ? 'border-[#6965db] bg-purple-50 text-[#6965db]'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => updateProperty('strokeStyle', style)}
            >
              {style === 'solid' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
              )}
              {style === 'dashed' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="7" y2="12"/>
                  <line x1="11" y1="12" x2="15" y2="12"/>
                  <line x1="19" y1="12" x2="21" y2="12"/>
                </svg>
              )}
              {style === 'dotted' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fill Style */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">填充样式</span>
        <div className="flex flex-wrap gap-1">
          {FILL_STYLES.map(style => (
            <button
              key={style}
              className={`py-1 px-2 text-xs rounded-md border transition-all ${
                (selectedElement.fillStyle || 'none') === style
                  ? 'border-[#6965db] bg-purple-50 text-[#6965db]'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => updateProperty('fillStyle', style)}
            >
              {style === 'none' ? '无' : style === 'hachure' ? '影线' : style === 'solid' ? '纯色' : style === 'zigzag' ? '锯齿' : '网格'}
            </button>
          ))}
        </div>
      </div>

      {/* Roughness */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">粗糙度</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="3"
            step="0.5"
            value={selectedElement.roughness || 1.5}
            onChange={(e) => updateProperty('roughness', parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs w-8 text-right">{selectedElement.roughness || 1.5}</span>
        </div>
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 block mb-2">不透明度</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={selectedElement.opacity || 100}
            onChange={(e) => updateProperty('opacity', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs w-8 text-right">{selectedElement.opacity || 100}%</span>
        </div>
      </div>
    </div>
  );
}
