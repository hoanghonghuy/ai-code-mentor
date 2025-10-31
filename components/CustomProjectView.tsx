import React from 'react';
import type { CustomProject } from '../types';
import { FolderIcon, PlusIcon, MoreVerticalIcon, PencilIcon, TrashIcon } from './icons';
import { useTranslation } from 'react-i18next';

interface CustomProjectViewProps {
  projects: CustomProject[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: CustomProject) => void;
  onDeleteProject: (project: CustomProject) => void;
  isLoading: boolean;
}

const CustomProjectView: React.FC<CustomProjectViewProps> = ({ projects, activeProjectId, onSelectProject, onNewProject, onEditProject, onDeleteProject, isLoading }) => {
  const { t } = useTranslation();
  const [menuOpenFor, setMenuOpenFor] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        {projects.length > 0 ? (
          <ul className="space-y-2">
            {projects.map(project => (
              <li key={project.id} className="relative group">
                <button
                  onClick={() => onSelectProject(project.id)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 pr-10 text-sm rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeProjectId === project.id
                      ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-primary-500/10'
                  }`}
                >
                  <FolderIcon className="w-5 h-5 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.goal}</p>
                  </div>
                </button>
                <div className="absolute top-1/2 -translate-y-1/2 right-2">
                   <div className="relative">
                        <button 
                            onClick={() => setMenuOpenFor(menuOpenFor === project.id ? null : project.id)}
                            className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <MoreVerticalIcon className="w-4 h-4" />
                        </button>
                        {menuOpenFor === project.id && (
                             <div 
                                className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-10"
                                onMouseLeave={() => setMenuOpenFor(null)}
                            >
                                <button
                                    onClick={() => { onEditProject(project); setMenuOpenFor(null); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" />
                                    {t('customProjects.edit')}
                                </button>
                                <button
                                    onClick={() => { onDeleteProject(project); setMenuOpenFor(null); }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                    {t('customProjects.delete')}
                                </button>
                            </div>
                        )}
                   </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <p>{t('customProjects.noProjects')}</p>
            <p className="text-sm">{t('customProjects.noProjectsHint')}</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewProject}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 p-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{t('customProjects.newProject')}</span>
        </button>
      </div>
    </div>
  );
};

export default CustomProjectView;