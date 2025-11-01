import { useCallback } from 'react';
import type { LearningPath, LearningPathId, User } from '../types';
import { 
  findPathById,
  isStandardPath,
  createCustomPath,
  getPathSwitchState,
  validateLearningPath 
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
    const pathData = findPathById(pathId, customLearningPaths);
    
    if (!pathData) {
      console.error(`Path with id "${pathId}" not found.`);
      return;
    }

    if (!validateLearningPath(pathData)) {
      console.error(`Path with id "${pathId}" has invalid structure.`);
      return;
    }

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

  const handleCreateCustomPath = useCallback((pathData: Omit<LearningPath, 'id'>) => {
    if (!validateLearningPath({ ...pathData, id: 'temp' })) {
      console.error('Invalid path data structure');
      return;
    }

    const newPath = createCustomPath(pathData);
    
    // Update states in batch to avoid race conditions
    setCustomLearningPaths(prev => {
      const newCustomPaths = [...prev, newPath];
      
      // Switch to new path immediately using the newly created object
      const switchState = getPathSwitchState(newPath, true);
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