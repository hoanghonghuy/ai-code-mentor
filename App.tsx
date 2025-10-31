
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep, CustomProject, User, UserData } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import Notification from './components/Notification';
import { NoteIcon, PlayIcon, CodeIcon, ChatBubbleIcon } from './components/icons';
import { learningPaths } from './learningPaths';
import NotesPanel from './components/NotesPanel';
import NewProjectModal from './components/NewProjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp } from './firebase';
import { useTranslation, Trans } from 'react-i18next';

const GUEST_DATA_KEY = 'aiCodeMentorGuestData';

const getInitialAchievements = (pathTitle: string): Achievement[] => {
    const definitions: Omit<Achievement, 'unlocked'>[] = [
        { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: 'TrophyIcon' },
        { id: 'first-module', name: 'Module Master', description: 'Complete all lessons in a module.', icon: 'TrophyIcon' },
        { id: 'bug-hunter', name: 'Bug Hunter', description: 'Run code for the first time.', icon: 'TrophyIcon' },
        { id: 'project-builder', name: 'Project Builder', description: 'Complete your first guided project.', icon: 'TrophyIcon' },
        { id: 'path-complete', name: `${pathTitle} Journeyman`, description: `Complete the entire ${pathTitle} path.`, icon: 'TrophyIcon' },
    ];
    return definitions.map(ach => ({ ...ach, unlocked: false }));
};

const getInitialLearningPath = (pathId: LearningPathId): LearningPath => JSON.parse(JSON.stringify(learningPaths[pathId]));

const getInitialState = (pathId: LearningPathId) => {
  const path = getInitialLearningPath(pathId);
  return {
    activePathId: pathId,
    learningPath: path,
    activeLessonId: null,
    learningPathHistories: {},
    customProjects: [],
    activeCustomProjectId: null,
    points: 0,
    achievements: getInitialAchievements(path.title),
    notes: {},
    bookmarkedLessonIds: [],
    customDocs: ['https://react.dev', 'https://developer.mozilla.org/'],
    aiLanguage: 'en',
  };
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App state
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // View mode state
  const [activeView, setActiveView] = useState<'learningPath' | 'customProject'>('learningPath');
  const [activeMobileView, setActiveMobileView] = useState<'chat' | 'tools'>('chat');

  // Fix: The getInitialState function requires a `pathId` argument to determine which learning path to load.
  // It was being called without an argument, causing a "Expected 1 arguments, but got 0" error.
  // Passing 'js-basics' as a default ensures the application initializes correctly.
  const initialState = useMemo(() => getInitialState('js-basics'), []);
  
  // Learning Path State
  const [activePathId, setActivePathId] = useState<LearningPathId>(initialState.activePathId);
  const [learningPath, setLearningPath] = useState<LearningPath>(initialState.learningPath);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialState.activeLessonId);
  const [learningPathHistories, setLearningPathHistories] = useState<{ [key: string]: ChatMessage[] }>(initialState.learningPathHistories);

  // Custom Project State
  const [customProjects, setCustomProjects] = useState<CustomProject[]>(initialState.customProjects);
  const [activeCustomProjectId, setActiveCustomProjectId] = useState<string | null>(initialState.activeCustomProjectId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<CustomProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<CustomProject | null>(null);


  // Gamification State
  const [points, setPoints] = useState(initialState.points);
  const [achievements, setAchievements] = useState<Achievement[]>(initialState.achievements);
  const [notification, setNotification] = useState<Achievement | null>(null);

  // Tools State
  const [notes, setNotes] = useState<{ [key: string]: string }>(initialState.notes);
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(initialState.bookmarkedLessonIds);
  const [customDocs, setCustomDocs] = useState<string[]>(initialState.customDocs);
  const [activeRightTab, setActiveRightTab] = useState<'playground' | 'notes'>('playground');
  
  // Settings State
  const [aiLanguage, setAiLanguage] = useState(initialState.aiLanguage);

  // Ref to hold the latest messages array to prevent stale closures in callbacks
  const messagesRef = useRef<ChatMessage[]>();
  messagesRef.current = messages;
  const chatSessionRef = useRef<{ contextId: string; session: Chat } | null>(null);


  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return null;
  }, []);

  const hasLoadedData = useRef(false);

  useEffect(() => {
    const lightTheme = document.getElementById('light-hljs-theme') as HTMLLinkElement | null;
    const darkTheme = document.getElementById('dark-hljs-theme') as HTMLLinkElement | null;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (lightTheme) lightTheme.disabled = true;
      if (darkTheme) darkTheme.disabled = false;
    } else {
      document.documentElement.classList.remove('dark');
      if (lightTheme) lightTheme.disabled = false;
      if (darkTheme) darkTheme.disabled = true;
    }
  }, [theme]);
  
  useEffect(() => {
      if (activeView === 'learningPath') {
          setMessages(learningPathHistories[activeLessonId || ''] || []);
      } else if (activeView === 'customProject' && activeCustomProjectId) {
          const activeProject = customProjects.find(p => p.id === activeCustomProjectId);
          setMessages(activeProject ? activeProject.chatHistory : []);
      } else {
          setMessages([]);
      }
  }, [activeView, activeLessonId, activeCustomProjectId, learningPathHistories, customProjects]);

  const resetStateForGuest = useCallback((pathId: LearningPathId = 'js-basics') => {
      const freshState = getInitialState(pathId);
      setActivePathId(freshState.activePathId);
      setLearningPath(freshState.learningPath);
      setActiveLessonId(freshState.activeLessonId);
      setLearningPathHistories(freshState.learningPathHistories);
      setCustomProjects(freshState.customProjects);
      setActiveCustomProjectId(freshState.activeCustomProjectId);
      setPoints(freshState.points);
      setAchievements(freshState.achievements);
      setNotes(freshState.notes);
      setBookmarkedLessonIds(freshState.bookmarkedLessonIds);
      setAiLanguage(freshState.aiLanguage);
      setMessages([]);
      setActiveView('learningPath');
  }, []);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            localStorage.removeItem(GUEST_DATA_KEY);
            setUser(currentUser);
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const data = userDocSnap.data() as UserData;
                setActivePathId(data.activePathId || 'js-basics');
                setLearningPath(data.learningPath || getInitialLearningPath(data.activePathId || 'js-basics'));
                setActiveLessonId(data.activeLessonId || null);
                setLearningPathHistories(data.learningPathHistories || {});
                setCustomProjects(data.customProjects || []);
                setActiveCustomProjectId(data.activeCustomProjectId || null);
                setPoints(data.points || 0);
                setAchievements(data.achievements || getInitialAchievements(data.learningPath.title));
                setNotes(data.notes || {});
                setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
                setCustomDocs(data.customDocs || ['https://react.dev', 'https://developer.mozilla.org/']);
                setAiLanguage(data.aiLanguage || 'en');
            } else {
                resetStateForGuest();
            }
            hasLoadedData.current = true;
        } else {
            setUser(null);
            hasLoadedData.current = false;
            const guestDataJson = localStorage.getItem(GUEST_DATA_KEY);
            if(guestDataJson) {
                try {
                    const data = JSON.parse(guestDataJson) as UserData;
                     setActivePathId(data.activePathId || 'js-basics');
                     setLearningPath(data.learningPath || getInitialLearningPath(data.activePathId || 'js-basics'));
                     setActiveLessonId(data.activeLessonId || null);
                     setLearningPathHistories(data.learningPathHistories || {});
                     setCustomProjects(data.customProjects || []);
                     setActiveCustomProjectId(data.activeCustomProjectId || null);
                     setPoints(data.points || 0);
                     setAchievements(data.achievements?.length ? data.achievements : getInitialAchievements(data.learningPath.title));
                     setNotes(data.notes || {});
                     setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
                     setCustomDocs(data.customDocs || ['https://react.dev', 'https://developer.mozilla.org/']);
                     setAiLanguage(data.aiLanguage || 'en');
                } catch (error) {
                    console.error("Failed to parse guest data from localStorage", error);
                    resetStateForGuest();
                }
            } else {
                resetStateForGuest();
            }
        }
        setAuthLoading(false);
    });

    return () => unsubscribe();
    }, [resetStateForGuest]);

  useEffect(() => {
    if (authLoading) return;
    if (user && !hasLoadedData.current) return;

    const currentState: Omit<UserData, 'lastSaved'> = {
        activePathId,
        learningPath,
        activeLessonId,
        learningPathHistories,
        customProjects,
        activeCustomProjectId,
        points,
        achievements,
        notes,
        bookmarkedLessonIds,
        customDocs,
        aiLanguage,
    };

    const saveData = () => {
        if (user) {
            try {
                const dataToSave = { ...currentState, lastSaved: serverTimestamp() };
                setDoc(doc(db, "users", user.uid), dataToSave, { merge: true });
            } catch (error) {
                console.error("Error saving user data to Firestore:", error);
            }
        } else {
            try {
                localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(currentState));
            } catch (error) {
                 console.error("Error saving guest data to localStorage:", error);
            }
        }
    };

    const timer = setTimeout(saveData, 1500);
    return () => clearTimeout(timer);

  }, [
    user, authLoading,
    activePathId, learningPath, activeLessonId, learningPathHistories,
    customProjects, activeCustomProjectId, points, achievements,
    notes, bookmarkedLessonIds, customDocs, aiLanguage
  ]);

  const handleLogin = async () => {
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (error) {
          console.error("Authentication error:", error);
      }
  };

  const handleLogout = async () => {
      try {
          await signOut(auth);
      } catch (error) {
          console.error("Sign out error:", error);
      }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const createChatInstance = useCallback(() => {
     if (!ai) return null;
     const languageMap: { [key: string]: string } = {
        'en': 'English',
        'vi': 'Vietnamese'
     };
     const responseLanguage = languageMap[aiLanguage] || 'English';

     return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are an expert AI programming mentor. 
        Your goal is to guide users through learning to code by building real projects. 
        Explain concepts clearly, provide step-by-step instructions, analyze code, and give constructive feedback. 
        Keep your explanations concise, friendly, and focused. 
        Use markdown for formatting, especially for code blocks (e.g., \`\`\`javascript).
        When a user starts a lesson, project step, or a new custom project, greet them and begin the process immediately.
        IMPORTANT: You MUST respond in ${responseLanguage}.`,
        tools: [{googleSearch: {}}],
      },
    });
  }, [ai, aiLanguage]);

  const getChatSession = useCallback((contextId: string): Chat | null => {
      if (!ai) return null;
      if (chatSessionRef.current && chatSessionRef.current.contextId === contextId) {
          return chatSessionRef.current.session;
      }
      
      const newSession = createChatInstance();
      if (newSession) {
        chatSessionRef.current = { contextId: contextId, session: newSession };
      }
      return newSession;
  }, [ai, createChatInstance]);


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

  const handleSendMessage = useCallback(async (
    message: string,
    { 
      isSystemMessage = false, 
      initialHistory, 
      targetId, 
      targetView 
    }: { 
      isSystemMessage?: boolean; 
      initialHistory?: ChatMessage[]; 
      targetId?: string; 
      targetView?: 'learningPath' | 'customProject'; 
    } = {}
  ) => {
    const viewContext = targetView || activeView;
    const idContext = targetId || (viewContext === 'learningPath' ? activeLessonId : activeCustomProjectId);

    if (!idContext) {
      console.error("handleSendMessage called without a valid context ID.");
      return;
    }
    
    const chat = getChatSession(idContext);
    if (!chat) {
        console.error("Could not get a chat session.");
        return;
    }

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    
    const baseHistory = initialHistory ?? (messagesRef.current || []);
    const initialMessagesForUI = isSystemMessage ? baseHistory : [...baseHistory, userMessage];
    
    setMessages(initialMessagesForUI);
    setIsLoading(true);

    try {
      const result = await chat.sendMessageStream({ message });
      let text = '';
      let sanitizedGroundingChunks: GroundingChunk[] = [];
      
      const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
      setMessages([...initialMessagesForUI, modelMessage]);
      
      for await (const chunk of result) {
        text += chunk.text;
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            sanitizedGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks
                .map(c => ({
                    web: {
                        uri: c.web?.uri,
                        title: c.web?.title,
                    }
                }))
                .filter(c => c.web && c.web.uri);
        }

        setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
                 newMessages[newMessages.length - 1] = { 
                    ...lastMessage,
                    parts: [{ text }],
                    groundingChunks: sanitizedGroundingChunks.length > 0 ? sanitizedGroundingChunks : undefined,
                  };
            }
            return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', parts: [{ text: t('chat.errorMessage') }] };
      setMessages([...initialMessagesForUI, errorMessage]);
    } finally {
      setIsLoading(false);
      
      const viewToSave = viewContext;
      const idToSave = idContext;
      
      const finalMessages = messagesRef.current || [];

      const cleanFinalMessages = finalMessages.map(msg => {
        const cleanMsg: ChatMessage = {
          role: msg.role,
          parts: msg.parts.map(p => ({ text: p.text })),
        };
      
        if (msg.groundingChunks) {
          const cleanChunks = msg.groundingChunks
            .map(gc => ({
              web: {
                uri: gc.web?.uri,
                title: gc.web?.title,
              }
            }))
            .filter(gc => gc.web && gc.web.uri);
          
          if (cleanChunks.length > 0) {
            cleanMsg.groundingChunks = cleanChunks;
          }
        }
      
        return cleanMsg;
      });

      if (viewToSave === 'learningPath') {
        setLearningPathHistories(prev => ({ ...prev, [idToSave]: cleanFinalMessages }));
      } else if (viewToSave === 'customProject') {
        setCustomProjects(prev => prev.map(p => p.id === idToSave ? { ...p, chatHistory: cleanFinalMessages } : p));
      }
    }
  }, [activeView, activeCustomProjectId, activeLessonId, t, getChatSession]);

  const handleFirstCodeRun = useCallback(() => {
    unlockAchievement('bug-hunter');
  }, [unlockAchievement]);
  
  const handleSelectLesson = useCallback((item: Lesson | ProjectStep) => {
    setActiveView('learningPath');
    setActiveLessonId(item.id);
    setActiveMobileView('chat');

    const history = learningPathHistories[item.id] || [];
    
    if (history.length === 0) {
        handleSendMessage(item.prompt, { 
          isSystemMessage: true, 
          initialHistory: [],
          targetId: item.id,
          targetView: 'learningPath'
        });
    }
    
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
  }, [handleSendMessage, unlockAchievement, learningPathHistories]);

  const handleSelectPath = useCallback((pathId: LearningPathId) => {
    if (user) {
        const newPathData = getInitialLearningPath(pathId);
        setActivePathId(pathId);
        setLearningPath(newPathData);
        setAchievements(getInitialAchievements(newPathData.title));
        setPoints(0);
        setActiveLessonId(null);
        setLearningPathHistories({});
        setNotes({});
        setBookmarkedLessonIds([]);
        setActiveView('learningPath');
        setMessages([]);
    } else {
        resetStateForGuest(pathId);
    }
  }, [user, resetStateForGuest]);

  const handleSaveCustomProject = useCallback(({ name, goal, id }: { name: string, goal: string, id?: string }) => {
    if (id) { // Update
        setCustomProjects(prev => prev.map(p => p.id === id ? { ...p, name, goal } : p));
    } else { // Create
        const newProject: CustomProject = {
          id: `proj-${Date.now()}`,
          name,
          goal,
          chatHistory: [],
        };
        setCustomProjects(prev => [...prev, newProject]);
        setActiveCustomProjectId(newProject.id);
        setActiveView('customProject');
        setActiveMobileView('chat');
        
        const kickstartPrompt = `Start a new custom project with me.
        My project is called: "${name}"
        My main goal is: "${goal}"
        
        First, welcome me to my new project. Then, ask me about my current programming knowledge to understand my skill level. Finally, suggest a technology stack and the very first step to get started.`;
        
        handleSendMessage(kickstartPrompt, { 
          isSystemMessage: true, 
          initialHistory: [],
          targetId: newProject.id,
          targetView: 'customProject'
        });
    }
    setIsCreateModalOpen(false);
    setProjectToEdit(null);
  }, [handleSendMessage]);

  const handleDeleteCustomProject = useCallback(() => {
    if (!projectToDelete) return;

    setCustomProjects(prev => prev.filter(p => p.id !== projectToDelete.id));

    if (activeCustomProjectId === projectToDelete.id) {
        setActiveCustomProjectId(null);
        setMessages([]);
        setActiveView('learningPath');
    }
    setProjectToDelete(null);
  }, [projectToDelete, activeCustomProjectId]);

  const handleSelectCustomProject = useCallback((projectId: string) => {
    setActiveCustomProjectId(projectId);
    setActiveView('customProject');
    setActiveMobileView('chat');
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const activeLesson = useMemo(() => {
    if (!activeLessonId) return null;
    return learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []).find(l => l.id === activeLessonId) || null;
  }, [activeLessonId, learningPath]);


  if (authLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <CodeIcon className="w-16 h-16 text-primary-600 animate-pulse mx-auto" />
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{t('loading')}</p>
            </div>
        </div>
    );
  }

  if (!process.env.API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('apiKeyNotFound')}</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-300">{t('apiKeyNotFoundMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        points={points} 
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
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
          onNewProject={() => setIsCreateModalOpen(true)}
          onEditProject={setProjectToEdit}
          onDeleteProject={setProjectToDelete}
          isLoading={isLoading}
          uiLanguage={i18n.language}
          onUiLanguageChange={(lang) => i18n.changeLanguage(lang)}
          aiLanguage={aiLanguage}
          onAiLanguageChange={setAiLanguage}
        />
        <main className="flex flex-col flex-1 p-2 md:p-4 gap-4 overflow-hidden">
          {!user && (
            <div className="bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-lg text-sm text-center">
              <Trans i18nKey="guestModeMessage">
                You are in guest mode. <button onClick={handleLogin} className="font-bold underline hover:text-primary-600 dark:hover:text-primary-300">Login</button> to save your progress.
              </Trans>
            </div>
          )}

           {/* Mobile View Toggler */}
          <div className="md:hidden flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button 
                onClick={() => setActiveMobileView('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMobileView === 'chat' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <ChatBubbleIcon className="w-5 h-5"/> {t('tabs.chat')}
              </button>
              <button 
                onClick={() => setActiveMobileView('tools')}
                 className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMobileView === 'tools' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <CodeIcon className="w-5 h-5"/> {t('tabs.tools')}
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
            <div className={`flex flex-col min-h-0 ${activeMobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
              <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
            <div className={`flex flex-col min-h-0 ${activeMobileView === 'tools' ? 'flex' : 'hidden'} md:flex`}>
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 mb-2">
                <div className="flex items-center">
                  <button 
                    onClick={() => setActiveRightTab('playground')}
                    className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'playground' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <PlayIcon className="w-5 h-5"/> {t('tabs.playground')}
                  </button>
                  <button 
                    onClick={() => setActiveRightTab('notes')}
                    className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <NoteIcon className="w-5 h-5"/> {t('tabs.notes')}
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
      {(isCreateModalOpen || projectToEdit) && (
          <NewProjectModal 
            onClose={() => {
                setIsCreateModalOpen(false);
                setProjectToEdit(null);
            }}
            onSave={handleSaveCustomProject}
            initialData={projectToEdit}
          />
      )}
      {projectToDelete && (
        <ConfirmationModal
            title={t('deleteProjectModal.title')}
            message={t('deleteProjectModal.message', { projectName: projectToDelete.name })}
            onConfirm={handleDeleteCustomProject}
            onClose={() => setProjectToDelete(null)}
            confirmText={t('deleteProjectModal.confirm')}
        />
      )}
    </div>
  );
};

export default App;