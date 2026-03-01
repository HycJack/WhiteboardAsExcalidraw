import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { AppState, Element, ToolType, StrokeStyle, FillStyle } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);
const generateSeed = () => Math.floor(Math.random() * 2147483647);

const initialState: AppState = {
  tool: 'select',
  elements: [],
  selectedElements: [],
  currentColor: '#1e1e1e',
  currentFill: 'transparent',
  strokeWidth: 4,
  strokeStyle: 'solid',
  fillStyle: 'none',
  roughness: 1.5,
  opacity: 100,
  zoom: 1,
  panX: 0,
  panY: 0,
  isDrawing: false,
  isPanning: false,
  isSpacePressed: false,
  toolLocked: false,
  history: [[]],
  historyIndex: 0,
  shouldFocusContent: false,
};

type Action =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_ELEMENTS'; payload: Element[] }
  | { type: 'ADD_ELEMENT'; payload: Element }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<Element> } }
  | { type: 'DELETE_ELEMENTS'; payload: string[] }
  | { type: 'SELECT_ELEMENTS'; payload: string[] }
  | { type: 'SET_CURRENT_COLOR'; payload: string }
  | { type: 'SET_CURRENT_FILL'; payload: string }
  | { type: 'SET_STROKE_WIDTH'; payload: number }
  | { type: 'SET_STROKE_STYLE'; payload: StrokeStyle }
  | { type: 'SET_FILL_STYLE'; payload: FillStyle }
  | { type: 'SET_ROUGHNESS'; payload: number }
  | { type: 'SET_OPACITY'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_IS_DRAWING'; payload: boolean }
  | { type: 'SET_IS_PANNING'; payload: boolean }
  | { type: 'SET_IS_SPACE_PRESSED'; payload: boolean }
  | { type: 'SET_TOOL_LOCKED'; payload: boolean }
  | { type: 'SET_SHOULD_FOCUS_CONTENT'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_HISTORY' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, tool: action.payload, selectedElements: [] };

    case 'SET_ELEMENTS':
      return { ...state, elements: action.payload };

    case 'ADD_ELEMENT':
      return { ...state, elements: [...state.elements, action.payload] };

    case 'UPDATE_ELEMENT':
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
        ),
      };

    case 'DELETE_ELEMENTS':
      return {
        ...state,
        elements: state.elements.filter((el) => !action.payload.includes(el.id)),
        selectedElements: [],
      };

    case 'SELECT_ELEMENTS':
      return { ...state, selectedElements: action.payload };

    case 'SET_CURRENT_COLOR':
      return { ...state, currentColor: action.payload };

    case 'SET_CURRENT_FILL':
      return { ...state, currentFill: action.payload };

    case 'SET_STROKE_WIDTH':
      return { ...state, strokeWidth: action.payload };

    case 'SET_STROKE_STYLE':
      return { ...state, strokeStyle: action.payload };

    case 'SET_FILL_STYLE':
      return { ...state, fillStyle: action.payload };

    case 'SET_ROUGHNESS':
      return { ...state, roughness: action.payload };

    case 'SET_OPACITY':
      return { ...state, opacity: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };

    case 'SET_PAN':
      return { ...state, panX: action.payload.x, panY: action.payload.y };

    case 'SET_IS_DRAWING':
      return { ...state, isDrawing: action.payload };

    case 'SET_IS_PANNING':
      return { ...state, isPanning: action.payload };

    case 'SET_IS_SPACE_PRESSED':
      return { ...state, isSpacePressed: action.payload };

    case 'SET_TOOL_LOCKED':
      return { ...state, toolLocked: action.payload };

    case 'SET_SHOULD_FOCUS_CONTENT':
      return { ...state, shouldFocusContent: action.payload };

    case 'UNDO':
      if (state.historyIndex <= 0) return state;
      return {
        ...state,
        historyIndex: state.historyIndex - 1,
        elements: state.history[state.historyIndex - 1],
        selectedElements: [],
      };

    case 'REDO':
      if (state.historyIndex >= state.history.length - 1) return state;
      return {
        ...state,
        historyIndex: state.historyIndex + 1,
        elements: state.history[state.historyIndex + 1],
        selectedElements: [],
      };

    case 'SAVE_HISTORY': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.elements]);
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    default:
      return state;
  }
}

interface StoreContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  generateId: () => string;
  generateSeed: () => number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StoreContext.Provider value={{ state, dispatch, generateId, generateSeed }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
