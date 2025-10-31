import React from 'react';
import type { CustomProject } from '../types';
import { FolderIcon, PlusIcon } from './icons';
import { useTranslation } from 'react-i18next';

interface CustomProjectViewProps {
  projects: CustomProject[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}

const CustomProjectView: React.FC<CustomProjectViewProps> = ({ projects, activeProjectId, onSelectProject, onNewProject }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex-1 overflow-y-auto">
        {projects.length > 0 ? (
          <ul className="space-y-2">
            {projects.map(project => (
              <li key={project.id}>
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full text-left p-3 text-sm rounded-lg transition-colors flex items-center gap-3 ${
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
          className="w-full flex items-center justify-center gap-2 p-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{t('customProjects.newProject')}</span>
        </button>
      </div>
    </div>
  );
};

export default CustomProjectView;