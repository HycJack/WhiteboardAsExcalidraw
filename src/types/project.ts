import { Element } from './index';

export interface Project {
  id: string;
  name: string;
  elements: Element[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectState {
  projects: Project[];
  currentProjectId: string | null;
}
