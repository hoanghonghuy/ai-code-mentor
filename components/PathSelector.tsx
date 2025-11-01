import React, { useState, useRef, useEffect } from 'react';
import type { LearningPath } from '../types';
import { ChevronDownIcon, MapIcon, TrashIcon, CheckIcon } from './icons';
import { useTranslation } from 'react-i18next';

interface PathSelectorProps {
  allPaths: LearningPath[];
  customLearningPaths: LearningPath[];
  activePathId: string;
  onSelectPath: (pathId: string) => void;
  onNewPath: () => void;
  onDeletePath: (path: LearningPath) => void;
  isLoading: boolean;
}

const PathSelector: React.FC<PathSelectorProps> = ({
  allPaths,
  customLearningPaths,
  activePathId,
  onSelectPath,
  onNewPath,
  onDeletePath,
  isLoading
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Find current path
  const currentPath = [...allPaths, ...customLearningPaths].find(p => p.id === activePathId);
  const isCurrentPathCustom = customLearningPaths.some(p => p.id === activePathId);
  const currentCustomPath = customLearningPaths.find(p => p.id === activePathId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPath = (pathId: string) => {
    onSelectPath(pathId);
    setIsOpen(false);
  };

  const handleNewPath = () => {
    onNewPath();
    setIsOpen(false);
  };

  const handleDeletePath = (path: LearningPath, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePath(path);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Path Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <MapIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {currentPath?.title || t('sidebar.selectPath')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isCurrentPathCustom ? t('sidebar.yourPaths') : t('sidebar.standardPaths')}
            </p>
          </div>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-30 max-h-80 overflow-hidden">
          <div className="p-2">
            {/* New Path Button */}
            <button
              onClick={handleNewPath}
              disabled={isLoading}
              className="w-full flex items-center gap-3 p-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MapIcon className="w-5 h-5 flex-shrink-0" />
              <span>{t('sidebar.newPath')}</span>
            </button>
            
            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-600 my-2" />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {/* Standard Paths Section */}
            <div className="px-2 pb-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('sidebar.standardPaths')}
              </div>
              <div className="space-y-1">
                {allPaths.map(path => (
                  <button
                    key={path.id}
                    onClick={() => handleSelectPath(path.id)}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-3 text-left rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      activePathId === path.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{path.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {t('sidebar.modulesCount', { count: path.modules.length })}
                      </p>
                    </div>
                    {activePathId === path.id && (
                      <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Paths Section */}
            {customLearningPaths.length > 0 && (
              <div className="px-2 pb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t('sidebar.yourPaths')}
                </div>
                <div className="space-y-1">
                  {customLearningPaths.map(path => (
                    <div
                      key={path.id}
                      className={`group flex items-center rounded-md ${
                        activePathId === path.id
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectPath(path.id)}
                        disabled={isLoading}
                        className="flex-1 flex items-center gap-3 p-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${
                            activePathId === path.id
                              ? 'text-primary-700 dark:text-primary-300'
                              : 'text-gray-700 dark:text-gray-200'
                          }`}>
                            {path.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t('sidebar.modulesCount', { count: path.modules.length })} • {t('sidebar.customLabel')}
                          </p>
                        </div>
                        {activePathId === path.id && (
                          <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeletePath(path, e)}
                        disabled={isLoading}
                        className="flex-shrink-0 p-2 mr-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all disabled:opacity-0"
                        title={t('sidebar.deletePath')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PathSelector;