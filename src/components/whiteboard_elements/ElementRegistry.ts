import { ElementDefinition } from './BaseElement';

class ElementRegistry {
  private elements: Map<string, ElementDefinition> = new Map();

  register(definition: ElementDefinition) {
    this.elements.set(definition.type, definition);
  }

  get(type: string): ElementDefinition | undefined {
    return this.elements.get(type);
  }

  getAll(): ElementDefinition[] {
    return Array.from(this.elements.values());
  }

  getCanvasElements(): ElementDefinition[] {
    return this.getAll().filter(el => el.isCanvasBased);
  }

  getDOMElements(): ElementDefinition[] {
    return this.getAll().filter(el => !el.isCanvasBased);
  }
}

export const elementRegistry = new ElementRegistry();
