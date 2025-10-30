import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep, CustomProject } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import Notification from './components/Notification';
import { TrophyIcon, NoteIcon, PlayIcon } from './components/icons';
import { learningPaths } from './learningPaths';
import NotesPanel from './components/NotesPanel';
import NewProjectModal from './components/NewProjectModal';

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
  
  // View mode state
  const [activeView, setActiveView] = useState<'learningPath' | 'customProject'>('learningPath');

  // Learning Path State
  const [activePathId, setActivePathId] = useState<LearningPathId>('js-basics');
  const [learningPath, setLearningPath] = useState<LearningPath>(learningPaths[activePathId]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [learningPathMessages, setLearningPathMessages] = useState<ChatMessage[]>([]);

  // Custom Project State
  const [customProjects, setCustomProjects] = useState<CustomProject[]>([]);
  const [activeCustomProjectId, setActiveCustomProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Gamification State
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>(getInitialAchievements(learningPath.title));
  const [notification, setNotification] = useState<Achievement | null>(null);

  // Tools State
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
  
  // Effect to switch message history based on active view
  useEffect(() => {
      if (activeView === 'learningPath') {
          setMessages(learningPathMessages);
      } else if (activeView === 'customProject' && activeCustomProjectId) {
          const activeProject = customProjects.find(p => p.id === activeCustomProjectId);
          setMessages(activeProject ? activeProject.chatHistory : []);
      } else {
          setMessages([]);
      }
  }, [activeView, activeCustomProjectId, learningPathMessages, customProjects]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const createChatInstance = useCallback(() => {
     if (!ai) return null;
     return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are an expert AI programming mentor. 
        Your goal is to guide users through learning to code by building real projects. 
        Explain concepts clearly, provide step-by-step instructions, analyze code, and give constructive feedback. 
        Keep your explanations concise, friendly, and focused. 
        Use markdown for formatting, especially for code blocks (e.g., \`\`\`javascript).
        When a user starts a lesson, project step, or a new custom project, greet them and begin the process immediately.`,
        tools: [{googleSearch: {}}],
      },
    });
  }, [ai]);

  useEffect(() => {
    setChat(createChatInstance());
  }, [createChatInstance]);

  const showNotification = (achievement: Achievement) => {
    setNotification(achievement);
    setTimeout(() => {
        setNotification(null);
    }, 5000);
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

  const handleSendMessage = useCallback(async (message: string, isSystemMessage = false) => {
    const currentChatInstance = createChatInstance();
    if (!currentChatInstance) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    
    // Determine where to save the message
    let currentMessages: ChatMessage[] = [];
    if (!isSystemMessage) {
        currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
    } else {
        currentMessages = messages;
    }


    setIsLoading(true);

    try {
      const result = await currentChatInstance.sendMessageStream({ message });
      let text = '';
      let groundingChunks: GroundingChunk[] = [];
      
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
      currentMessages = [...currentMessages, modelMessage];
      setMessages(currentMessages);
      
      for await (const chunk of result) {
        text += chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        }

        const updatedMessages = [...currentMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        updatedMessages[updatedMessages.length - 1] = { 
            ...lastMessage,
            parts: [{ text }],
            groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined,
          };
        setMessages(updatedMessages);
        currentMessages = updatedMessages;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I encountered an error. Please try again." }] };
      currentMessages = [...currentMessages, errorMessage];
      setMessages(currentMessages);
    } finally {
      setIsLoading(false);
      // Persist the final state of messages
      if (activeView === 'learningPath') {
        setLearningPathMessages(currentMessages);
      } else if (activeView === 'customProject' && activeCustomProjectId) {
        setCustomProjects(prev => prev.map(p => p.id === activeCustomProjectId ? { ...p, chatHistory: currentMessages } : p));
      }
    }
  }, [messages, createChatInstance, activeView, activeCustomProjectId]);

  const handleFirstCodeRun = useCallback(() => {
    unlockAchievement('bug-hunter');
  }, [unlockAchievement]);
  
  const handleSelectLesson = useCallback((item: Lesson | ProjectStep) => {
    setActiveView('learningPath');
    setLearningPathMessages([]);
    handleSendMessage(item.prompt, true);
    setActiveLessonId(item.id);
    
    setLearningPath(currentPath => {
        let itemAlreadyCompleted = false;
        const newPath = { ...currentPath, modules: currentPath.modules.map(module => {
            if (module.lessons?.find(l => l.id === item.id)) {
                itemAlreadyCompleted = module.lessons.find(l => l.id === item.id)!.completed;
                return { ...module, lessons: module.lessons.map(l => l.id === item.id ? { ...l, completed: true } : l) };
            } else if (module.project?.steps.find(s => s.id === item.id)) {
                itemAlreadyCompleted = module.project.steps.find(s => s.id === item.id)!.completed;
                return { ...module, project: { ...module.project, steps: module.project.steps.map(s => s.id === item.id ? { ...s, completed: true } : s) }};
            }
            return module;
        })};

        if (!itemAlreadyCompleted) {
            setPoints(p => p + 10);
            unlockAchievement('first-lesson');
        }

        const updatedModule = newPath.modules.find(m => m.lessons?.some(l => l.id === item.id) || m.project?.steps.some(s => s.id === item.id));
        if (updatedModule) {
            if (updatedModule.lessons?.every(l => l.completed)) unlockAchievement('first-module');
            if (updatedModule.project?.steps.every(s => s.completed)) unlockAchievement('project-builder');
        }
        
        const allItems = newPath.modules.flatMap(m => m.lessons || m.project?.steps || []);
        if (allItems.every(i => i.completed)) unlockAchievement('path-complete');
        
        return newPath;
    });

    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [handleSendMessage, unlockAchievement]);

  const handleSelectPath = useCallback((pathId: LearningPathId) => {
    setActivePathId(pathId);
    const newPathData = JSON.parse(JSON.stringify(learningPaths[pathId]));
    setLearningPath(newPathData);
    setAchievements(getInitialAchievements(newPathData.title));
    setPoints(0);
    setActiveLessonId(null);
    setLearningPathMessages([]);
    setActiveView('learningPath');
  }, []);

  const handleCreateCustomProject = useCallback((name: string, goal: string) => {
    const newProject: CustomProject = {
      id: `proj-${Date.now()}`,
      name,
      goal,
      chatHistory: [],
    };
    setCustomProjects(prev => [...prev, newProject]);
    setActiveCustomProjectId(newProject.id);
    setActiveView('customProject');
    setIsModalOpen(false);
    
    const kickstartPrompt = `Start a new custom project with me.
    My project is called: "${name}"
    My main goal is: "${goal}"
    
    First, welcome me to my new project. Then, ask me about my current programming knowledge to understand my skill level. Finally, suggest a technology stack and the very first step to get started.`;
    
    handleSendMessage(kickstartPrompt, true);
  }, [handleSendMessage]);

  const handleSelectCustomProject = useCallback((projectId: string) => {
    setActiveCustomProjectId(projectId);
    setActiveView('customProject');
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

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
          activeView={activeView}
          setActiveView={setActiveView}
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
          customProjects={customProjects}
          activeCustomProjectId={activeCustomProjectId}
          onSelectCustomProject={handleSelectCustomProject}
          onNewProject={() => setIsModalOpen(true)}
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
                    disabled={activeView === 'customProject'}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Notification achievement={notification} />
      {isModalOpen && <NewProjectModal onClose={() => setIsModalOpen(false)} onCreateProject={handleCreateCustomProject} />}
    </div>
  );
};

export default App;