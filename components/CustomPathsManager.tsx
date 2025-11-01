import React from 'react';
import type { LearningPath } from '../types';
import { TrashIcon } from './icons';

interface Props {
  customLearningPaths: LearningPath[];
  activePathId: string;
  onSelectPath: (id: string) => void;
  onDeletePath: (id: string) => void;
  onConfirmDelete: (path: LearningPath) => void;
}

const CustomPathsManager: React.FC<Props> = ({ customLearningPaths, activePathId, onSelectPath, onDeletePath, onConfirmDelete }) => {
  if (!customLearningPaths?.length) return null;

  return (
    <div className="mt-3 p-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs uppercase text-gray-500 mb-2">Your Custom Paths</div>
      <div className="space-y-2">
        {customLearningPaths.map(p => (
          <div key={p.id} className="flex items-center justify-between gap-2">
            <button
              className={`flex-1 text-left px-3 py-2 rounded ${p.id === activePathId ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => onSelectPath(p.id)}
              title={p.title}
            >
              <span className="truncate block">{p.title}</span>
            </button>
            <button
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              onClick={() => onConfirmDelete(p)}
              aria-label="Delete custom path"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomPathsManager;
