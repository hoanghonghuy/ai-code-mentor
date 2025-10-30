import { Chat } from "@google/genai";

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
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

export interface LearningModule {
  title: string;
  lessons: Lesson[];
}

export type LearningPathId = 'js-basics' | 'python-basics' | 'csharp-basics' | 'go-basics' | 'java-basics' | 'frontend-basics' | 'fullstack-basics' | 'mobile-basics';

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
  icon: React.ElementType;
}

export type Theme = 'light' | 'dark';

export interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  chat: Chat | null;
}