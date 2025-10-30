import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import Notification from './components/Notification';
import { TrophyIcon, NoteIcon, PlayIcon } from './components/icons';
import { learningPaths } from './learningPaths';
import NotesPanel from './components/NotesPanel';
import SettingsView from './components/SettingsView';

const getInitialAchievements = (pathTitle: string): Achievement[] => {
    const definitions: Omit<Achievement, 'unlocked'>[] = [
        { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: TrophyIcon },
        { id: 'first-module', name: 'Module Master', description: 'Complete all lessons in a module.', icon: TrophyIcon },
        { id: 'bug-hunter', name: 'Bug Hunter', description: 'Run code for the first time.', icon: TrophyIcon },
        { id: 'project-builder', name: 'Project Builder', description: 'Complete your first guided project.', icon: TrophyIcon },
        { id: 'path-complete', name: `${pathTitle} Journeyman`, description: `Complete the entire ${pathTitle} path.`, icon: TrophyIcon },
    ];
    return definitions.map(ach => ({ ...ach, unlocked: false }));
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [activePathId, setActivePathId] = useState<LearningPathId>('js-basics');
  const [learningPath, setLearningPath] = useState<LearningPath>(learningPaths[activePathId]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  
  // Gamification State
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>(getInitialAchievements(learningPath.title));
  const [notification, setNotification] = useState<Achievement | null>(null);

  // New State for features
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>([]);
  const [customDocs, setCustomDocs] = useState<string[]>(['https://react.dev', 'https://developer.mozilla.org/']);
  const [activeRightTab, setActiveRightTab] = useState<'playground' | 'notes'>('playground');


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
        When a user starts a lesson or project step, greet them and begin teaching the topic immediately.`,
        tools: [{googleSearch: {}}],
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

  const showNotification = (achievement: Achievement) => {
    setNotification(achievement);
    setTimeout(() => {
        setNotification(null);
    }, 5000); // Notification disappears after 5 seconds
  };

  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
        const target = prev.find(a => a.id === id);
        if (target && !target.unlocked) {
            showNotification(target);
            return prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
        }
        return prev;
    });
  }, []);
  
  // Handlers for new features
  const handleNoteChange = useCallback((lessonId: string, newNote: string) => {
    setNotes(prev => ({ ...prev, [lessonId]: newNote }));
  }, []);

  const handleToggleBookmark = useCallback((lessonId: string) => {
    setBookmarkedLessonIds(prev =>
      prev.includes(lessonId)
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  }, []);

  const handleAddCustomDoc = useCallback((url: string) => {
    setCustomDocs(prev => [...prev, url]);
  }, []);

  const handleRemoveCustomDoc = useCallback((indexToRemove: number) => {
    setCustomDocs(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!chat) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chat.sendMessageStream({ message });
      let text = '';
      let groundingChunks: GroundingChunk[] = [];
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
      
      for await (const chunk of result) {
        text += chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        }

        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          newMessages[newMessages.length - 1] = { 
            ...lastMessage,
            parts: [{ text }],
            groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined,
          };
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

  const handleFirstCodeRun = useCallback(() => {
    unlockAchievement('bug-hunter');
  }, [unlockAchievement]);
  
  const handleSelectLesson = useCallback((item: Lesson | ProjectStep) => {
    const currentChat = startNewChat();
    if (currentChat) {
      handleSendMessage(item.prompt);
    }
    setActiveLessonId(item.id);

    setLearningPath(currentPath => {
        let itemAlreadyCompleted = false;

        const newPath = { ...currentPath, modules: currentPath.modules.map(module => {
            if (module.lessons) {
                const lesson = module.lessons.find(l => l.id === item.id);
                if (lesson) {
                    itemAlreadyCompleted = lesson.completed;
                    return { ...module, lessons: module.lessons.map(l => l.id === item.id ? { ...l, completed: true } : l) };
                }
            } else if (module.project) {
                const step = module.project.steps.find(s => s.id === item.id);
                 if (step) {
                    itemAlreadyCompleted = step.completed;
                    return { ...module, project: { ...module.project, steps: module.project.steps.map(s => s.id === item.id ? { ...s, completed: true } : s) }};
                }
            }
            return module;
        })};

        // Award points only for the first completion
        if (!itemAlreadyCompleted) {
            setPoints(p => p + 10);
            unlockAchievement('first-lesson');
        }

        // Check for module/project/path completion
        const updatedModule = newPath.modules.find(m => 
            m.lessons?.some(l => l.id === item.id) || m.project?.steps.some(s => s.id === item.id)
        );

        if (updatedModule) {
            if (updatedModule.lessons && updatedModule.lessons.every(l => l.completed)) {
                unlockAchievement('first-module');
            }
            if (updatedModule.project && updatedModule.project.steps.every(s => s.completed)) {
                unlockAchievement('project-builder');
            }
        }
        
        const allLessonsAndSteps = newPath.modules.flatMap(m => m.lessons || m.project?.steps || []);
        if (allLessonsAndSteps.every(i => i.completed)) {
            unlockAchievement('path-complete');
        }
        
        return newPath;
    });

    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  }, [startNewChat, handleSendMessage, unlockAchievement]);

  const handleSelectPath = useCallback((pathId: LearningPathId) => {
    setActivePathId(pathId);
    
    // Reset progress for the new path
    const newPathData = learningPaths[pathId];
    setLearningPath(newPathData);
    setAchievements(getInitialAchievements(newPathData.title));
    setPoints(0);
    setActiveLessonId(null);
    startNewChat();
  }, [startNewChat]);

  const activeLesson = useMemo(() => {
    if (!activeLessonId) return null;
    return learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []).find(l => l.id === activeLessonId) || null;
  }, [activeLessonId, learningPath]);


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
      <Header theme={theme} toggleTheme={toggleTheme} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} points={points} />
      <div className="flex flex-1 overflow-hidden">
        <LearningPathView 
          learningPath={learningPath} 
          onSelectLesson={handleSelectLesson}
          activeLessonId={activeLessonId}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          achievements={achievements}
          allPaths={Object.values(learningPaths)}
          activePathId={activePathId}
          onSelectPath={handleSelectPath}
          bookmarkedLessonIds={bookmarkedLessonIds}
          onToggleBookmark={handleToggleBookmark}
          customDocs={customDocs}
          onAddDoc={handleAddCustomDoc}
          onRemoveDoc={handleRemoveCustomDoc}
        />
        <main className="flex flex-col flex-1 p-2 md:p-4 gap-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row flex-1 gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0">
              <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
            <div className="flex-1 flex flex-col min-h-0 lg:max-w-xl xl:max-w-2xl">
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 mb-2">
                <div className="flex items-center">
                  <button 
                    onClick={() => setActiveRightTab('playground')}
                    className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'playground' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <PlayIcon className="w-5 h-5"/> Playground
                  </button>
                  <button 
                    onClick={() => setActiveRightTab('notes')}
                    className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <NoteIcon className="w-5 h-5"/> Notes
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                {activeRightTab === 'playground' && <CodePlayground onFirstRun={handleFirstCodeRun} />}
                {activeRightTab === 'notes' && (
                  <NotesPanel 
                    note={activeLessonId ? notes[activeLessonId] || '' : ''}
                    onNoteChange={(newNote) => activeLessonId && handleNoteChange(activeLessonId, newNote)}
                    activeLessonTitle={activeLesson?.title || null}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Notification achievement={notification} />
    </div>
  );
};

export default App;