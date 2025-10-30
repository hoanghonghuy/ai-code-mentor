import React, { useState } from 'react';
import type { LearningPath, Lesson, LearningModule, Achievement, LearningPathId, ProjectStep } from '../types';
import { ChevronDownIcon, XIcon, CheckCircleIcon, BookmarkIcon, SettingsIcon, BriefcaseIcon } from './icons';
import AchievementsView from './AchievementsView';
import SettingsView from './SettingsView';

interface LearningPathProps {
  learningPath: LearningPath;
  onSelectLesson: (item: Lesson | ProjectStep) => void;
  activeLessonId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  achievements: Achievement[];
  allPaths: LearningPath[];
  activePathId: LearningPathId;
  onSelectPath: (pathId: LearningPathId) => void;
  bookmarkedLessonIds: string[];
  onToggleBookmark: (lessonId: string) => void;
  customDocs: string[];
  onAddDoc: (url: string) => void;
  onRemoveDoc: (index: number) => void;
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
      <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${value}%` }}></div>
    </div>
);

interface ModuleViewProps {
    module: LearningModule;
    onSelectLesson: (item: Lesson | ProjectStep) => void;
    activeLessonId: string | null;
    bookmarkedLessonIds: string[];
    onToggleBookmark: (lessonId: string) => void;
    showOnlyBookmarked: boolean;
}

const ModuleView: React.FC<ModuleViewProps> = ({ module, onSelectLesson, activeLessonId, bookmarkedLessonIds, onToggleBookmark, showOnlyBookmarked }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);
    
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
                           <p className="text-xs text-primary-700 dark:text-primary-300 font-medium">GUIDED PROJECT</p>
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
                        <ul className="space-y-1 ml-2">
                            {stepsToShow.map(step => {
                                const isActive = activeLessonId === step.id;
                                const isCompleted = step.completed;
                                const isBookmarked = bookmarkedLessonIds.includes(step.id);
                                return (
                                    <li key={step.id} className="pl-2 group flex items-center">
                                        <button
                                            onClick={() => onSelectLesson(step)}
                                            className={`w-full text-left p-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                                                isActive 
                                                ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold' 
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-500/10'
                                            }`}
                                        >
                                            {isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0"/> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 flex-shrink-0" />}
                                            <span className={isCompleted && !isActive ? 'line-through text-gray-500' : ''}>{step.title}</span>
                                        </button>
                                        <button 
                                          onClick={() => onToggleBookmark(step.id)} 
                                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                                          aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                        >
                                            <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
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
    
    if (lessonsToShow.length === 0) return null;

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
                    <ul className="space-y-1 border-l border-gray-200 dark:border-gray-700 ml-2">
                        {lessonsToShow.map(lesson => {
                            const isActive = activeLessonId === lesson.id;
                            const isCompleted = lesson.completed;
                            const isBookmarked = bookmarkedLessonIds.includes(lesson.id);
                            return (
                                <li key={lesson.id} className="pl-2 group flex items-center">
                                    <button
                                        onClick={() => onSelectLesson(lesson)}
                                        className={`w-full text-left p-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                                            isActive 
                                            ? 'bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold' 
                                            : isCompleted 
                                            ? 'text-gray-500 dark:text-gray-400 hover:bg-primary-500/10' 
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-primary-500/10'
                                        }`}
                                    >
                                        {isCompleted ? <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0"/> : <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 flex-shrink-0" />}
                                        <span className={isCompleted && !isActive ? 'line-through' : ''}>{lesson.title}</span>
                                    </button>
                                     <button 
                                      onClick={() => onToggleBookmark(lesson.id)} 
                                      className={`p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}
                                      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                    >
                                        <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                 </div>
            )}
        </div>
    )
}

const LearningPathView: React.FC<LearningPathProps> = ({ learningPath, onSelectLesson, activeLessonId, isOpen, setIsOpen, achievements, allPaths, activePathId, onSelectPath, bookmarkedLessonIds, onToggleBookmark, customDocs, onAddDoc, onRemoveDoc }) => {
  const [activeTab, setActiveTab] = useState<'path' | 'achievements' | 'settings'>('path');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  
  const allItems = learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []);
  const completedItems = allItems.filter(item => item.completed).length;
  const overallProgress = allItems.length > 0 ? (completedItems / allItems.length) * 100 : 0;

  const TabButton: React.FC<{tabId: 'path' | 'achievements' | 'settings', children: React.ReactNode, icon?: React.ReactNode}> = ({ tabId, children, icon }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 ${activeTab === tabId ? 'bg-primary-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
        {icon}{children}
    </button>
  );

  return (
    <>
      <aside className={`absolute md:static z-20 h-full flex-shrink-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                    <h2 className="text-lg font-bold">
                        {activeTab === 'path' ? 'Learning Path' : activeTab === 'achievements' ? 'Achievements' : 'Settings'}
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                 <div className="mb-4">
                    <select
                        id="learning-path-select"
                        value={activePathId}
                        onChange={(e) => onSelectPath(e.target.value as LearningPathId)}
                        className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {allPaths.map(path => (
                            <option key={path.id} value={path.id}>{path.title}</option>
                        ))}
                    </select>
                </div>
                {activeTab === 'path' && (
                     <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <ProgressBar value={overallProgress} />
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{Math.round(overallProgress)}%</span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                            <input 
                                type="checkbox"
                                checked={showOnlyBookmarked}
                                onChange={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-gray-100 dark:bg-gray-900"
                            />
                            Show Bookmarked Only
                        </label>
                    </div>
                )}
            </div>
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1 space-x-1">
                    <TabButton tabId="path">Lessons</TabButton>
                    <TabButton tabId="achievements">Achievements</TabButton>
                    <TabButton tabId="settings" icon={<SettingsIcon className="w-4 h-4"/>}>Settings</TabButton>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'path' ? (
                     learningPath.modules.map((module, index) => (
                        <ModuleView key={`${module.title}-${index}`} module={module} onSelectLesson={onSelectLesson} activeLessonId={activeLessonId} bookmarkedLessonIds={bookmarkedLessonIds} onToggleBookmark={onToggleBookmark} showOnlyBookmarked={showOnlyBookmarked} />
                    ))
                ) : activeTab === 'achievements' ? (
                    <AchievementsView achievements={achievements} />
                ) : (
                    <SettingsView customDocs={customDocs} onAddDoc={onAddDoc} onRemoveDoc={onRemoveDoc} />
                )}
            </div>
        </div>
      </aside>
       {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-10 md:hidden"></div>}
    </>
  );
};

export default LearningPathView;