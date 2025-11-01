import type { LearningPath, LearningPathId, Achievement, UserData } from '../types';
import { learningPaths } from '../learningPaths';
import { safeArray, safeString } from '../utils/guards';

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
  const customPath = safeArray(customPaths).find(p => p.id === pathId);
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
      achievements: getInitialAchievements(safeString(targetPath.title, 'Learning Path')),
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
 * Seed default project steps when empty
 */
const seedDefaultProjectSteps = () => ([
  { id: `step-${Date.now()}-1`, title: 'Thiết lập Leaflet', prompt: 'Khởi tạo bản đồ Leaflet cơ bản.', completed: false, priority: 'none' },
  { id: `step-${Date.now()}-2`, title: 'Tải & hiển thị GeoJSON', prompt: 'Tải file GeoJSON và render lên bản đồ.', completed: false, priority: 'none' },
  { id: `step-${Date.now()}-3`, title: 'Markers & Popups', prompt: 'Thêm markers với popup mô tả.', completed: false, priority: 'none' }
]);

/**
 * FIXED: More flexible validation for learning path data structure with inline coercion
 */
export const validateLearningPath = (path: any): path is LearningPath => {
  try {
    if (!path || typeof path !== 'object') return false;
    if (!safeString(path.id) && !safeString(path.title)) return false;
    if (!Array.isArray(path.modules)) return false;

    path.modules = path.modules.map((module: any) => {
      const title = safeString(module.title, 'Untitled Module');
      const lessons = Array.isArray(module.lessons) ? module.lessons : undefined;
      let project = module.project && typeof module.project === 'object' ? module.project : undefined;

      if (project) {
        project.title = safeString(project.title, 'Guided Project');
        if (!Array.isArray(project.steps)) project.steps = [];
        // Seed default steps if empty
        if (project.steps.length === 0) project.steps = seedDefaultProjectSteps();
      }

      // If both missing → seed a starter lesson
      const finalLessons = lessons || (!project ? [
        { id: `lesson-${Date.now()}`, title: 'Introduction', prompt: 'Start here.', completed: false, priority: 'none' }
      ] : undefined);

      // If both exist → prefer lessons
      if (finalLessons) project = undefined;

      return { ...module, title, lessons: finalLessons, project };
    });

    return true;
  } catch (error) {
    console.error('Error during path validation:', error);
    return false;
  }
};

/**
 * Safe path access helpers
 */
export const getPathModules = (path: LearningPath | null | undefined): any[] => {
  return safeArray(path?.modules);
};

export const getModuleLessons = (module: any): any[] => {
  return safeArray(module?.lessons);
};

export const getProjectSteps = (module: any): any[] => {
  return safeArray(module?.project?.steps);
};

export const getAllPathItems = (path: LearningPath | null | undefined): any[] => {
  const modules = getPathModules(path);
  return modules.flatMap(m => {
    const lessons = getModuleLessons(m);
    const steps = getProjectSteps(m);
    return lessons.length > 0 ? lessons : steps;
  });
};

/**
 * Repair function keeps as backup; validate already coerces/seed now
 */
export const repairLearningPath = (path: any): LearningPath | null => {
  try {
    const clone = JSON.parse(JSON.stringify(path));
    // Reuse validation to coerce & seed
    const ok = validateLearningPath({ ...clone, id: clone.id || 'temp' });
    return ok ? { ...clone, id: clone.id } : null;
  } catch {
    return null;
  }
};

/**
 * ENHANCED: Find path with automatic repair attempt
 */
export const findPathByIdWithRepair = (pathId: string, customPaths: LearningPath[]): LearningPath | null => {
  const found = findPathById(pathId, customPaths);
  if (!found) return null;
  // validate now coerces & seeds; always returns boolean
  const copy = JSON.parse(JSON.stringify(found));
  const ok = validateLearningPath({ ...copy, id: copy.id || 'temp' });
  return ok ? copy : null;
};