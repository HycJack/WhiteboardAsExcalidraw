import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { DrawElement } from '../types';

interface TextElementProps {
  element: DrawElement;
  isSelected: boolean;
  onSelect: (element: DrawElement | null) => void;
  onUpdate: (id: string, updates: Partial<DrawElement>) => void;
  onEdit?: (id: string) => void;
}

const TextElement: React.FC<TextElementProps> = ({ element, isSelected, onSelect, onUpdate, onEdit }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  const fixLatexFormat = (content: string): string => {
    let fixed = content;
    
    fixed = fixed.replace(/\\rac\{/g, '\\frac{');
    fixed = fixed.replace(/\\frac\{/g, '\\frac{');
    fixed = fixed.replace(/\\sqrt\{/g, '\\sqrt{');
    fixed = fixed.replace(/\\pi/g, '\\pi');
    
    fixed = fixed.replace(/rac\{/g, '\\frac{');
    fixed = fixed.replace(/sqrt\{/g, '\\sqrt{');
    fixed = fixed.replace(/\bpi\b/g, '\\pi');
    
    fixed = fixed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
    fixed = fixed.replace(/\\sqrt\{([^}]+)\}/g, '\\sqrt{$1}');
    
    fixed = fixed.replace(/\\\\frac/g, '\\frac');
    fixed = fixed.replace(/\\\\sqrt/g, '\\sqrt');
    fixed = fixed.replace(/\\\\pi/g, '\\pi');
    
    fixed = fixed.replace(/\\frac\s*\{/g, '\\frac{');
    fixed = fixed.replace(/\\sqrt\s*\{/g, '\\sqrt{');
    
    fixed = fixed.replace(/\$\\frac\{([^$]+)\}\{([^$]+)\}\$/g, '$\\frac{$1}{$2}$');
    fixed = fixed.replace(/\$\\sqrt\{([^$]+)\}\$/g, '$\\sqrt{$1}$');
    
    return fixed;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(element.id);
    } else {
      const newText = prompt('编辑文本:', element.text || '');
      if (newText !== null) {
        onUpdate(element.id, { text: newText });
      }
    }
  };

  const renderTextContent = (text: string) => {
    if (!text) return null;
    
    const fixedText = fixLatexFormat(text);
    const lines = fixedText.split('\n');
    return lines.map((line, index) => (
      <React.Fragment key={index}>
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { 
            throwOnError: false,
            strict: false,
            displayMode: false,
            output: 'html',
            macros: {
              "\\f": "#1f(#2)"
            }
          }]]}
          components={{
            p: ({ children }) => <span style={{ display: 'inline' }}>{children}</span>,
          }}
        >
          {line}
        </ReactMarkdown>
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div
      ref={elementRef}
      className={`absolute inline-block cursor-move select-none ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      style={{
        left: element.x,
        top: element.y,
        color: element.color,
        fontSize: '20px',
        userSelect: 'none',
        padding: '4px 8px',
        minWidth: '50px',
        minHeight: '24px',
        backgroundColor: 'transparent',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderTextContent(element.text || '')}
    </div>
  );
};

export default TextElement;
