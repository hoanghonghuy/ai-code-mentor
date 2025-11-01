/**
 * Utility functions for safe data access and type guards
 */

/**
 * Safe array access with fallback to empty array
 */
export const safeArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : [];
};

/**
 * Safe object access with fallback
 */
export const safeObject = <T extends object>(value: T | null | undefined, fallback: T): T => {
  return value && typeof value === 'object' ? value : fallback;
};

/**
 * Safe string access with fallback
 */
export const safeString = (value: string | null | undefined, fallback: string = ''): string => {
  return typeof value === 'string' ? value : fallback;
};

/**
 * Safe number access with fallback
 */
export const safeNumber = (value: number | null | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

/**
 * Deep clone utility
 */
export const deepClone = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    console.error('Failed to deep clone object');
    return obj;
  }
};

/**
 * Type guard for checking if an object has required properties
 */
export const hasRequiredProps = <T extends Record<string, any>>(
  obj: any,
  requiredProps: (keyof T)[]
): obj is T => {
  if (!obj || typeof obj !== 'object') return false;
  return requiredProps.every(prop => prop in obj);
};

/**
 * Safe filter operation that handles undefined arrays
 */
export const safeFilter = <T>(
  array: T[] | null | undefined,
  predicate: (item: T) => boolean
): T[] => {
  return safeArray(array).filter(predicate);
};

/**
 * Safe map operation that handles undefined arrays
 */
export const safeMap = <T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U
): U[] => {
  return safeArray(array).map(mapper);
};

/**
 * Safe flatMap operation that handles undefined arrays
 */
export const safeFlatMap = <T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U[]
): U[] => {
  return safeArray(array).flatMap(mapper);
};