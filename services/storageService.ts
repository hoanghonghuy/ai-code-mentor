import type { UserData, User } from '../types';
import { doc, getDoc, setDoc, serverTimestamp } from '../firebase';
import { db } from '../firebase';

/**
 * Service for managing user data persistence
 * Abstracts localStorage vs Firestore storage
 */

const GUEST_DATA_KEY = 'aiCodeMentorGuestData';

/**
 * Save user data to appropriate storage
 */
export const saveUserData = async (user: User | null, data: Omit<UserData, 'lastSaved'>): Promise<void> => {
  if (user) {
    try {
      const dataToSave = { ...data, lastSaved: serverTimestamp() };
      await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
      throw error;
    }
  } else {
    try {
      localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving guest data to localStorage:', error);
      throw error;
    }
  }
};

/**
 * Load user data from appropriate storage
 */
export const loadUserData = async (user: User | null): Promise<UserData | null> => {
  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      return snap.exists() ? snap.data() as UserData : null;
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
      return null;
    }
  } else {
    try {
      const guestJson = localStorage.getItem(GUEST_DATA_KEY);
      return guestJson ? JSON.parse(guestJson) as UserData : null;
    } catch (error) {
      console.error('Error loading guest data from localStorage:', error);
      return null;
    }
  }
};

/**
 * Clear user data from storage
 */
export const clearUserData = (user: User | null): void => {
  if (!user) {
    localStorage.removeItem(GUEST_DATA_KEY);
  }
  // For logged-in users, we don't clear Firestore data
};

/**
 * Check if user data exists
 */
export const hasUserData = (user: User | null): boolean => {
  if (user) {
    // For logged-in users, we assume data might exist in Firestore
    // Actual check requires async call to loadUserData
    return true;
  } else {
    return localStorage.getItem(GUEST_DATA_KEY) !== null;
  }
};