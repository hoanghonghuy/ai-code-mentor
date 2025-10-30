import React, { useState } from 'react';
import type { LearningPath, Lesson, LearningModule, Achievement } from '../types';
import { ChevronDownIcon, XIcon, CheckCircleIcon } from './icons';
import AchievementsView from './AchievementsView';

interface LearningPathProps {
  learningPath: LearningPath;
  onSelectLesson: (lesson: Lesson) => void;
  activeLessonId: string | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  achievements: Achievement[];
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
      <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${value}%` }}></div>
    </div>
);

interface ModuleViewProps {
    module: LearningModule;
    onSelectLesson: (lesson: Lesson) => void;
    activeLessonId: string | null;
}

const ModuleView: React.FC<ModuleViewProps> = ({ module, onSelectLesson, activeLessonId }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    const completedLessons = module.lessons.filter(l => l.completed).length;
    const totalLessons = module.lessons.length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="mb-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left flex justify-between items-center p-2 rounded-md hover:bg-primary-500/10">
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
                        {module.lessons.map(lesson => {
                            const isActive = activeLessonId === lesson.id;
                            const isCompleted = lesson.completed;
                            return (
                                <li key={lesson.id} className="pl-2">
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
                                </li>
                            )
                        })}
                    </ul>
                 </div>
            )}
        </div>
    )
}

const LearningPathView: React.FC<LearningPathProps> = ({ learningPath, onSelectLesson, activeLessonId, isOpen, setIsOpen, achievements }) => {
  const [activeTab, setActiveTab] = useState<'path' | 'achievements'>('path');
  const totalLessons = learningPath.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedLessons = learningPath.modules.reduce((acc, module) => acc + module.lessons.filter(l => l.completed).length, 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const TabButton: React.FC<{tabId: 'path' | 'achievements', children: React.ReactNode}> = ({ tabId, children }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`flex-1 py-2 text-sm font-semibold rounded-md ${activeTab === tabId ? 'bg-primary-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
        {children}
    </button>
  );

  return (
    <>
      <aside className={`absolute md:static z-20 h-full flex-shrink-0 w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        {activeTab === 'path' ? learningPath.title : 'Achievements'}
                    </h2>
                    <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                {activeTab === 'path' && (
                    <div className="flex items-center gap-3">
                        <ProgressBar value={overallProgress} />
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{Math.round(overallProgress)}%</span>
                    </div>
                )}
            </div>
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    <TabButton tabId="path">Learning Path</TabButton>
                    <TabButton tabId="achievements">Achievements</TabButton>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'path' ? (
                     learningPath.modules.map(module => (
                        <ModuleView key={module.title} module={module} onSelectLesson={onSelectLesson} activeLessonId={activeLessonId} />
                    ))
                ) : (
                    <AchievementsView achievements={achievements} />
                )}
            </div>
        </div>
      </aside>
       {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-10 md:hidden"></div>}
    </>
  );
};

export default LearningPathView;