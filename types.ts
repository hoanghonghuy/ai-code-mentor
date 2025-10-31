import { Chat } from "@google/genai";
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

export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Lesson {
  id: string;
  title: string;
  prompt: string;
  completed: boolean;
  priority: Priority;
}

export interface ProjectStep {
  id: string;
  title: string;
  prompt: string;
  completed: boolean;
  priority: Priority;
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

export type LearningPathId = 'js-basics' | 'python-basics' | 'csharp-basics' | 'go-basics' | 'java-basics' | 'frontend-basics' | 'fullstack-basics' | 'mobile-basics' | 'typescript-basics' | 'sql-basics' | 'git-basics' | 'devops-basics' | 'dsa-basics';

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

export type FileSystemNode = ProjectFile | ProjectFolder;

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: 'file';
  parentId?: string | null;
}

export interface ProjectFolder {
  id: string;
  name: string;
  children: FileSystemNode[];
  type: 'folder';
  isOpen?: boolean; // For UI state
  parentId?: string | null;
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
  projectFiles: FileSystemNode[];
  openFileIds: string[];
  activeFileId: string | null;
}