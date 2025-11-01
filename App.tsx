import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// ... existing imports
import CustomPathsManager from './components/CustomPathsManager';

// ... existing App component code

const App: React.FC = () => {
  // ... existing state

  // NEW: delete a custom learning path
  const handleDeleteCustomPath = useCallback((id: string) => {
    setCustomLearningPaths(prev => prev.filter(p => p.id !== id));
    // If deleting the active path, switch to a standard default
    setActivePathId(prev => (prev === id ? 'js-basics' : prev));
    if (activePathId === id) {
      // Reset to default standard path
      const fresh = getInitialState('js-basics');
      setLearningPath(fresh.learningPath);
      setActiveLessonId(null);
      setAchievements(getInitialAchievements(fresh.learningPath.title));
      setLearningPathHistories({});
      setNotes({});
      setBookmarkedLessonIds([]);
      setMessages([]);
      setActiveView('learningPath');
      setChatHistory({});
    }
  }, [activePathId]);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header /* ...props */ />
      <div className="flex flex-1 overflow-hidden">
        <LearningPathView
          /* existing props */
          customLearningPaths={customLearningPaths}
          onNewPath={() => setIsCreatePathModalOpen(true)}
          onDeleteCustomPath={handleDeleteCustomPath}
        />
        {/* ...rest unchanged */}
      </div>
      {/* modals, etc. */}
    </div>
  );
};

export default App;
