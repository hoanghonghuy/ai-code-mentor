
import React from 'react';
import type { LearningPath, Lesson, LearningModule } from '../types';
import { ChevronDownIcon, XIcon } from './icons';

interface LearningPathProps {
  learningPath: LearningPath;
  onSelectLesson: (lesson: Lesson) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ModuleView: React.FC<{ module: LearningModule, onSelectLesson: (lesson: Lesson) => void }> = ({ module, onSelectLesson }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    return (
        <div className="mb-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left flex justify-between items-center p-2 rounded-md hover:bg-primary-500/10">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{module.title}</h3>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                 <ul className="mt-2 space-y-1 pl-4 border-l border-gray-200 dark:border-gray-700">
                    {module.lessons.map(lesson => (
                        <li key={lesson.id}>
                            <button
                                onClick={() => onSelectLesson(lesson)}
                                className="w-full text-left p-2 text-sm text-gray-600 dark:text-gray-400 rounded-md hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                            >
                                {lesson.title}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const LearningPathView: React.FC<LearningPathProps> = ({ learningPath, onSelectLesson, isOpen, setIsOpen }) => {
  return (
    <>
      <aside className={`absolute md:static z-20 h-full flex-shrink-0 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold">{learningPath.title}</h2>
                 <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {learningPath.modules.map(module => (
                    <ModuleView key={module.title} module={module} onSelectLesson={onSelectLesson} />
                ))}
            </div>
        </div>
      </aside>
       {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-10 md:hidden"></div>}
    </>
  );
};

export default LearningPathView;
   