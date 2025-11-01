import { useCallback } from 'react';
import type { LearningPath, LearningPathId, User } from '../types';
import { 
  findPathByIdWithRepair,
  isStandardPath,
  createCustomPath,
  getPathSwitchState,
  validateLearningPath,
  repairLearningPath
} from '../services/pathService';

/**
 * Custom hook for path management logic
 * Encapsulates path selection and creation behavior
 */

type PathState = {
  activePathId: string;
  learningPath: LearningPath;
  customLearningPaths: LearningPath[];
};

type StateUpdaters = {
  setActivePathId: (id: string) => void;
  setLearningPath: (path: LearningPath) => void;
  setCustomLearningPaths: (paths: LearningPath[] | ((prev: LearningPath[]) => LearningPath[])) => void;
  setAchievements: (achievements: any) => void;
  setPoints: (points: number) => void;
  setActiveLessonId: (id: string | null) => void;
  setLearningPathHistories: (histories: any) => void;
  setNotes: (notes: any) => void;
  setBookmarkedLessonIds: (ids: string[]) => void;
  setActiveView: (view: 'learningPath' | 'customProject') => void;
  setMessages: (messages: any[]) => void;
  setChatHistory: (history: any) => void;
  resetStateForGuest: (pathId: LearningPathId) => void;
};

export const usePathManagement = (
  user: User | null,
  pathState: PathState,
  updaters: StateUpdaters
) => {
  const { activePathId, learningPath, customLearningPaths } = pathState;
  const {
    setActivePathId,
    setLearningPath,
    setCustomLearningPaths,
    setAchievements,
    setPoints,
    setActiveLessonId,
    setLearningPathHistories,
    setNotes,
    setBookmarkedLessonIds,
    setActiveView,
    setMessages,
    setChatHistory,
    resetStateForGuest,
  } = updaters;

  const handleSelectPath = useCallback((pathId: string) => {
    // ENHANCED: Use repair-enabled path finding
    const pathData = findPathByIdWithRepair(pathId, customLearningPaths);
    
    if (!pathData) {
      console.error(`Path with id "${pathId}" not found or could not be repaired.`);
      return;
    }

    // Additional validation is already done in findPathByIdWithRepair
    console.log(`Successfully selected path: ${pathData.title}`);

    const isStandard = isStandardPath(pathId);

    if (user) {
      if (isStandard) {
        // Logged-in user + standard path: reset progress
        const switchState = getPathSwitchState(pathData, true);
        setActivePathId(switchState.activePathId);
        setLearningPath(switchState.learningPath);
        setAchievements(switchState.achievements);
        setPoints(switchState.points);
        setActiveLessonId(switchState.activeLessonId);
        setLearningPathHistories(switchState.learningPathHistories);
        setNotes(switchState.notes);
        setBookmarkedLessonIds(switchState.bookmarkedLessonIds);
        setActiveView(switchState.activeView);
        setMessages(switchState.messages);
        setChatHistory(switchState.chatHistory);
      } else {
        // Logged-in user + custom path: switch without reset
        const switchState = getPathSwitchState(pathData, false);
        setActivePathId(switchState.activePathId);
        setLearningPath(switchState.learningPath);
        setActiveLessonId(switchState.activeLessonId);
        setActiveView(switchState.activeView);
        setMessages(switchState.messages);
      }
    } else {
      // Guest user
      if (isStandard) {
        resetStateForGuest(pathId as LearningPathId);
      } else {
        // Guest + custom path from localStorage
        const switchState = getPathSwitchState(pathData, false);
        setActivePathId(switchState.activePathId);
        setLearningPath(switchState.learningPath);
        setActiveLessonId(switchState.activeLessonId);
        setActiveView(switchState.activeView);
        setMessages(switchState.messages);
      }
    }
  }, [user, customLearningPaths, resetStateForGuest, setActivePathId, setLearningPath, setAchievements, setPoints, setActiveLessonId, setLearningPathHistories, setNotes, setBookmarkedLessonIds, setActiveView, setMessages, setChatHistory]);

  // HOTFIX: Enhanced custom path creation with automatic repair
  const handleCreateCustomPath = useCallback((pathData: Omit<LearningPath, 'id'>) => {
    console.log('Creating custom path with data:', pathData);
    
    // Create temporary path for validation
    const tempPath = { ...pathData, id: 'temp' };
    
    let finalPath: LearningPath;
    
    if (validateLearningPath(tempPath)) {
      // Path is valid, use as-is
      console.log('Path data is valid, proceeding with creation');
      finalPath = createCustomPath(pathData);
    } else {
      // Path validation failed, attempt repair
      console.warn('Path validation failed, attempting repair...');
      const repairedPathData = repairLearningPath(pathData);
      
      if (repairedPathData && validateLearningPath(repairedPathData)) {
        console.log('Successfully repaired path data');
        // Use repaired data, but assign new ID via createCustomPath
        const { id, ...repairedWithoutId } = repairedPathData;
        finalPath = createCustomPath(repairedWithoutId);
      } else {
        // Repair failed, create minimal valid path
        console.warn('Repair failed, creating minimal path fallback');
        const fallbackPathData: Omit<LearningPath, 'id'> = {
          title: pathData.title || 'Custom Learning Path',
          description: pathData.description || 'Custom learning path created by user',
          modules: [
            {
              title: 'Getting Started',
              description: 'Begin your learning journey',
              lessons: [
                {
                  id: `lesson-${Date.now()}`,
                  title: 'Introduction',
                  prompt: 'Welcome to your custom learning path! Let\'s begin with the basics.',
                  completed: false,
                  priority: 'none',
                }
              ]
            }
          ]
        };
        finalPath = createCustomPath(fallbackPathData);
      }
    }
    
    console.log('Final path to be created:', finalPath.title);
    
    // Update states in batch to avoid race conditions
    setCustomLearningPaths(prev => {
      const newCustomPaths = [...prev, finalPath];
      
      // Switch to new path immediately using the newly created object
      const switchState = getPathSwitchState(finalPath, true);
      setActivePathId(switchState.activePathId);
      setLearningPath(switchState.learningPath);
      setAchievements(switchState.achievements);
      setPoints(switchState.points);
      setActiveLessonId(switchState.activeLessonId);
      setLearningPathHistories(switchState.learningPathHistories);
      setNotes(switchState.notes);
      setBookmarkedLessonIds(switchState.bookmarkedLessonIds);
      setActiveView(switchState.activeView);
      setMessages(switchState.messages);
      setChatHistory(switchState.chatHistory);
      
      return newCustomPaths;
    });
  }, [setCustomLearningPaths, setActivePathId, setLearningPath, setAchievements, setPoints, setActiveLessonId, setLearningPathHistories, setNotes, setBookmarkedLessonIds, setActiveView, setMessages, setChatHistory]);

  return {
    handleSelectPath,
    handleCreateCustomPath,
  };
};