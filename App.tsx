
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import { MenuIcon, XIcon } from './components/icons';

// Hardcoded learning path data as a starting point
const JAVASCRIPT_PATH: LearningPath = {
  id: 'js-basics',
  title: 'JavaScript for Beginners',
  modules: [
    {
      title: 'Module 1: The Basics',
      lessons: [
        { id: 'js-1-1', title: 'What is JavaScript?', prompt: 'Explain what JavaScript is to a complete beginner. Use a simple analogy.' },
        { id: 'js-1-2', title: 'Variables & Data Types', prompt: 'Teach me about JavaScript variables (var, let, const) and common data types (string, number, boolean). Provide code examples for each.' },
        { id: 'js-1-3', title: 'Operators', prompt: 'Introduce me to JavaScript operators: arithmetic, assignment, comparison, and logical. Give me a simple example for each category.' },
      ],
    },
    {
      title: 'Module 2: Control Flow',
      lessons: [
        { id: 'js-2-1', title: 'Conditional Statements', prompt: 'Explain `if`, `else if`, and `else` statements in JavaScript. Provide a practical code example.' },
        { id: 'js-2-2', title: 'Loops', prompt: 'Teach me about `for` and `while` loops in JavaScript. When should I use each one? Show me examples.' },
        { id: 'js-2-3', title: 'Functions', prompt: 'What are functions in JavaScript? Explain how to declare them and call them, including parameters and return values.' },
      ],
    },
  ],
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return null;
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const startNewChat = useCallback(() => {
    if (!ai) return;
    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are an expert AI programming mentor. 
        Your goal is to guide users through learning to code by building real projects. 
        Explain concepts clearly, provide step-by-step instructions, analyze code, and give constructive feedback. 
        Keep your explanations concise, friendly, and focused. 
        Use markdown for formatting, especially for code blocks (e.g., \`\`\`javascript).
        When a user starts a lesson, greet them and begin teaching the topic immediately.`
      },
    });
    setChat(newChat);
    setMessages([]);
    return newChat;
  }, [ai]);

  useEffect(() => {
    if(ai) {
        startNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ai]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chat.sendMessageStream({ message });
      let text = '';
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
      
      for await (const chunk of result) {
        text += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text }] };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chat]);

  const handleSelectLesson = useCallback((lesson: Lesson) => {
    const currentChat = startNewChat();
    if(currentChat) {
      handleSendMessage(lesson.prompt);
    }
     if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [startNewChat, handleSendMessage]);

  if (!process.env.API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">API Key Not Found</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Please set your API_KEY environment variable to use the AI Code Mentor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header theme={theme} toggleTheme={toggleTheme} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <LearningPathView 
          learningPath={JAVASCRIPT_PATH} 
          onSelectLesson={handleSelectLesson}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <main className="flex flex-col flex-1 p-2 md:p-4 gap-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
            <div className="flex-1 flex flex-col min-h-0 lg:max-w-xl xl:max-w-2xl">
              <CodePlayground />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
   