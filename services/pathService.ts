import type { LearningPath, LearningPathId, Achievement, UserData } from '../types';
import { learningPaths } from '../learningPaths';

/**
 * Service for managing learning paths (both standard and custom)
 * Provides abstraction over path selection, creation, and storage
 */

const getInitialAchievements = (pathTitle: string): Achievement[] => {
  const defs: Omit<Achievement, 'unlocked'>[] = [
    { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: 'TrophyIcon' },
    { id: 'first-module', name: 'Module Master', description: 'Complete all lessons in a module.', icon: 'TrophyIcon' },
    { id: 'bug-hunter', name: 'Bug Hunter', description: 'Run code for the first time.', icon: 'TrophyIcon' },
    { id: 'project-builder', name: 'Project Builder', description: 'Complete your first guided project.', icon: 'TrophyIcon' },
    { id: 'path-complete', name: `${pathTitle} Journeyman`, description: `Complete the entire ${pathTitle} path.`, icon: 'TrophyIcon' },
  ];
  return defs.map(a => ({ ...a, unlocked: false }));
};

/**
 * Get a standard learning path by ID with fallback
 */
export const getStandardPath = (pathId: LearningPathId): LearningPath => {
  const path = learningPaths[pathId];
  if (!path) {
    console.warn(`Standard path '${pathId}' not found, falling back to 'js-basics'`);
    return JSON.parse(JSON.stringify(learningPaths['js-basics']));
  }
  return JSON.parse(JSON.stringify(path));
};

/**
 * Get all available standard paths
 */
export const getStandardPaths = (): LearningPath[] => {
  return Object.values(learningPaths);
};

/**
 * Find a path (standard or custom) by ID
 */
export const findPathById = (pathId: string, customPaths: LearningPath[]): LearningPath | null => {
  // Try custom paths first
  const customPath = customPaths.find(p => p.id === pathId);
  if (customPath) return customPath;
  
  // Then try standard paths
  const standardPath = learningPaths[pathId as LearningPathId];
  return standardPath ? JSON.parse(JSON.stringify(standardPath)) : null;
};

/**
 * Check if a path ID is a standard path
 */
export const isStandardPath = (pathId: string): boolean => {
  return Object.keys(learningPaths).includes(pathId);
};

/**
 * Create a new custom learning path
 */
export const createCustomPath = (pathData: Omit<LearningPath, 'id'>): LearningPath => {
  return {
    ...pathData,
    id: `custom-${Date.now()}`
  };
};

/**
 * Get fresh state for path switching
 */
export const getPathSwitchState = (targetPath: LearningPath, resetProgress: boolean = false) => {
  const baseState = {
    activePathId: targetPath.id,
    learningPath: JSON.parse(JSON.stringify(targetPath)),
    activeLessonId: null,
    activeView: 'learningPath' as const,
    messages: [],
  };

  if (resetProgress) {
    return {
      ...baseState,
      achievements: getInitialAchievements(targetPath.title),
      points: 0,
      learningPathHistories: {},
      notes: {},
      bookmarkedLessonIds: [],
      chatHistory: {},
    };
  }

  return baseState;
};

/**
 * Validate learning path data structure
 */
export const validateLearningPath = (path: any): path is LearningPath => {
  if (!path || typeof path !== 'object') return false;
  if (!path.id || !path.title) return false;
  if (!Array.isArray(path.modules)) return false;
  
  return path.modules.every((module: any) => {
    if (!module.title) return false;
    // Either lessons or project must exist
    if (!Array.isArray(module.lessons) && !module.project) return false;
    if (module.project && !Array.isArray(module.project.steps)) return false;
    return true;
  });
};

/**
 * Safe path access helpers
 */
export const getPathModules = (path: LearningPath | null | undefined): any[] => {
  return Array.isArray(path?.modules) ? path.modules : [];
};

export const getModuleLessons = (module: any): any[] => {
  return Array.isArray(module?.lessons) ? module.lessons : [];
};

export const getProjectSteps = (module: any): any[] => {
  return Array.isArray(module?.project?.steps) ? module.project.steps : [];
};

export const getAllPathItems = (path: LearningPath | null | undefined): any[] => {
  const modules = getPathModules(path);
  return modules.flatMap(m => {
    const lessons = getModuleLessons(m);
    const steps = getProjectSteps(m);
    return lessons.length > 0 ? lessons : steps;
  });
};