
import { Chat } from "@google/genai";

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface Lesson {
  id: string;
  title: string;
  prompt: string;
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

export type Theme = 'light' | 'dark';

export interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  chat: Chat | null;
}
   