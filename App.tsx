import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep, CustomProject, User, UserData, Priority, FileSystemNode, ProjectFolder, ProjectFile } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import CodeEditor from './components/CodeEditor';
import Notification from './components/Notification';
import { NoteIcon, PlayIcon, CodeIcon, ChatBubbleIcon, FilesIcon } from './components/icons';
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

const defaultProjectFiles: FileSystemNode[] = [
    { id: 'file-1', name: 'index.html', type: 'file', content: `<!DOCTYPE html>
<html>
<head>
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, World!</h1>
    <script src="script.js"></script>
</body>
</html>`, parentId: null },
    { id: 'file-2', name: 'style.css', type: 'file', content: `body {\n    font-family: sans-serif;\n}`, parentId: null },
    { id: 'file-3', name: 'script.js', type: 'file', content: `console.log('Hello from script.js!');`, parentId: null },
];


const getInitialState = (pathId: LearningPathId): Omit<UserData, 'lastSaved'> => {
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
    projectFiles: JSON.parse(JSON.stringify(defaultProjectFiles)),
    openFileIds: ['file-1', 'file-3'],
    activeFileId: 'file-3',
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
  const [chatError, setChatError] = useState<string | null>(null);
  
  // View mode state
  const [activeView, setActiveView] = useState<'learningPath' | 'customProject'>('learningPath');
  const [activeMainView, setActiveMainView] = useState<'chat' | 'tools'>('chat');

  // FIX: The getInitialState function was called without the required 'pathId' argument. Provided 'js-basics' as a default argument to correctly initialize the application state.
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
  const [historyToClear, setHistoryToClear] = useState<{ view: 'learningPath' | 'customProject', id: string } | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<FileSystemNode | null>(null);

  // Undo/Redo state - session only, not persisted
  const [chatHistory, setChatHistory] = useState<{ [key: string]: { past: ChatMessage[][], future: ChatMessage[][] } }>({});

  // Gamification State
  const [points, setPoints] = useState(initialState.points);
  const [achievements, setAchievements] = useState<Achievement[]>(initialState.achievements);
  const [notification, setNotification] = useState<Achievement | null>(null);

  // Tools State
  const [notes, setNotes] = useState<{ [key: string]: string }>(initialState.notes);
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(initialState.bookmarkedLessonIds);
  const [customDocs, setCustomDocs] = useState<string[]>(initialState.customDocs);
  const [activeRightTab, setActiveRightTab] = useState<'codeEditor' | 'playground' | 'notes'>('codeEditor');
  
  // Code Editor State
  const [projectFiles, setProjectFiles] = useState<FileSystemNode[]>(initialState.projectFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialState.openFileIds);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialState.activeFileId);
  const [projectOutput, setProjectOutput] = useState('');
  const [isProjectRunning, setIsProjectRunning] = useState(false);

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
      setProjectFiles(freshState.projectFiles);
      setOpenFileIds(freshState.openFileIds);
      setActiveFileId(freshState.activeFileId);
      setMessages([]);
      setActiveView('learningPath');
      setChatHistory({});
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
                const freshState = getInitialState(data.activePathId || 'js-basics');
                setActivePathId(data.activePathId || freshState.activePathId);
                setLearningPath(data.learningPath || freshState.learningPath);
                setActiveLessonId(data.activeLessonId || null);
                setLearningPathHistories(data.learningPathHistories || {});
                setCustomProjects(data.customProjects || []);
                setActiveCustomProjectId(data.activeCustomProjectId || null);
                setPoints(data.points || 0);
                setAchievements(data.achievements || getInitialAchievements(data.learningPath.title));
                setNotes(data.notes || {});
                setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
                setCustomDocs(data.customDocs || freshState.customDocs);
                setAiLanguage(data.aiLanguage || freshState.aiLanguage);
                setProjectFiles(data.projectFiles || freshState.projectFiles);
                setOpenFileIds(data.openFileIds || freshState.openFileIds);
                setActiveFileId(data.activeFileId || freshState.activeFileId);
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
                     const freshState = getInitialState(data.activePathId || 'js-basics');
                     setActivePathId(data.activePathId || freshState.activePathId);
                     setLearningPath(data.learningPath || freshState.learningPath);
                     setActiveLessonId(data.activeLessonId || null);
                     setLearningPathHistories(data.learningPathHistories || {});
                     setCustomProjects(data.customProjects || []);
                     setActiveCustomProjectId(data.activeCustomProjectId || null);
                     setPoints(data.points || 0);
                     setAchievements(data.achievements?.length ? data.achievements : getInitialAchievements(data.learningPath.title));
                     setNotes(data.notes || {});
                     setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
                     setCustomDocs(data.customDocs || freshState.customDocs);
                     setAiLanguage(data.aiLanguage || freshState.aiLanguage);
                     setProjectFiles(data.projectFiles || freshState.projectFiles);
                     setOpenFileIds(data.openFileIds || freshState.openFileIds);
                     setActiveFileId(data.activeFileId || freshState.activeFileId);
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
        projectFiles,
        openFileIds,
        activeFileId,
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
    notes, bookmarkedLessonIds, customDocs, aiLanguage,
    projectFiles, openFileIds, activeFileId
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

  const createChatInstance = useCallback((history: ChatMessage[] = [], currentCustomDocs: string[] = []) => {
     if (!ai) return null;
     const languageMap: { [key: string]: string } = {
        'en': 'English',
        'vi': 'Vietnamese'
     };
     const responseLanguage = languageMap[aiLanguage] || 'English';

     // Sanitize history to remove properties not expected by the API, like 'groundingChunks'
     const sanitizedHistory = history.map(({ role, parts }) => ({
        role,
        parts: parts.map(p => ({ text: p.text })), // Ensure parts are in the correct format
     }));
     
     let systemInstruction = `You are an expert AI programming mentor. 
        Your goal is to guide users through learning to code by building real projects. 
        Explain concepts clearly, provide step-by-step instructions, analyze code, and give constructive feedback. 
        Keep your explanations concise, friendly, and focused. 
        Use markdown for formatting, especially for code blocks (e.g., \`\`\`javascript).
        When a user starts a lesson, project step, or a new custom project, greet them and begin the process immediately.
        IMPORTANT: You MUST respond in ${responseLanguage}.`;
        
     if (currentCustomDocs && currentCustomDocs.length > 0) {
        systemInstruction += `\n\nAdditionally, when providing information or code examples, you should prioritize and heavily reference the following documentation sources provided by the user:\n${currentCustomDocs.map(doc => `- ${doc}`).join('\n')}`;
     }

     return ai.chats.create({
      model: 'gemini-2.5-flash',
      history: sanitizedHistory,
      config: {
        systemInstruction,
        tools: [{googleSearch: {}}],
      },
    });
  }, [ai, aiLanguage]);

  const getChatSession = useCallback((contextId: string): Chat | null => {
      if (!ai) return null;
      // If a session for the current context already exists, return it.
      if (chatSessionRef.current && chatSessionRef.current.contextId === contextId) {
          return chatSessionRef.current.session;
      }
      
      // Otherwise, create a new session. First, retrieve the persisted history for this context.
      let history: ChatMessage[] = [];
      if (activeView === 'learningPath') {
          history = learningPathHistories[contextId] || [];
      } else if (activeView === 'customProject') {
          const project = customProjects.find(p => p.id === contextId);
          history = project ? project.chatHistory : [];
      }

      // Create a new chat instance, seeding it with the sanitized, persisted history.
      const newSession = createChatInstance(history, customDocs); 
      if (newSession) {
        chatSessionRef.current = { contextId: contextId, session: newSession };
      }
      return newSession;
  }, [ai, createChatInstance, activeView, learningPathHistories, customProjects, customDocs]);


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

  const handleSetPriority = useCallback((itemId: string, priority: Priority) => {
    setLearningPath(currentPath => {
        const newPath = JSON.parse(JSON.stringify(currentPath));
        for (const module of newPath.modules) {
            if (module.lessons) {
                const lesson = module.lessons.find((l: Lesson) => l.id === itemId);
                if (lesson) {
                    lesson.priority = priority;
                    return newPath;
                }
            }
            if (module.project?.steps) {
                const step = module.project.steps.find((s: ProjectStep) => s.id === itemId);
                if (step) {
                    step.priority = priority;
                    return newPath;
                }
            }
        }
        return newPath;
    });
  }, []);

  // START: Code Editor Handlers
  const handleOpenFile = useCallback((fileId: string) => {
    setOpenFileIds(prev => prev.includes(fileId) ? prev : [...prev, fileId]);
    setActiveFileId(fileId);
  }, []);

  const handleCloseFile = useCallback((fileIdToClose: string) => {
    const fileIndex = openFileIds.indexOf(fileIdToClose);
    if (fileIndex === -1) return;

    const newOpenFileIds = openFileIds.filter(id => id !== fileIdToClose);
    setOpenFileIds(newOpenFileIds);
    
    if (activeFileId === fileIdToClose) {
      if (newOpenFileIds.length > 0) {
        // Activate the previous tab, or the next one if it was the first
        const newActiveIndex = Math.max(0, fileIndex - 1);
        setActiveFileId(newOpenFileIds[newActiveIndex]);
      } else {
        setActiveFileId(null);
      }
    }
  }, [openFileIds, activeFileId]);

  const handleUpdateFileContent = useCallback((fileId: string, newContent: string) => {
      const updateNode = (nodes: FileSystemNode[]): FileSystemNode[] => {
          return nodes.map(node => {
              if (node.id === fileId && node.type === 'file') {
                  return { ...node, content: newContent };
              }
              if (node.type === 'folder') {
                  return { ...node, children: updateNode(node.children) };
              }
              return node;
          });
      };
      setProjectFiles(prev => updateNode(prev));
  }, []);

  const getUniqueName = (nodes: FileSystemNode[], baseName: string, isFolder: boolean, parentId: string | null): string => {
      const siblingNodes = parentId 
          ? (findNodeAndParent(nodes, parentId)?.node as ProjectFolder)?.children || [] 
          : nodes;
  
      const existingNames = new Set(siblingNodes.map(n => n.name));
  
      let finalName = baseName;
      let counter = 1;
      const extension = isFolder ? '' : baseName.includes('.') ? `.${baseName.split('.').pop()}` : '';
      const nameWithoutExt = isFolder ? baseName : baseName.includes('.') ? baseName.slice(0, baseName.lastIndexOf('.')) : baseName;
  
      while (existingNames.has(finalName)) {
          finalName = `${nameWithoutExt} ${counter}${extension}`;
          counter++;
      }
      return finalName;
  };
  
  const findNodeAndParent = (nodes: FileSystemNode[], nodeId: string, parent: ProjectFolder | null = null): { node: FileSystemNode, parent: ProjectFolder | null } | null => {
      for (const node of nodes) {
          if (node.id === nodeId) {
              return { node, parent };
          }
          if (node.type === 'folder') {
              const found = findNodeAndParent(node.children, nodeId, node);
              if (found) return found;
          }
      }
      return null;
  };
  
  const addNodeToParent = (nodes: FileSystemNode[], parentId: string | null, newNode: FileSystemNode): FileSystemNode[] => {
      if (parentId === null) {
          return [...nodes, newNode];
      }
      return nodes.map(node => {
          if (node.id === parentId && node.type === 'folder') {
              return { ...node, children: [...node.children, newNode], isOpen: true }; 
          }
          if (node.type === 'folder') {
              return { ...node, children: addNodeToParent(node.children, parentId, newNode) };
          }
          return node;
      });
  };

  const handleCreateFile = useCallback((parentId: string | null) => {
    const newName = getUniqueName(projectFiles, 'untitled.txt', false, parentId);
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: newName,
      type: 'file',
      content: '',
      parentId,
    };
    setProjectFiles(prev => addNodeToParent(prev, parentId, newFile));
    handleOpenFile(newFile.id);
  }, [projectFiles, handleOpenFile]);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    const newName = getUniqueName(projectFiles, 'New Folder', true, parentId);
    const newFolder: ProjectFolder = {
      id: `folder-${Date.now()}`,
      name: newName,
      type: 'folder',
      children: [],
      isOpen: true,
      parentId,
    };
    setProjectFiles(prev => addNodeToParent(prev, parentId, newFolder));
  }, [projectFiles]);

  const renameNodeRecursive = (nodes: FileSystemNode[], nodeId: string, newName: string): FileSystemNode[] => {
      return nodes.map(node => {
          if (node.id === nodeId) {
              return { ...node, name: newName };
          }
          if (node.type === 'folder') {
              return { ...node, children: renameNodeRecursive(node.children, nodeId, newName) };
          }
          return node;
      });
  };

  const handleRenameNode = useCallback((nodeId: string, newName: string) => {
      setProjectFiles(prev => renameNodeRecursive(prev, nodeId, newName));
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
      const findResult = findNodeAndParent(projectFiles, nodeId);
      if (findResult) {
          setNodeToDelete(findResult.node);
      }
  }, [projectFiles]);

  const handleConfirmDeleteNode = useCallback(() => {
    if (!nodeToDelete) return;

    const deleteNodeRecursive = (nodes: FileSystemNode[], nodeId: string): { newNodes: FileSystemNode[], deletedFileIds: string[] } => {
        let deletedFileIds: string[] = [];
        const newNodes = nodes.filter(node => {
            if (node.id === nodeId) {
                const collectIds = (n: FileSystemNode) => {
                    if (n.type === 'file') {
                        deletedFileIds.push(n.id);
                    } else { // folder
                        n.children.forEach(collectIds);
                    }
                };
                collectIds(node);
                return false; // filter it out
            }
            return true;
        }).map(node => {
            if (node.type === 'folder') {
                const result = deleteNodeRecursive(node.children, nodeId);
                node.children = result.newNodes;
                deletedFileIds = [...deletedFileIds, ...result.deletedFileIds];
            }
            return node;
        });
        return { newNodes, deletedFileIds };
    };

    const { newNodes, deletedFileIds } = deleteNodeRecursive(JSON.parse(JSON.stringify(projectFiles)), nodeToDelete.id);

    setProjectFiles(newNodes);

    const newOpenFileIds = openFileIds.filter(id => !deletedFileIds.includes(id));
    setOpenFileIds(newOpenFileIds);
    if (activeFileId && deletedFileIds.includes(activeFileId)) {
        setActiveFileId(newOpenFileIds.length > 0 ? newOpenFileIds[0] : null);
    }

    setNodeToDelete(null);
  }, [nodeToDelete, projectFiles, openFileIds, activeFileId]);
  
  const serializeProject = (nodes: FileSystemNode[], indent = ''): string => {
    return nodes.map(node => {
        if (node.type === 'file') {
            return `${indent}# File: ${node.name}\n${indent}\`\`\`\n${node.content}\n${indent}\`\`\`\n`;
        } else { // folder
            return `${indent}# Folder: ${node.name}\n${serializeProject(node.children, indent + '  ')}`;
        }
    }).join('\n');
  };

  const handleRunProject = useCallback(async () => {
    if (!ai) {
        setProjectOutput("Error: Gemini AI not initialized. Check API Key.");
        return;
    };

    setIsProjectRunning(true);
    setProjectOutput(t('playground.executing'));
    
    const projectStructure = serializeProject(projectFiles);
    const prompt = `Analyze the following project structure and files. Provide a simulated output as if it were running in a browser or console. Explain what the project does and how the files interact.

Project Files:
${projectStructure}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setProjectOutput(response.text.trim());
    } catch (error) {
      console.error('Error executing project:', error);
      setProjectOutput('An unexpected error occurred while running the project.');
    } finally {
      setIsProjectRunning(false);
    }
  }, [ai, projectFiles, t]);
  // END: Code Editor Handlers

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
    setChatError(null);
    const viewContext = targetView || activeView;
    const idContext = targetId || (viewContext === 'learningPath' ? activeLessonId : activeCustomProjectId);

    if (!idContext) {
      console.error("handleSendMessage called without a valid context ID.");
      setChatError(t('chat.sendError'));
      return;
    }
    
    const chat = getChatSession(idContext);
    if (!chat) {
        console.error("Could not get a chat session.");
        setChatError(t('chat.sendError'));
        return;
    }

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    
    const baseHistory = initialHistory ?? (messagesRef.current || []);

    if (!isSystemMessage) {
        setChatHistory(prev => {
            const contextHistory = prev[idContext] || { past: [], future: [] };
            return {
                ...prev,
                [idContext]: {
                    past: [...contextHistory.past, baseHistory],
                    future: [] // Any new message clears the redo history
                }
            };
        });
    }

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
      setChatError(t('chat.sendError'));
      // Revert to the state before sending the message on error
      setMessages(initialMessagesForUI);
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
    setActiveMainView('chat');

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
        setChatHistory({});
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
        setActiveMainView('chat');
        
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
    setActiveMainView('chat');
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleInitiateClearHistory = useCallback(() => {
    const view = activeView;
    const id = view === 'learningPath' ? activeLessonId : activeCustomProjectId;
    if (id && messages.length > 0) {
        setHistoryToClear({ view, id });
    }
  }, [activeView, activeLessonId, activeCustomProjectId, messages]);

  const handleConfirmClearHistory = useCallback(() => {
    if (!historyToClear) return;

    const { view, id } = historyToClear;
    chatSessionRef.current = null; // Force recreation of chat session

    // Clear the undo/redo history for this context
    setChatHistory(prev => {
        const newHistoryState = { ...prev };
        delete newHistoryState[id];
        return newHistoryState;
    });

    if (view === 'learningPath') {
        setLearningPathHistories(prev => {
            const newHistories = { ...prev };
            delete newHistories[id];
            return newHistories;
        });

        const item = learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []).find(l => l.id === id);
        if (item) {
            setMessages([]);
            handleSendMessage(item.prompt, {
                isSystemMessage: true,
                initialHistory: [],
                targetId: item.id,
                targetView: 'learningPath'
            });
        }
    } else if (view === 'customProject') {
        const project = customProjects.find(p => p.id === id);
        if (project) {
            setCustomProjects(prev => prev.map(p => p.id === id ? { ...p, chatHistory: [] } : p));

            const kickstartPrompt = `Start a new custom project with me.
            My project is called: "${project.name}"
            My main goal is: "${project.goal}"
            
            First, welcome me to my new project. Then, ask me about my current programming knowledge to understand my skill level. Finally, suggest a technology stack and the very first step to get started.`;
            
            setMessages([]);
            handleSendMessage(kickstartPrompt, {
                isSystemMessage: true,
                initialHistory: [],
                targetId: project.id,
                targetView: 'customProject'
            });
        }
    }

    setHistoryToClear(null);
  }, [historyToClear, learningPath, customProjects, handleSendMessage]);

  const handleUndo = useCallback(() => {
    const contextId = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId;
    if (!contextId) return;

    const contextHistory = chatHistory[contextId];
    if (!contextHistory || contextHistory.past.length === 0) return;

    const newPast = contextHistory.past.slice(0, -1);
    const stateToRestore = contextHistory.past[contextHistory.past.length - 1];

    const currentState = messagesRef.current || [];
    const newFuture = [currentState, ...(contextHistory.future || [])];

    setMessages(stateToRestore); // Update UI immediately

    if (activeView === 'learningPath') {
        setLearningPathHistories(prev => ({ ...prev, [contextId]: stateToRestore }));
    } else {
        setCustomProjects(prev => prev.map(p => p.id === contextId ? { ...p, chatHistory: stateToRestore } : p));
    }
    
    setChatHistory(prev => ({ ...prev, [contextId]: { past: newPast, future: newFuture } }));
  }, [activeView, activeLessonId, activeCustomProjectId, chatHistory]);

  const handleRedo = useCallback(() => {
      const contextId = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId;
      if (!contextId) return;

      const contextHistory = chatHistory[contextId];
      if (!contextHistory || contextHistory.future.length === 0) return;

      const stateToRestore = contextHistory.future[0];
      const newFuture = contextHistory.future.slice(1);

      const currentState = messagesRef.current || [];
      const newPast = [...(contextHistory.past || []), currentState];

      setMessages(stateToRestore); // Update UI immediately

      if (activeView === 'learningPath') {
          setLearningPathHistories(prev => ({ ...prev, [contextId]: stateToRestore }));
      } else {
          setCustomProjects(prev => prev.map(p => p.id === contextId ? { ...p, chatHistory: stateToRestore } : p));
      }

      setChatHistory(prev => ({ ...prev, [contextId]: { past: newPast, future: newFuture } }));
  }, [activeView, activeLessonId, activeCustomProjectId, chatHistory]);


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

  const currentContextId = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId;
  const canUndo = !!(currentContextId && chatHistory[currentContextId]?.past.length > 0);
  const canRedo = !!(currentContextId && chatHistory[currentContextId]?.future.length > 0);


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
          onSetPriority={handleSetPriority}
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
            <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-lg text-sm text-center">
              <Trans i18nKey="guestModeMessage">
                You are in guest mode. <button onClick={handleLogin} className="font-bold underline hover:text-primary-600 dark:hover:text-primary-300">Login</button> to save your progress.
              </Trans>
            </div>
          )}

           {/* Main View Toggler */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button 
                onClick={() => setActiveMainView('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMainView === 'chat' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <ChatBubbleIcon className="w-5 h-5"/> {t('tabs.chat')}
              </button>
              <button 
                onClick={() => setActiveMainView('tools')}
                 className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMainView === 'tools' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <CodeIcon className="w-5 h-5"/> {t('tabs.tools')}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`flex-1 flex flex-col min-h-0 ${activeMainView === 'chat' ? 'flex' : 'hidden'}`}>
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                onClearHistory={handleInitiateClearHistory}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                error={chatError}
                onClearError={() => setChatError(null)}
              />
            </div>
            <div className={`flex-1 flex flex-col min-h-0 ${activeMainView === 'tools' ? 'flex' : 'hidden'}`}>
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 mb-2">
                <div className="flex items-center">
                  <button 
                    onClick={() => setActiveRightTab('codeEditor')}
                    className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'codeEditor' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <FilesIcon className="w-5 h-5"/> {t('tabs.codeEditor')}
                  </button>
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
                {activeRightTab === 'codeEditor' && (
                  <CodeEditor 
                    files={projectFiles}
                    openFileIds={openFileIds}
                    activeFileId={activeFileId}
                    onOpenFile={handleOpenFile}
                    onCloseFile={handleCloseFile}
                    onSetActiveFile={setActiveFileId}
                    onUpdateFileContent={handleUpdateFileContent}
                    onRunProject={handleRunProject}
                    isRunning={isProjectRunning}
                    output={projectOutput}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onRenameNode={handleRenameNode}
                    onDeleteNode={handleDeleteNode}
                  />
                )}
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
      {historyToClear && (
        <ConfirmationModal
            title={t('clearHistoryModal.title')}
            message={t('clearHistoryModal.message')}
            onConfirm={handleConfirmClearHistory}
            onClose={() => setHistoryToClear(null)}
            confirmText={t('clearHistoryModal.confirm')}
        />
      )}
      {nodeToDelete && (
        <ConfirmationModal
            title={t('deleteNodeModal.title')}
            message={nodeToDelete.type === 'folder' ? t('deleteNodeModal.messageFolder', { nodeName: nodeToDelete.name }) : t('deleteNodeModal.messageFile', { nodeName: nodeToDelete.name })}
            onConfirm={handleConfirmDeleteNode}
            onClose={() => setNodeToDelete(null)}
            confirmText={t('deleteNodeModal.confirm')}
        />
      )}
    </div>
  );
};

export default App;