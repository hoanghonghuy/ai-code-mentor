import React, { useState } from 'react';
import type { LearningPath, Lesson, LearningModule, Achievement, LearningPathId, ProjectStep, CustomProject, Priority } from '../types';
import { ChevronDownIcon, XIcon, CheckCircleIcon, BookmarkIcon, SettingsIcon, BriefcaseIcon, CodeIcon, FolderIcon, FlagIcon, MapIcon, TrashIcon } from './icons';
import AchievementsView from './AchievementsView';
import SettingsView from './SettingsView';
import CustomProjectView from './CustomProjectView';
import { useTranslation } from 'react-i18next';
import CustomPathsManager from './CustomPathsManager';
import ConfirmationModal from './ConfirmationModal';

// ... (types unchanged)

const LearningPathView: React.FC<LearningPathProps> = (props) => {
  const { t } = useTranslation();
  const {
    // ... existing props
    customLearningPaths = [],
    onNewPath,
    onDeleteCustomPath,
  } = props;

  const [activeTab, setActiveTab] = useState<'lessons' | 'achievements' | 'settings'>('lessons');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'priority'>('default');
  const [pathToDelete, setPathToDelete] = useState<LearningPath | null>(null);

  // ... rest of computed values

  return (
    <>
      <aside className={`absolute md:relative z-20 h-full flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${props.isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full w-80">
          {/* header + view tabs unchanged */}
          {props.activeView === 'learningPath' ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="mb-3 flex items-center gap-2">
                  {/* selector + new path button as-is */}
                </div>
                <CustomPathsManager
                  customLearningPaths={customLearningPaths}
                  activePathId={props.activePathId}
                  onSelectPath={props.onSelectPath}
                  onDeletePath={(id) => onDeleteCustomPath && onDeleteCustomPath(id)}
                  onConfirmDelete={(p) => setPathToDelete(p)}
                />
              </div>
              {/* tabs + content unchanged */}
            </>
          ) : (
            <CustomProjectView /* ... */ />
          )}
        </div>
      </aside>
      {props.isOpen && <div onClick={() => props.setIsOpen(false)} className="fixed inset-0 z-10 bg-black/20 md:hidden"></div>}
      {pathToDelete && (
        <ConfirmationModal
          title={t('deletePathModal.title', 'Xóa lộ trình?')}
          message={t('deletePathModal.message', { pathName: pathToDelete.title })}
          confirmText={t('deletePathModal.confirm', 'Xóa')}
          onConfirm={() => {
            onDeleteCustomPath && onDeleteCustomPath(pathToDelete.id);
            setPathToDelete(null);
          }}
          onClose={() => setPathToDelete(null)}
        />
      )}
    </>
  );
};

export default LearningPathView;