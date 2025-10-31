import { Chat } from "@google/genai";
import type { ElementType } from 'react';
import type { User } from 'firebase/auth';

export { User };

export interface GroundingChunk {
  web?: {
    // FIX: made uri optional to match the type from @google/genai
    uri?: string;
    // FIX: made title optional to match the type from @google/genai
    title?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  groundingChunks?: GroundingChunk[];
}

export interface Lesson {
  id: string;
  title: string;
  prompt: string;
  completed: boolean;
}

export interface ProjectStep {
  id: string;
  title: string;
  prompt: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  steps: ProjectStep[];
}

export interface LearningModule {
  title: string;
  lessons?: Lesson[];
  project?: Project;
}

export type LearningPathId = 'js-basics' | 'python-basics' | 'csharp-basics' | 'go-basics' | 'java-basics' | 'frontend-basics' | 'fullstack-basics' | 'mobile-basics' | 'typescript-basics' | 'sql-basics';

export interface LearningPath {
  id: LearningPathId;
  title: string;
  modules: LearningModule[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  // Fix: Replaced ElementType with string to make it serializable and prevent circular JSON errors.
  icon: string;
}

export interface CustomProject {
  id: string;
  name: string;
  goal: string;
  chatHistory: ChatMessage[];
}

export type Theme = 'light' | 'dark';

export interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  chat: Chat | null;
}

export interface UserData {
  learningPath: LearningPath;
  activeLessonId: string | null;
  learningPathHistories: { [key: string]: ChatMessage[] };
  customProjects: CustomProject[];
  activeCustomProjectId: string | null;
  points: number;
  achievements: Achievement[];
  notes: { [key: string]: string };
  bookmarkedLessonIds: string[];
  customDocs: string[];
  activePathId: LearningPathId;
  aiLanguage?: string;
  lastSaved?: any;
}