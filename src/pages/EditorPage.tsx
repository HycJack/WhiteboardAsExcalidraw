import { useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { StoreProvider, useStore } from '../store';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import PropertiesPanel from '../components/PropertiesPanel';
import BottomControls from '../components/BottomControls';
import { Project } from '../types/project';

function EditorContent() {
  const { state, dispatch } = useStore();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const isLoadedRef = useRef(false);
  const lastSavedElementsRef = useRef<string | null>(null);

  useEffect(() => {
    if (projectId && !isLoadedRef.current) {
      isLoadedRef.current = true;
      const savedProjects = localStorage.getItem('excalidraw-projects');
      if (savedProjects) {
        const projects: Project[] = JSON.parse(savedProjects);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          dispatch({ type: 'SET_ELEMENTS', payload: project.elements });
          lastSavedElementsRef.current = JSON.stringify(project.elements);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }
  }, [projectId, dispatch, navigate]);

  const saveProject = useCallback(() => {
    if (!projectId || lastSavedElementsRef.current === null) return;
    
    const elementsStr = JSON.stringify(state.elements);
    if (elementsStr === lastSavedElementsRef.current) return;
    
    lastSavedElementsRef.current = elementsStr;
    
    const savedProjects = localStorage.getItem('excalidraw-projects');
    if (savedProjects) {
      const projects: Project[] = JSON.parse(savedProjects);
      const projectIndex = projects.findIndex(p => p.id === projectId);
      if (projectIndex !== -1) {
        projects[projectIndex] = {
          ...projects[projectIndex],
          elements: state.elements,
          updatedAt: Date.now(),
        };
        localStorage.setItem('excalidraw-projects', JSON.stringify(projects));
      }
    }
  }, [projectId, state.elements]);

  useEffect(() => {
    if (isLoadedRef.current && lastSavedElementsRef.current !== null) {
      saveProject();
    }
  }, [state.elements, saveProject]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProject();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProject();
    };
  }, [saveProject]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      {/* Back Button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-[60] flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-gray-50"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">返回</span>
      </Link>

      <Canvas />
      <Toolbar />
      <PropertiesPanel />
      <BottomControls />
    </div>
  );
}

export default function EditorPage() {
  return (
    <StoreProvider>
      <EditorContent />
    </StoreProvider>
  );
}
