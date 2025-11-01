import React, { useState, useMemo } from 'react';
import type { LearningPath, Lesson, LearningModule, Achievement, LearningPathId, ProjectStep, CustomProject, Priority } from '../types';
import { ChevronDownIcon, XIcon, CheckCircleIcon, BookmarkIcon, SettingsIcon, BriefcaseIcon, CodeIcon, FolderIcon, FlagIcon, MapIcon } from './icons';
import AchievementsView from './AchievementsView';
import SettingsView from './SettingsView';
import CustomProjectView from './CustomProjectView';
import { useTranslation } from 'react-i18next';

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
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
      <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${value}%` }}></div>
    </div>
);

const PriorityIndicator: React.FC<{ priority: Priority }> = ({ priority }) => {
    const { t } = useTranslation();
    if (priority === 'none') return null;

    const colors: Record<Priority, string> = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500',
        none: '',
    };
    const tooltips: Record<Priority, string> = {
        high: t('priority.high'),
        medium: t('priority.medium'),
        low: t('priority.low'),
        none: '',
    };

    return (
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0`} style={{ backgroundColor: colors[priority].replace('bg-','') }} title={tooltips[priority]}></div>
    );
};


interface ModuleViewProps {
    module: LearningModule;
    onSelectLesson: (item: Lesson | ProjectStep) => void;
    activeLessonId: string | null;
    bookmarkedLessonIds: string[];
    onToggleBookmark: (lessonId: string) => void;
    onSetPriority: (itemId:string, priority: Priority) => void;
    showOnlyBookmarked: boolean;
    isLoading: boolean;
}

const ModuleView: React.FC<ModuleViewProps> = ({ module, onSelectLesson, activeLessonId, bookmarkedLessonIds, onToggleBookmark, onSetPriority, showOnlyBookmarked, isLoading }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [priorityMenuOpenFor, setPriorityMenuOpenFor] = useState<string | null>(null);

    const PriorityMenu: React.FC<{ item: Lesson | ProjectStep }> = ({ item }) => {
        const priorities: Priority[] = ['high', 'medium', 'low', 'none'];
        const priorityLabels: Record<Priority, string> = {
            high: t('priority.high'),
            medium: t('priority.medium'),
            low: t('priority.low'),
            none: t('priority.none'),
        };
        const priorityColors: Record<Priority, string> = {
            high: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
            medium: 'text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
            low: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
            none: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
        };

        return (
            <div 
                className="absolute right-full mr-1 top-1/2 -translate-y-1/2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-10"
                onMouseLeave={() => setPriorityMenuOpenFor(null)}
            >
                {priorities.map(p => (
                    <button
                        key={p}
                        onClick={() => {
                            onSetPriority(item.id, p);
                            setPriorityMenuOpenFor(null);
                        }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm ${priorityColors[p]}`}
                    >
                        <PriorityIndicator priority={p} />
                        {priorityLabels[p]}
                    </button>
                ))}
            </div>
        );
    };

    const renderItemList = (items: (Lesson | ProjectStep)[]) => (
        <ul className="space-y-1 ml-2">
            {items.map(item => {
                const isActive = activeLessonId === item.id;
                const isCompleted = item.completed;
                const isBookmarked = bookmarkedLessonIds.includes(item.id);
                return (
                    <li key={item.id} className="pl-2 group flex items-center">
                        <button
                            onClick={() => onSelectLesson(item)}
                            disabled={isLoading}
                            className={`flex-1 text-left p-2 text-sm rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isActive 
                                ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-500/10'
                            }`}
                        >
                            {isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0"/> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 flex-shrink-0" />}
                            <PriorityIndicator priority={item.priority} />
                            <span className={`${isCompleted && !isActive ? 'line-through text-gray-500' : ''} truncate`}>{item.title}</span>
                        </button>
                        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity relative">
                             <button 
                              onClick={() => setPriorityMenuOpenFor(prev => prev === item.id ? null : item.id)} 
                              className={`p-1 rounded-md ${priorityMenuOpenFor === item.id ? 'opacity-100' : ''} ${item.priority !== 'none' ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
                              aria-label={t('priority.set')}
                            >
                                <FlagIcon className={`w-4 h-4 ${item.priority !== 'none' ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                              onClick={() => onToggleBookmark(item.id)} 
                              className={`p-1 rounded-md ${isBookmarked ? 'opacity-100 text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                            >
                                <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                            </button>
                            {priorityMenuOpenFor === item.id && <PriorityMenu item={item} />}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
    
    if (module.project) {
        const project = module.project;
        const stepsToShow = showOnlyBookmarked ? project.steps.filter(s => bookmarkedLessonIds.includes(s.id)) : project.steps;
        const completedSteps = project.steps.filter(s => s.completed).length;
        const totalSteps = project.steps.length;
        const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        if (stepsToShow.length === 0 && showOnlyBookmarked) return null;

        return (
            <div className="mb-4 bg-primary-500/5 dark:bg-primary-500/10 p-3 rounded-lg">
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left flex justify-between items-center">
                    <div className="flex items-center gap-3">
                         <BriefcaseIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                        <div>
                           <h3 className="font-semibold text-gray-700 dark:text-gray-200">{project.title}</h3>
                           <p className="text-xs text-primary-700 dark:text-primary-300 font-medium">{t('sidebar.guidedProject')}</p>
                        </div>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                     <div className="mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 pl-1">{project.description}</p>
                        <div className="flex items-center gap-2 mb-3 pl-1">
                            <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
                            <ProgressBar value={progress} />
                        </div>
                        {renderItemList(stepsToShow)}
                     </div>
                )}
            </div>
        );
    }
    
    if (!module.lessons) return null;

    const lessonsToShow = showOnlyBookmarked ? module.lessons.filter(l => bookmarkedLessonIds.includes(l.id)) : module.lessons;
    const completedLessons = module.lessons.filter(l => l.completed).length;
    const totalLessons = module.lessons.length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    if (lessonsToShow.length === 0 && showOnlyBookmarked) return null;

    return (
        <div className="mb-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left flex justify-between items-center p-2 rounded-md hover:bg-gray-200/50 dark:hover:bg-gray-700/50">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{module.title}</h3>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                 <div className="mt-2 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
                        <ProgressBar value={progress} />
                    </div>
                    <div className="border-l border-gray-200 dark:border-gray-700">
                      {renderItemList(lessonsToShow)}
                    </div>
                 </div>
            )}
        </div>
    )
}

const LearningPathView: React.FC<LearningPathProps> = (props) => {
  const { t } = useTranslation();
  const { activeView, setActiveView, learningPath, onSelectLesson, activeLessonId, isOpen, setIsOpen, achievements, allPaths, activePathId, onSelectPath, bookmarkedLessonIds, onToggleBookmark, onSetPriority, customDocs, onAddDoc, onRemoveDoc, customProjects, activeCustomProjectId, onSelectCustomProject, onNewProject, onEditProject, onDeleteProject, isLoading, uiLanguage, onUiLanguageChange, aiLanguage, onAiLanguageChange, customLearningPaths, onNewPath } = props;
  const [activeTab, setActiveTab] = useState<'lessons' | 'achievements' | 'settings'>('lessons');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');
  
  const allItems = learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []);
  const completedItems = allItems.filter(item => item.completed).length;
  const overallProgress = allItems.length > 0 ? (completedItems / allItems.length) * 100 : 0;

  const priorityOrder: Record<Priority, number> = {
    'high': 0,
    'medium': 1,
    'low': 2,
    'none': 3
  };

  const sortedModules = useMemo(() => {
    if (sortBy === 'default') {
        return learningPath.modules;
    }

    const sorted = JSON.parse(JSON.stringify(learningPath.modules));
    
    sorted.forEach((module: LearningModule) => {
        if (module.lessons) {
            module.lessons.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        }
        if (module.project?.steps) {
            module.project.steps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        }
    });

    return sorted;
  }, [learningPath.modules, sortBy]);

  const TabButton: React.FC<{tabId: 'lessons' | 'achievements' | 'settings', children: React.ReactNode}> = ({ tabId, children }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${activeTab === tabId ? 'bg-primary-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
        {children}
    </button>
  );

  const ViewToggleButton: React.FC<{viewId: 'learningPath' | 'customProject', children: React.ReactNode, icon: React.ReactNode}> = ({ viewId, children, icon }) => (
    <button
        onClick={() => setActiveView(viewId)}
        disabled={isLoading}
        className={`w-full flex items-center justify-center gap-2 p-3 text-sm font-bold border-b-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeView === viewId ? 'text-primary-600 dark:text-primary-400 border-primary-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border-transparent'}`}
    >
        {icon}{children}
    </button>
  );

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
                    <ViewToggleButton viewId="learningPath" icon={<CodeIcon className="w-5 h-5" />}>{t('sidebar.learning')}</ViewToggleButton>
                    <ViewToggleButton viewId="customProject" icon={<FolderIcon className="w-5 h-5" />}>{t('sidebar.projects')}</ViewToggleButton>
                </div>
            </div>
            {activeView === 'learningPath' ? (
                <>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="mb-4 flex items-center gap-2">
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">{Math.round(overallProgress)}%</span>
                            <ProgressBar value={overallProgress} />
                        </div>
                    </div>

                    <div className="p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between gap-2 p-1 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
                           <TabButton tabId="lessons">{t('sidebar.lessons')}</TabButton>
                           <TabButton tabId="achievements">{t('sidebar.achievements')}</TabButton>
                           <TabButton tabId="settings">{t('sidebar.settings')}</TabButton>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-4 overflow-y-auto">
                        {activeTab === 'lessons' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="flex items-center text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={showOnlyBookmarked} 
                                            onChange={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
                                            className="w-4 h-4 rounded text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className="ml-2">{t('sidebar.showBookmarkedOnly')}</span>
                                    </label>
                                     <div>
                                        <label htmlFor="sort-by" className="text-xs text-gray-600 dark:text-gray-400 mr-2">{t('sidebar.sortBy')}</label>
                                        <select
                                            id="sort-by"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as 'default' | 'priority')}
                                            className="p-1 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        >
                                            <option value="default">{t('sidebar.sort.default')}</option>
                                            <option value="priority">{t('sidebar.sort.priority')}</option>
                                        </select>
                                    </div>
                                </div>
                                {sortedModules.map((module, index) => (
                                    <ModuleView 
                                        key={index} 
                                        module={module} 
                                        onSelectLesson={onSelectLesson} 
                                        activeLessonId={activeLessonId}
                                        bookmarkedLessonIds={bookmarkedLessonIds}
                                        onToggleBookmark={onToggleBookmark}
                                        onSetPriority={onSetPriority}
                                        showOnlyBookmarked={showOnlyBookmarked}
                                        isLoading={isLoading}
                                    />
                                ))}
                            </div>
                        )}
                        {activeTab === 'achievements' && <AchievementsView achievements={achievements}/>}
                        {activeTab === 'settings' && (
                            <SettingsView 
                                customDocs={customDocs} 
                                onAddDoc={onAddDoc} 
                                onRemoveDoc={onRemoveDoc}
                                uiLanguage={uiLanguage}
                                onUiLanguageChange={onUiLanguageChange}
                                aiLanguage={aiLanguage}
                                onAiLanguageChange={onAiLanguageChange}
                            />
                        )}
                    </div>
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