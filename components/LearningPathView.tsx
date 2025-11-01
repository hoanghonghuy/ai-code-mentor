import React, { useState } from 'react';
import type { LearningPath, Lesson, LearningModule, Achievement, LearningPathId, ProjectStep, CustomProject, Priority } from '../types';
import { ChevronDownIcon, XIcon, CheckCircleIcon, BookmarkIcon, SettingsIcon, BriefcaseIcon, CodeIcon, FolderIcon, FlagIcon, MapIcon, TrashIcon } from './icons';
import AchievementsView from './AchievementsView';
import SettingsView from './SettingsView';
import CustomProjectView from './CustomProjectView';
import { useTranslation } from 'react-i18next';
import CustomPathsManager from './CustomPathsManager';

// ... (rest of file remains the same up to the component props)

interface LearningPathProps {
  activeView: 'learningPath' | 'customProject';
  setActiveView: (view: 'learningPath' | 'customProject') => void;
  learningPath: LearningPath;
  onSelectLesson: (item: Lesson | ProjectStep) => void;
  activeLessonId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  achievements: Achievement[];
  allPaths: LearningPath[];
  activePathId: string;
  onSelectPath: (pathId: string) => void;
  bookmarkedLessonIds: string[];
  onToggleBookmark: (lessonId: string) => void;
  onSetPriority: (itemId: string, priority: Priority) => void;
  customDocs: string[];
  onAddDoc: (url: string) => void;
  onRemoveDoc: (index: number) => void;
  customProjects: CustomProject[];
  activeCustomProjectId: string | null;
  onSelectCustomProject: (projectId: string) => void;
  onNewProject: () => void;
  onEditProject: (project: CustomProject) => void;
  onDeleteProject: (project: CustomProject) => void;
  isLoading: boolean;
  uiLanguage: string;
  onUiLanguageChange: (lang: string) => void;
  aiLanguage: string;
  onAiLanguageChange: (lang: string) => void;
  customLearningPaths: LearningPath[];
  onNewPath: () => void;
  // NEW: delete custom path
  onDeleteCustomPath?: (id: string) => void;
}

// ... (keep ProgressBar, PriorityIndicator, ModuleView as in refactor branch)

const LearningPathView: React.FC<LearningPathProps> = (props) => {
  const { t } = useTranslation();
  const {
    activeView,
    setActiveView,
    learningPath,
    onSelectLesson,
    activeLessonId,
    isOpen,
    setIsOpen,
    achievements = [],
    allPaths = [],
    activePathId,
    onSelectPath,
    bookmarkedLessonIds = [],
    onToggleBookmark,
    onSetPriority,
    customDocs = [],
    onAddDoc,
    onRemoveDoc,
    customProjects = [],
    activeCustomProjectId,
    onSelectCustomProject,
    onNewProject,
    onEditProject,
    onDeleteProject,
    isLoading,
    uiLanguage,
    onUiLanguageChange,
    aiLanguage,
    onAiLanguageChange,
    customLearningPaths = [],
    onNewPath,
    onDeleteCustomPath,
  } = props;

  const [activeTab, setActiveTab] = useState<'lessons' | 'achievements' | 'settings'>('lessons');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');

  // ... (safeLearningPath, safeModules, overallProgress, sortedModules remain as is)

  return (
    <>
      <aside className={`absolute md:relative z-20 h-full flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full w-80">
            <div className="flex-shrink-0">
                <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">
                        {activeView === 'learningPath' ? learningPath.title : t('sidebar.myProjects')}
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                 <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveView('learningPath')}
                      disabled={isLoading}
                      className={`w-1/2 flex items-center justify-center gap-2 p-3 text-sm font-bold border-b-2 ${activeView === 'learningPath' ? 'text-primary-600 dark:text-primary-400 border-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border-transparent'}`}
                    >
                      <CodeIcon className="w-5 h-5" />{t('sidebar.learning')}
                    </button>
                    <button
                      onClick={() => setActiveView('customProject')}
                      disabled={isLoading}
                      className={`w-1/2 flex items-center justify-center gap-2 p-3 text-sm font-bold border-b-2 ${activeView === 'customProject' ? 'text-primary-600 dark:text-primary-400 border-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border-transparent'}`}
                    >
                      <FolderIcon className="w-5 h-5" />{t('sidebar.projects')}
                    </button>
                </div>
            </div>
            {activeView === 'learningPath' ? (
                <>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="mb-3 flex items-center gap-2">
                            <select
                                id="learning-path-select"
                                value={activePathId}
                                onChange={(e) => onSelectPath(e.target.value)}
                                disabled={isLoading}
                                className="flex-1 w-full p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                <optgroup label={t('sidebar.standardPaths')}>
                                    {allPaths.map(path => (
                                        <option key={path.id} value={path.id}>{path.title}</option>
                                    ))}
                                </optgroup>
                                {customLearningPaths.length > 0 && (
                                    <optgroup label={t('sidebar.yourPaths')}>
                                        {customLearningPaths.map(path => (
                                            <option key={path.id} value={path.id}>{path.title}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <button onClick={onNewPath} disabled={isLoading} className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50" title={t('sidebar.newPath')}>
                                <MapIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        {/* NEW: Custom paths manager list */}
                        <CustomPathsManager
                          customLearningPaths={customLearningPaths}
                          activePathId={activePathId}
                          onSelectPath={onSelectPath}
                          onDeletePath={(id) => onDeleteCustomPath && onDeleteCustomPath(id)}
                        />
                    </div>

                    {/* ... rest unchanged (tabs + lessons/settings/achievements) */}
                </>
            ) : (
                <CustomProjectView 
                    projects={customProjects}
                    activeProjectId={activeCustomProjectId}
                    onSelectProject={onSelectCustomProject}
                    onNewProject={onNewProject}
                    onEditProject={onEditProject}
                    onDeleteProject={onDeleteProject}
                    isLoading={isLoading}
                />
            )}
        </div>
      </aside>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-10 bg-black/20 md:hidden"></div>}
    </>
  );
};

export default LearningPathView;
