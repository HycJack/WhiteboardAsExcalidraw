import { useEffect } from 'react';
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

  useEffect(() => {
    if (projectId) {
      const savedProjects = localStorage.getItem('excalidraw-projects');
      if (savedProjects) {
        const projects: Project[] = JSON.parse(savedProjects);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          dispatch({ type: 'SET_ELEMENTS', payload: project.elements });
        } else {
          navigate('/');
        }
      }
    }
  }, [projectId, dispatch, navigate]);

  useEffect(() => {
    const saveProject = () => {
      if (projectId && state.elements) {
        const savedProjects = localStorage.getItem('excalidraw-projects');
        if (savedProjects) {
          const projects: Project[] = JSON.parse(savedProjects);
          const updatedProjects = projects.map(p =>
            p.id === projectId
              ? { ...p, elements: state.elements, updatedAt: Date.now() }
              : p
          );
          localStorage.setItem('excalidraw-projects', JSON.stringify(updatedProjects));
        }
      }
    };

    const interval = setInterval(saveProject, 5000);
    return () => {
      clearInterval(interval);
      saveProject();
    };
  }, [state.elements, projectId]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      {/* Back Button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-[60] flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-gray-50"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">返回首页</span>
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
