import React from 'react';
import { useStore } from '../store';

const COLORS = [
  '#1e1e1e', '#e03131', '#2f9e44', '#1971c2',
  '#f08c00', '#9c36b5', '#006d75', 'transparent'
];

const FILL_COLORS = [
  'transparent', '#1e1e1e', '#e03131', '#2f9e44',
  '#1971c2', '#f08c00', '#9c36b5', '#006d75'
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

  // 判断是否为嵌入类型（图片、网页、GeoGebra）
  const isEmbedType = ['image', 'webpage', 'geogebra'].includes(selectedElement.type);

  return (
    <div className="fixed top-20 left-4 w-[260px] max-h-[calc(100vh-160px)] overflow-y-auto bg-white rounded-xl shadow-lg p-4 z-50">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">属性</div>

      {/* 非嵌入类型显示常规属性 */}
      {!isEmbedType && (
        <>
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
                  onClick={() => {
                    const updates: any = { fill: color };
                    if (color !== 'transparent' && (selectedElement.fillStyle === 'none' || !selectedElement.fillStyle)) {
                      updates.fillStyle = 'hachure';
                    }
                    state.selectedElements.forEach(id => {
                      dispatch({
                        type: 'UPDATE_ELEMENT',
                        payload: { id, updates }
                      });
                    });
                    dispatch({ type: 'SAVE_HISTORY' });
                  }}
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
                  onClick={() => {
                    const updates: any = { fillStyle: style };
                    if (style === 'none') {
                      updates.fill = 'transparent';
                    } else if (!selectedElement.fill || selectedElement.fill === 'transparent') {
                      updates.fill = '#1e1e1e';
                    }
                    state.selectedElements.forEach(id => {
                      dispatch({
                        type: 'UPDATE_ELEMENT',
                        payload: { id, updates }
                      });
                    });
                    dispatch({ type: 'SAVE_HISTORY' });
                  }}
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
        </>
      )}

      {/* Opacity - 所有类型都显示 */}
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

      {/* Layer Operations - 所有类型都显示 */}
      <div className="mb-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500 block mb-2">图层</span>
        <div className="flex gap-2">
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const element = state.elements.find(el => el.id === selectedElement.id);
              if (element) {
                const newElements = state.elements.filter(el => el.id !== selectedElement.id);
                newElements.unshift(element);
                dispatch({ type: 'SET_ELEMENTS', payload: newElements });
                dispatch({ type: 'SAVE_HISTORY' });
              }
            }}
            title="置底"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v10M5 12l7 7 7-7"/>
              <line x1="4" y1="20" x2="20" y2="20"/>
            </svg>
          </button>
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const index = state.elements.findIndex(el => el.id === selectedElement.id);
              if (index > 0) {
                const newElements = [...state.elements];
                [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];
                dispatch({ type: 'SET_ELEMENTS', payload: newElements });
                dispatch({ type: 'SAVE_HISTORY' });
              }
            }}
            title="下移一层"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const index = state.elements.findIndex(el => el.id === selectedElement.id);
              if (index < state.elements.length - 1) {
                const newElements = [...state.elements];
                [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
                dispatch({ type: 'SET_ELEMENTS', payload: newElements });
                dispatch({ type: 'SAVE_HISTORY' });
              }
            }}
            title="上移一层"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const element = state.elements.find(el => el.id === selectedElement.id);
              if (element) {
                const newElements = state.elements.filter(el => el.id !== selectedElement.id);
                newElements.push(element);
                dispatch({ type: 'SET_ELEMENTS', payload: newElements });
                dispatch({ type: 'SAVE_HISTORY' });
              }
            }}
            title="置顶"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9V19M5 12l7-7 7 7"/>
              <line x1="4" y1="4" x2="20" y2="4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500 block mb-2">操作</span>
        <div className="flex gap-2">
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const element = state.elements.find(el => el.id === selectedElement.id);
              if (element) {
                const newElement = {
                  ...element,
                  id: Date.now().toString(),
                  x1: element.x1 + 20,
                  y1: element.y1 + 20,
                  x2: element.x2 + 20,
                  y2: element.y2 + 20,
                  seed: Math.floor(Math.random() * 2147483647)
                };
                dispatch({ type: 'ADD_ELEMENT', payload: newElement });
                dispatch({ type: 'SELECT_ELEMENTS', payload: [newElement.id] });
                dispatch({ type: 'SAVE_HISTORY' });
              }
            }}
            title="复制"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 transition-all flex items-center justify-center"
            onClick={() => {
              dispatch({ type: 'DELETE_ELEMENTS', payload: [selectedElement.id] });
              dispatch({ type: 'SAVE_HISTORY' });
            }}
            title="删除"
          >
            <svg className="w-4 h-4 text-gray-600 hover:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button
            className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center"
            onClick={() => {
              const currentLink = selectedElement.link || '';
              const newLink = prompt('请输入超链接地址:', currentLink);
              if (newLink !== null) {
                updateProperty('link', newLink);
              }
            }}
            title="添加超链接"
          >
            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
