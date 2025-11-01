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
 * FIXED: More flexible validation for learning path data structure
 * Supports both standard and custom learning paths with various structures
 */
export const validateLearningPath = (path: any): path is LearningPath => {
  try {
    // Basic structure checks
    if (!path || typeof path !== 'object') {
      console.warn('Path validation failed: not an object');
      return false;
    }
    
    if (!safeString(path.id) || !safeString(path.title)) {
      console.warn('Path validation failed: missing id or title');
      return false;
    }
    
    // Modules must exist and be an array
    if (!Array.isArray(path.modules)) {
      console.warn('Path validation failed: modules is not an array');
      return false;
    }
    
    // More flexible module validation
    const isValidModule = (module: any): boolean => {
      if (!module || typeof module !== 'object') return false;
      if (!safeString(module.title)) return false;
      
      // Module can have lessons, project, or both
      const hasLessons = Array.isArray(module.lessons) && module.lessons.length > 0;
      const hasProject = module.project && typeof module.project === 'object';
      
      if (!hasLessons && !hasProject) {
        console.warn(`Module '${module.title}' has neither lessons nor project`);
        return false;
      }
      
      // If has project, validate project structure
      if (hasProject) {
        if (!safeString(module.project.title)) {
          console.warn(`Project in module '${module.title}' missing title`);
          return false;
        }
        if (!Array.isArray(module.project.steps)) {
          console.warn(`Project in module '${module.title}' missing or invalid steps`);
          return false;
        }
      }
      
      return true;
    };
    
    // Validate all modules (but allow empty modules array for new custom paths)
    if (path.modules.length > 0) {
      const invalidModules = path.modules.filter((m: any) => !isValidModule(m));
      if (invalidModules.length > 0) {
        console.warn(`Path '${path.title}' has ${invalidModules.length} invalid modules`);
        return false;
      }
    }
    
    console.log(`Path '${path.title}' passed validation`);
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
 * ADDED: Repair/normalize learning path structure if possible
 * Attempts to fix common issues in stored custom paths
 */
export const repairLearningPath = (path: any): LearningPath | null => {
  if (!path || typeof path !== 'object') return null;
  
  try {
    const repaired: LearningPath = {
      id: safeString(path.id) || `custom-${Date.now()}`,
      title: safeString(path.title, 'Untitled Path'),
      description: safeString(path.description, 'Custom learning path'),
      modules: safeArray(path.modules).map((module: any) => ({
        title: safeString(module.title, 'Untitled Module'),
        description: safeString(module.description),
        lessons: safeArray(module.lessons).map((lesson: any) => ({
          id: safeString(lesson.id) || `lesson-${Date.now()}-${Math.random()}`,
          title: safeString(lesson.title, 'Untitled Lesson'),
          prompt: safeString(lesson.prompt, 'Start learning!'),
          completed: Boolean(lesson.completed),
          priority: lesson.priority || 'none',
        })),
        project: module.project ? {
          title: safeString(module.project.title, 'Untitled Project'),
          description: safeString(module.project.description),
          steps: safeArray(module.project.steps).map((step: any) => ({
            id: safeString(step.id) || `step-${Date.now()}-${Math.random()}`,
            title: safeString(step.title, 'Untitled Step'),
            prompt: safeString(step.prompt, 'Continue with this step!'),
            completed: Boolean(step.completed),
            priority: step.priority || 'none',
          })),
        } : undefined,
      })),
    };
    
    // Ensure at least one valid module exists
    if (repaired.modules.length === 0) {
      repaired.modules.push({
        title: 'Getting Started',
        description: 'Begin your learning journey',
        lessons: [{
          id: `lesson-${Date.now()}`,
          title: 'Introduction',
          prompt: 'Welcome to your custom learning path! Let\'s begin.',
          completed: false,
          priority: 'none',
        }],
      });
    }
    
    return repaired;
  } catch (error) {
    console.error('Failed to repair learning path:', error);
    return null;
  }
};

/**
 * ENHANCED: Find path with automatic repair attempt
 */
export const findPathByIdWithRepair = (pathId: string, customPaths: LearningPath[]): LearningPath | null => {
  const found = findPathById(pathId, customPaths);
  if (!found) return null;
  
  // First try normal validation
  if (validateLearningPath(found)) {
    return found;
  }
  
  // If validation fails, attempt repair
  console.warn(`Path '${pathId}' failed validation, attempting repair...`);
  const repaired = repairLearningPath(found);
  
  if (repaired && validateLearningPath(repaired)) {
    console.log(`Successfully repaired path '${pathId}'`);
    return repaired;
  }
  
  console.error(`Cannot repair path '${pathId}', falling back to null`);
  return null;
};