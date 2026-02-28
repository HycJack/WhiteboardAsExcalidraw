import { CanvasRendererProps, ElementDefinition } from './BaseElement';
import { elementRegistry } from './ElementRegistry';
import TextElementComponent from './TextElementComponent';

const renderText: ElementDefinition['renderToCanvas'] = ({ ctx, element, zoom }) => {
  if (!element.text) return;

  const fontSize = 20 * zoom;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = element.color;
  ctx.textBaseline = 'top';

  const text = element.text;
  const x = element.x;
  const y = element.y;

  ctx.fillText(text, x, y);
};

elementRegistry.register({
  type: 'text',
  name: 'Text',
  isCanvasBased: false,
  Component: TextElementComponent,
  renderToCanvas: renderText
});

export { renderText };
