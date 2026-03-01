import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Home, Folder, User, Settings, Trash2 } from 'lucide-react';
import { Project } from '../types/project';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    const savedProjects = localStorage.getItem('excalidraw-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  const createNewProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Untitled-${Date.now().toString().slice(-5)}`,
      elements: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updatedProjects = [newProject, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem('excalidraw-projects', JSON.stringify(updatedProjects));
    navigate(`/editor/${newProject.id}`);
  };

  const openProject = (projectId: string) => {
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      const updatedProjects = projects.filter(p => p.id !== projectToDelete);
      setProjects(updatedProjects);
      localStorage.setItem('excalidraw-projects', JSON.stringify(updatedProjects));
      setProjectToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
    setDeleteDialogOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-14 bg-white shadow-sm flex flex-col items-center py-4 z-50">
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 mb-4">
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 mb-2">
          <Home className="w-5 h-5 text-gray-600" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 mb-2">
          <Folder className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1" />
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 mb-2">
          <User className="w-5 h-5 text-gray-600" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="ml-14 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">项目列表</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">导入项目</span>
            </button>
            <button
              onClick={createNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">新建项目</span>
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* New Project Card */}
          <button
            onClick={createNewProject}
            className="aspect-[4/3] bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-gray-400 hover:bg-gray-50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">新建项目</span>
          </button>

          {/* Project Cards */}
          {projects.map((project) => {
            // Calculate bounding box and transform for auto-focus
            let viewBox = "0 0 400 300";
            let transform = "";
            
            if (project.elements.length > 0) {
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              let hasValidElement = false;

              for (const element of project.elements) {
                const x1 = Math.min(element.x1, element.x2);
                const y1 = Math.min(element.y1, element.y2);
                const x2 = Math.max(element.x1, element.x2);
                const y2 = Math.max(element.y1, element.y2);

                if (element.points && element.points.length > 0) {
                  for (const point of element.points) {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                  }
                  hasValidElement = true;
                } else if (x2 - x1 > 0 || y2 - y1 > 0) {
                  minX = Math.min(minX, x1);
                  minY = Math.min(minY, y1);
                  maxX = Math.max(maxX, x2);
                  maxY = Math.max(maxY, y2);
                  hasValidElement = true;
                }
              }

              if (hasValidElement && isFinite(minX)) {
                const padding = 50;
                minX -= padding;
                minY -= padding;
                maxX += padding;
                maxY += padding;

                const contentWidth = maxX - minX;
                const contentHeight = maxY - minY;
                const cardWidth = 400;
                const cardHeight = 300;

                // Calculate zoom to fit content
                const zoomX = cardWidth / contentWidth;
                const zoomY = cardHeight / contentHeight;
                const zoom = Math.min(zoomX, zoomY, 1);

                // Calculate pan to center content
                const panX = (cardWidth - contentWidth * zoom) / 2 - minX * zoom;
                const panY = (cardHeight - contentHeight * zoom) / 2 - minY * zoom;

                viewBox = `0 0 ${cardWidth} ${cardHeight}`;
                transform = `translate(${panX}, ${panY}) scale(${zoom})`;
              }
            }

            return (
              <div
                key={project.id}
                className="aspect-[4/3] bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all text-left group relative"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteClick(e, project.id)}
                  className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="删除项目"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Card Content */}
                <button
                  onClick={() => openProject(project.id)}
                  className="w-full h-full flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="h-2/3 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                    {project.elements.length > 0 ? (
                      <div className="w-full h-full p-4">
                        <svg
                          viewBox={viewBox}
                          className="w-full h-full"
                          style={{ opacity: 0.6 }}
                        >
                          <g transform={transform}>
                            {project.elements.slice(0, 10).map((el, idx) => (
                              <rect
                                key={idx}
                                x={Math.min(el.x1, el.x2)}
                                y={Math.min(el.y1, el.y2)}
                                width={Math.abs(el.x2 - el.x1)}
                                height={Math.abs(el.y2 - el.y1)}
                                fill={el.fill !== 'transparent' ? el.fill : 'none'}
                                stroke={el.color}
                                strokeWidth={1}
                                rx={el.type === 'rectangle' ? 4 : 0}
                              />
                            ))}
                          </g>
                        </svg>
                      </div>
                    ) : (
                      <div className="text-gray-300">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="h-1/3 p-3 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-800 truncate mb-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        更新于 {formatDate(project.updatedAt)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                        EXCALIDRAW
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">还没有项目</p>
            <button
              onClick={createNewProject}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              创建第一个项目 →
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="删除项目"
        message="确定要删除这个项目吗？此操作无法撤销。"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
