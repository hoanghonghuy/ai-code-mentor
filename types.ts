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

export interface LearningPath {
  id: string;
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