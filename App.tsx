import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep, CustomProject, User, UserData, Priority, FileSystemNode, ProjectFolder, ProjectFile, Theme } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import CodeEditor from './components/CodeEditor';
import Notification from './components/Notification';
import { NoteIcon, PlayIcon, CodeIcon, ChatBubbleIcon, FilesIcon, EyeIcon } from './components/icons';
import { learningPaths } from './learningPaths';
import NotesPanel from './components/NotesPanel';
import NewProjectModal from './components/NewProjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, serverTimestamp } from './firebase';
import { useTranslation, Trans } from 'react-i18next';
import LivePreview from './components/LivePreview';
import ChallengeModal from './components/ChallengeModal';
import CreatePathModal from './components/CreatePathModal';

const GUEST_DATA_KEY = 'aiCodeMentorGuestData';
const THEME_KEY = 'ai-mentor-theme';
const API_KEY = process.env.API_KEY;

const getInitialAchievements = (pathTitle: string): Achievement[] => {
  const defs: Omit<Achievement, 'unlocked'>[] = [
    { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: 'TrophyIcon' },
    { id: 'first-module', name: 'Module Master', description: 'Complete all lessons in a module.', icon: 'TrophyIcon' },
    { id: 'bug-hunter', name: 'Bug Hunter', description: 'Run code for the first time.', icon: 'TrophyIcon' },
    { id: 'project-builder', name: 'Project Builder', description: 'Complete your first guided project.', icon: 'TrophyIcon' },
    { id: 'path-complete', name: `${pathTitle} Journeyman`, description: `Complete the entire ${pathTitle} path.`, icon: 'TrophyIcon' },
  ];
  return defs.map(a => ({ ...a, unlocked: false }));
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const getInitialLearningPath = (pathId: LearningPathId): LearningPath => {
  const std = learningPaths[pathId];
  if (!std) {
    console.warn(`Learning path '${pathId}' not found. Fallback to 'js-basics'.`);
    return clone(learningPaths['js-basics']);
  }
  return clone(std);
};

const defaultProjectFiles: FileSystemNode[] = [
  { id: 'file-1', name: 'index.html', type: 'file', content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>`, parentId: null },
  { id: 'file-2', name: 'style.css', type: 'file', content: `body {\n  font-family: sans-serif;\n}`, parentId: null },
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
    theme: (localStorage.getItem(THEME_KEY) as Theme) || 'dark',
    projectFiles: clone(defaultProjectFiles),
    openFileIds: ['file-1', 'file-3'],
    activeFileId: 'file-3',
    customLearningPaths: [],
  };
};

const findNodeAndParent = (nodes: FileSystemNode[], nodeId: string, parent: ProjectFolder | null = null): { node: FileSystemNode, parent: ProjectFolder | null } | null => {
  for (const node of nodes) {
    if (node.id === nodeId) return { node, parent };
    if (node.type === 'folder') {
      const found = findNodeAndParent(node.children, nodeId, node);
      if (found) return found;
    }
  }
  return null;
};

const getUniqueName = (nodes: FileSystemNode[], baseName: string, isFolder: boolean, parentId: string | null): string => {
  const findParent = (all: FileSystemNode[], pId: string): ProjectFolder | null => {
    for (const n of all) {
      if (n.id === pId && n.type === 'folder') return n;
      if (n.type === 'folder') {
        const f = findParent(n.children, pId);
        if (f) return f;
      }
    }
    return null;
  };
  const parentNode = parentId ? findParent(nodes, parentId) : null;
  const siblingNodes = parentNode ? parentNode.children : nodes.filter(n => n.parentId === null);

  const existing = new Set(siblingNodes.map(n => n.name));
  let finalName = baseName;
  let i = 1;
  const ext = isFolder ? '' : baseName.includes('.') ? `.${baseName.split('.').pop()}` : '';
  const base = isFolder ? baseName : baseName.includes('.') ? baseName.slice(0, baseName.lastIndexOf('.')) : baseName;
  while (existing.has(finalName)) {
    finalName = `${base} ${i}${ext}`;
    i++;
  }
  return finalName;
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const initialState = useMemo(() => getInitialState('js-basics'), []);

  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) as Theme) || 'dark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'learningPath' | 'customProject'>('learningPath');
  const [activeMainView, setActiveMainView] = useState<'chat' | 'tools'>('chat');

  const [activePathId, setActivePathId] = useState<string>(initialState.activePathId);
  const [learningPath, setLearningPath] = useState<LearningPath>(initialState.learningPath);
  const [customLearningPaths, setCustomLearningPaths] = useState<LearningPath[]>(initialState.customLearningPaths);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialState.activeLessonId);
  const [learningPathHistories, setLearningPathHistories] = useState<{ [key: string]: ChatMessage[] }>(initialState.learningPathHistories);
  const [isCreatePathModalOpen, setIsCreatePathModalOpen] = useState(false);

  const [customProjects, setCustomProjects] = useState<CustomProject[]>(initialState.customProjects);
  const [activeCustomProjectId, setActiveCustomProjectId] = useState<string | null>(initialState.activeCustomProjectId);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<CustomProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<CustomProject | null>(null);
  const [historyToClear, setHistoryToClear] = useState<{ view: 'learningPath' | 'customProject', id: string } | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<FileSystemNode | null>(null);
  const [challengeContent, setChallengeContent] = useState<string | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isChallengeLoading, setIsChallengeLoading] = useState(false);

  const [chatHistory, setChatHistory] = useState<{ [key: string]: { past: ChatMessage[][], future: ChatMessage[][] } }>({});

  const [points, setPoints] = useState(initialState.points);
  const [achievements, setAchievements] = useState<Achievement[]>(initialState.achievements);
  const [notification, setNotification] = useState<Achievement | null>(null);

  const [notes, setNotes] = useState<{ [key: string]: string }>(initialState.notes);
  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(initialState.bookmarkedLessonIds);
  const [customDocs, setCustomDocs] = useState<string[]>(initialState.customDocs);
  const [activeRightTab, setActiveRightTab] = useState<'codeEditor' | 'playground' | 'notes' | 'livePreview'>('codeEditor');

  const [projectFiles, setProjectFiles] = useState<FileSystemNode[]>(initialState.projectFiles);
  const [openFileIds, setOpenFileIds] = useState<string[]>(initialState.openFileIds);
  const [activeFileId, setActiveFileId] = useState<string | null>(initialState.activeFileId);
  const [projectOutput, setProjectOutput] = useState<{ run: any; analysis: string; explanation: string }>({ run: '', analysis: '', explanation: '' });
  const [livePreviewConsoleLogs, setLivePreviewConsoleLogs] = useState<any[]>([]);
  const [isProjectRunning, setIsProjectRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);

  const [aiLanguage, setAiLanguage] = useState(initialState.aiLanguage);

  const messagesRef = useRef<ChatMessage[]>();
  messagesRef.current = messages;
  const chatSessionRef = useRef<{ contextId: string; session: Chat } | null>(null);

  const ai = useMemo(() => (API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null), []);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    const light = document.getElementById('light-hljs-theme') as HTMLLinkElement | null;
    const dark = document.getElementById('dark-hljs-theme') as HTMLLinkElement | null;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (light) light.disabled = true;
      if (dark) dark.disabled = false;
    } else {
      document.documentElement.classList.remove('dark');
      if (light) light.disabled = false;
      if (dark) dark.disabled = true;
    }
  }, [theme]);

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'live-preview-console') {
        setLivePreviewConsoleLogs(prev => [...prev, { level: event.data.level, args: event.data.args }]);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  useEffect(() => {
    if (activeView === 'learningPath') {
      setMessages(learningPathHistories[activeLessonId || ''] || []);
    } else if (activeView === 'customProject' && activeCustomProjectId) {
      const p = customProjects.find(p => p.id === activeCustomProjectId);
      setMessages(p ? p.chatHistory : []);
    } else {
      setMessages([]);
    }
  }, [activeView, activeLessonId, activeCustomProjectId, learningPathHistories, customProjects]);

  const resetStateForGuest = useCallback((pathId: LearningPathId = 'js-basics') => {
    const fresh = getInitialState(pathId);
    setActivePathId(fresh.activePathId);
    setLearningPath(fresh.learningPath);
    setCustomLearningPaths(fresh.customLearningPaths);
    setActiveLessonId(fresh.activeLessonId);
    setLearningPathHistories(fresh.learningPathHistories);
    setCustomProjects(fresh.customProjects);
    setActiveCustomProjectId(fresh.activeCustomProjectId);
    setPoints(fresh.points);
    setAchievements(fresh.achievements);
    setNotes(fresh.notes);
    setBookmarkedLessonIds(fresh.bookmarkedLessonIds);
    setAiLanguage(fresh.aiLanguage);
    setTheme(fresh.theme);
    setProjectFiles(fresh.projectFiles);
    setOpenFileIds(fresh.openFileIds);
    setActiveFileId(fresh.activeFileId);
    setMessages([]);
    setActiveView('learningPath');
    setChatHistory({});
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        localStorage.removeItem(GUEST_DATA_KEY);
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as UserData;
          const fresh = getInitialState((data.activePathId as LearningPathId) || 'js-basics');
          setActivePathId(data.activePathId || fresh.activePathId);
          setLearningPath(data.learningPath || fresh.learningPath);
          setCustomLearningPaths(data.customLearningPaths || fresh.customLearningPaths);
          setActiveLessonId(data.activeLessonId || null);
          setLearningPathHistories(data.learningPathHistories || {});
          setCustomProjects(data.customProjects || []);
          setActiveCustomProjectId(data.activeCustomProjectId || null);
          setPoints(data.points || 0);
          setAchievements(data.achievements || getInitialAchievements(data.learningPath?.title || 'Learning Path'));
          setNotes(data.notes || {});
          setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
          setCustomDocs(data.customDocs || fresh.customDocs);
          setAiLanguage(data.aiLanguage || fresh.aiLanguage);
          setTheme(data.theme || fresh.theme);
          setProjectFiles(data.projectFiles || fresh.projectFiles);
          setOpenFileIds(data.openFileIds || fresh.openFileIds);
          setActiveFileId(data.activeFileId || fresh.activeFileId);
        } else {
          resetStateForGuest();
        }
        hasLoadedData.current = true;
      } else {
        setUser(null);
        hasLoadedData.current = false;
        const guestJson = localStorage.getItem(GUEST_DATA_KEY);
        if (guestJson) {
          try {
            const data = JSON.parse(guestJson) as UserData;
            const fresh = getInitialState((data.activePathId as LearningPathId) || 'js-basics');
            setActivePathId(data.activePathId || fresh.activePathId);
            setLearningPath(data.learningPath || fresh.learningPath);
            setCustomLearningPaths(data.customLearningPaths || fresh.customLearningPaths);
            setActiveLessonId(data.activeLessonId || null);
            setLearningPathHistories(data.learningPathHistories || {});
            setCustomProjects(data.customProjects || []);
            setActiveCustomProjectId(data.activeCustomProjectId || null);
            setPoints(data.points || 0);
            setAchievements(data.achievements?.length ? data.achievements : getInitialAchievements(data.learningPath?.title || 'Learning Path'));
            setNotes(data.notes || {});
            setBookmarkedLessonIds(data.bookmarkedLessonIds || []);
            setCustomDocs(data.customDocs || fresh.customDocs);
            setAiLanguage(data.aiLanguage || fresh.aiLanguage);
            setTheme((data.theme as Theme) || fresh.theme);
            setProjectFiles(data.projectFiles || fresh.projectFiles);
            setOpenFileIds(data.openFileIds || fresh.openFileIds);
            setActiveFileId(data.activeFileId || fresh.activeFileId);
          } catch (e) {
            console.error('Failed to parse guest data', e);
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

    const current: Omit<UserData, 'lastSaved'> = {
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
      theme,
      projectFiles,
      openFileIds,
      activeFileId,
      customLearningPaths,
    };

    const save = () => {
      if (user) {
        try {
          const toSave = { ...current, lastSaved: serverTimestamp() };
          setDoc(doc(db, 'users', user.uid), toSave, { merge: true });
        } catch (e) {
          console.error('Error saving user data:', e);
        }
      } else {
        try {
          localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(current));
        } catch (e) {
          console.error('Error saving guest data:', e);
        }
      }
    };

    const timer = setTimeout(save, 1500);
    return () => clearTimeout(timer);
  }, [user, authLoading, activePathId, learningPath, activeLessonId, learningPathHistories, customProjects, activeCustomProjectId, points, achievements, notes, bookmarkedLessonIds, customDocs, aiLanguage, theme, projectFiles, openFileIds, activeFileId, customLearningPaths]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error('Authentication error:', e); }
  };
  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error('Sign out error:', e); }
  };
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const createChatInstance = useCallback((history: ChatMessage[] = [], currentCustomDocs: string[] = []) => {
    if (!ai) return null;
    const languageMap: Record<string, string> = { en: 'English', vi: 'Vietnamese' };
    const responseLanguage = languageMap[aiLanguage] || 'English';
    const sanitizedHistory = history.map(({ role, parts }) => ({ role, parts: parts.map(p => ({ text: p.text })) }));
    let systemInstruction = `You are an expert AI programming mentor. Explain clearly, provide steps, analyze code, and give feedback. Use markdown code blocks. IMPORTANT: You MUST respond in ${responseLanguage}.`;
    if (currentCustomDocs?.length) {
      systemInstruction += `\n\nPrefer these docs when relevant:\n${currentCustomDocs.map(d => `- ${d}`).join('\n')}`;
    }
    return ai.chats.create({ model: 'gemini-2.5-flash', history: sanitizedHistory, config: { systemInstruction, tools: [{ googleSearch: {} }] } });
  }, [ai, aiLanguage]);

  const getChatSession = useCallback((contextId: string): Chat | null => {
    if (!ai) return null;
    if (chatSessionRef.current && chatSessionRef.current.contextId === contextId) return chatSessionRef.current.session;
    let history: ChatMessage[] = [];
    if (activeView === 'learningPath') history = learningPathHistories[contextId] || [];
    else if (activeView === 'customProject') history = (customProjects.find(p => p.id === contextId)?.chatHistory) || [];
    const session = createChatInstance(history, customDocs);
    if (session) chatSessionRef.current = { contextId, session };
    return session;
  }, [ai, activeView, learningPathHistories, customProjects, customDocs, createChatInstance]);

  const showNotification = (a: Achievement) => { setNotification(a); setTimeout(() => setNotification(null), 5000); };
  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const target = prev.find(a => a.id === id);
      if (target && !target.unlocked) { showNotification(target); return prev.map(a => a.id === id ? { ...a, unlocked: true } : a); }
      return prev;
    });
  }, []);

  const handleNoteChange = useCallback((lessonId: string, newNote: string) => setNotes(prev => ({ ...prev, [lessonId]: newNote })), []);
  const handleToggleBookmark = useCallback((lessonId: string) => setBookmarkedLessonIds(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]), []);
  const handleAddCustomDoc = useCallback((url: string) => setCustomDocs(prev => [...prev, url]), []);
  const handleRemoveCustomDoc = useCallback((i: number) => setCustomDocs(prev => prev.filter((_, idx) => idx !== i)), []);

  const handleSetPriority = useCallback((itemId: string, priority: Priority) => {
    setLearningPath(current => {
      const copy = clone(current);
      for (const m of copy.modules) {
        if (m.lessons) {
          const l = m.lessons.find((x: Lesson) => x.id === itemId);
          if (l) { l.priority = priority; return copy; }
        }
        if (m.project?.steps) {
          const s = m.project.steps.find((x: ProjectStep) => x.id === itemId);
          if (s) { s.priority = priority; return copy; }
        }
      }
      return copy;
    });
  }, []);

  const handleOpenFile = useCallback((fileId: string) => { setOpenFileIds(prev => prev.includes(fileId) ? prev : [...prev, fileId]); setActiveFileId(fileId); }, []);
  const handleCloseFile = useCallback((fileId: string) => {
    const idx = openFileIds.indexOf(fileId); if (idx === -1) return;
    const next = openFileIds.filter(id => id !== fileId); setOpenFileIds(next);
    if (activeFileId === fileId) setActiveFileId(next.length ? next[Math.max(0, idx - 1)] : null);
  }, [openFileIds, activeFileId]);
  const handleUpdateFileContent = useCallback((fileId: string, newContent: string) => {
    const upd = (nodes: FileSystemNode[]): FileSystemNode[] => nodes.map(n => n.type === 'file' && n.id === fileId ? { ...n, content: newContent } : (n.type === 'folder' ? { ...n, children: upd(n.children) } : n));
    setProjectFiles(prev => upd(prev));
  }, []);

  const addNodeToParent = (nodes: FileSystemNode[], parentId: string | null, newNode: FileSystemNode): FileSystemNode[] => {
    if (parentId === null) return [...nodes, newNode];
    return nodes.map(n => n.type === 'folder' ? (n.id === parentId ? { ...n, children: [...n.children, newNode], isOpen: true } : { ...n, children: addNodeToParent(n.children, parentId, newNode) }) : n);
  };
  const handleCreateFile = useCallback((parentId: string | null) => {
    const name = getUniqueName(projectFiles, 'untitled.txt', false, parentId);
    const newFile: ProjectFile = { id: `file-${Date.now()}`, name, type: 'file', content: '', parentId };
    setProjectFiles(prev => addNodeToParent(prev, parentId, newFile));
    handleOpenFile(newFile.id);
  }, [projectFiles, handleOpenFile]);
  const handleCreateFolder = useCallback((parentId: string | null) => {
    const name = getUniqueName(projectFiles, 'New Folder', true, parentId);
    const newFolder: ProjectFolder = { id: `folder-${Date.now()}`, name, type: 'folder', children: [], isOpen: true, parentId };
    setProjectFiles(prev => addNodeToParent(prev, parentId, newFolder));
  }, [projectFiles]);
  const renameNodeRecursive = (nodes: FileSystemNode[], id: string, name: string): FileSystemNode[] => nodes.map(n => n.id === id ? { ...n, name } : (n.type === 'folder' ? { ...n, children: renameNodeRecursive(n.children, id, name) } : n));
  const handleRenameNode = useCallback((id: string, name: string) => setProjectFiles(prev => renameNodeRecursive(prev, id, name)), []);
  const handleDeleteNode = useCallback((id: string) => { const r = findNodeAndParent(projectFiles, id); if (r) setNodeToDelete(r.node); }, [projectFiles]);
  const handleConfirmDeleteNode = useCallback(() => {
    if (!nodeToDelete) return;
    const del = (nodes: FileSystemNode[], id: string): { newNodes: FileSystemNode[], deletedFileIds: string[] } => {
      let deleted: string[] = [];
      const kept = nodes.filter(n => { if (n.id === id) { const collect = (x: FileSystemNode) => x.type === 'file' ? deleted.push(x.id) : x.children.forEach(collect); collect(n); return false; } return true; })
        .map(n => n.type === 'folder' ? (() => { const res = del(n.children, id); n.children = res.newNodes; deleted = deleted.concat(res.deletedFileIds); return n; })() : n);
      return { newNodes: kept, deletedFileIds: deleted };
    };
    const { newNodes, deletedFileIds } = del(clone(projectFiles), nodeToDelete.id);
    setProjectFiles(newNodes);
    const nextOpen = openFileIds.filter(id => !deletedFileIds.includes(id)); setOpenFileIds(nextOpen);
    if (activeFileId && deletedFileIds.includes(activeFileId)) setActiveFileId(nextOpen.length ? nextOpen[0] : null);
    setNodeToDelete(null);
  }, [nodeToDelete, projectFiles, openFileIds, activeFileId]);
  const handleMoveNode = useCallback((draggedId: string, targetFolderId: string | null) => {
    setProjectFiles(current => {
      const info = findNodeAndParent(current, draggedId); if (!info) return current;
      const dragged = info.node;
      if ((dragged.parentId ?? null) === targetFolderId) return current;
      if (dragged.type === 'folder' && targetFolderId) {
        let cur: string | null = targetFolderId; while (cur) { if (cur === dragged.id) { console.error('Invalid move'); return current; } const p = findNodeAndParent(current, cur); cur = p?.node.parentId ?? null; }
      }
      let nodeToMove: FileSystemNode | null = null;
      const remove = (nodes: FileSystemNode[], id: string): FileSystemNode[] => nodes.filter(n => { if (n.id === id) { nodeToMove = clone(n); return false; } if (n.type === 'folder') n.children = remove(n.children, id); return true; });
      let tree = remove(clone(current), draggedId);
      if (!nodeToMove) return current;
      nodeToMove.parentId = targetFolderId;
      nodeToMove.name = getUniqueName(tree, nodeToMove.name, nodeToMove.type === 'folder', targetFolderId);
      const add = (nodes: FileSystemNode[], parentId: string | null, newNode: FileSystemNode): FileSystemNode[] => parentId === null ? [...nodes, newNode] : nodes.map(n => n.type === 'folder' ? (n.id === parentId ? { ...n, children: [...n.children, newNode], isOpen: true } : { ...n, children: add(n.children, parentId, newNode) }) : n);
      tree = add(tree, targetFolderId, nodeToMove);
      return tree;
    });
  }, []);

  const serializeProject = (nodes: FileSystemNode[], indent = ''): string => nodes.map(n => n.type === 'file' ? `${indent}# File: ${n.name}\n${indent}\`\`\`\n${n.content}\n${indent}\`\`\`\n` : `${indent}# Folder: ${n.name}\n${serializeProject(n.children, indent + '  ')}`).join('\n');

  const handleRunProject = useCallback(async () => {
    if (!ai) { setProjectOutput(prev => ({ ...prev, run: { type: 'error', error: 'Gemini AI not initialized. Check API Key.' } })); return; }
    setIsProjectRunning(true); setProjectOutput(prev => ({ ...prev, run: t('playground.executing') }));
    const prompt = `You are a web project simulator...\n\nProject Files:\n${serializeProject(projectFiles)}`;
    try {
      const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      let raw = resp.text.trim();
      if (raw.startsWith('```json')) raw = raw.substring(7, raw.length - 3).trim(); else if (raw.startsWith('```')) raw = raw.substring(3, raw.length - 3).trim();
      try { setProjectOutput(prev => ({ ...prev, run: JSON.parse(raw) })); } catch { setProjectOutput(prev => ({ ...prev, run: { type: 'raw', rawText: raw || 'The AI returned an invalid format.' } })); }
    } catch (e) {
      console.error('Error executing project:', e); setProjectOutput(prev => ({ ...prev, run: { type: 'error', error: 'An unexpected error occurred while running the project.' } }));
    } finally { setIsProjectRunning(false); }
  }, [ai, projectFiles, t]);

  const handleAnalyzeCode = useCallback(async (code: string, language: string) => {
    if (!ai) { setProjectOutput(prev => ({ ...prev, analysis: 'Gemini AI not initialized. Check API Key.' })); return; }
    setIsAnalyzing(true); setProjectOutput(prev => ({ ...prev, analysis: t('codeEditor.analyzing') }));
    const prompt = `You are a code analysis tool...\n\n\`\`\`${language}\n${code}\n\`\`\``;
    try { const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); setProjectOutput(prev => ({ ...prev, analysis: resp.text })); }
    catch { setProjectOutput(prev => ({ ...prev, analysis: 'An unexpected error occurred while analyzing the code.' })); }
    finally { setIsAnalyzing(false); }
  }, [ai, t]);

  const handleExplainCode = useCallback(async (selected: string, ctx: string, language: string) => {
    if (!ai) { setProjectOutput(prev => ({ ...prev, explanation: 'Gemini AI not initialized. Check API Key.' })); return; }
    setIsAnalyzing(true); setProjectOutput(prev => ({ ...prev, explanation: t('codeEditor.analyzing') }));
    const prompt = `Explain the following code...\n\n**Code Snippet:**\n\`\`\`${language}\n${selected}\n\`\`\`\n\n**File Context:**\n\`\`\`${language}\n${ctx}\n\`\`\``;
    try { const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); setProjectOutput(prev => ({ ...prev, explanation: resp.text })); }
    catch { setProjectOutput(prev => ({ ...prev, explanation: 'An unexpected error occurred while explaining the code.' })); }
    finally { setIsAnalyzing(false); }
  }, [ai, t]);

  const handleSuggestCompletion = useCallback(async (code: string, fileId: string) => {
    if (!ai || !fileId) return; setIsSuggesting(true);
    const prompt = `Complete this code. Only output the completed code.\n\n${code}`;
    try { const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); handleUpdateFileContent(fileId, resp.text); }
    catch { setProjectOutput(prev => ({ ...prev, run: { type: 'error', error: 'An unexpected error occurred while suggesting code.' } })); }
    finally { setIsSuggesting(false); }
  }, [ai, handleUpdateFileContent]);

  const handleFormatCode = useCallback(async (fileId: string, code: string, language: string) => {
    if (!ai || !fileId) return; setIsFormatting(true);
    const prompt = `Format the following ${language} code. Output only formatted code.\n\n\`\`\`${language}\n${code}\n\`\`\``;
    try { const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); handleUpdateFileContent(fileId, resp.text); }
    catch { setProjectOutput(prev => ({ ...prev, run: { type: 'error', error: 'An unexpected error occurred while formatting code.' } })); }
    finally { setIsFormatting(false); }
  }, [ai, handleUpdateFileContent]);

  const handleSendMessage = useCallback(async (message: string, opts: { isSystemMessage?: boolean; initialHistory?: ChatMessage[]; targetId?: string; targetView?: 'learningPath' | 'customProject'; } = {}) => {
    const { isSystemMessage = false, initialHistory, targetId, targetView } = opts;
    setChatError(null);
    const viewContext = targetView || activeView;
    const idContext = targetId || (viewContext === 'learningPath' ? activeLessonId : activeCustomProjectId);
    if (!idContext) { setChatError(t('chat.sendError')); return; }
    const chat = getChatSession(idContext); if (!chat) { setChatError(t('chat.sendError')); return; }

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
    const baseHistory = initialHistory ?? (messagesRef.current || []);
    if (!isSystemMessage) setChatHistory(prev => ({ ...prev, [idContext]: { past: [...(prev[idContext]?.past || []), baseHistory], future: [] } }));

    const initialUI = isSystemMessage ? baseHistory : [...baseHistory, userMessage];
    setMessages(initialUI); setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message });
      let text = ''; let chunks: GroundingChunk[] = [];
      const modelMsg: ChatMessage = { role: 'model', parts: [{ text: '' }] };
      setMessages([...initialUI, modelMsg]);
      for await (const ck of stream) {
        text += ck.text;
        if (ck.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          chunks = ck.candidates[0].groundingMetadata.groundingChunks.map(c => ({ web: { uri: c.web?.uri, title: c.web?.title } })).filter(c => c.web && c.web.uri);
        }
        setMessages(prev => { const next = [...prev]; const last = next[next.length - 1]; if (last?.role === 'model') next[next.length - 1] = { ...last, parts: [{ text }], groundingChunks: chunks.length ? chunks : undefined }; return next; });
      }
    } catch (e) {
      console.error('sendMessage error', e); setChatError(t('chat.sendError')); setMessages(initialUI);
    } finally {
      setIsLoading(false);
      const final = messagesRef.current || [];
      const cleaned = final.map(m => { const c: ChatMessage = { role: m.role, parts: m.parts.map(p => ({ text: p.text })) }; if (m.groundingChunks) { const clean = m.groundingChunks.map(gc => ({ web: { uri: gc.web?.uri, title: gc.web?.title } })).filter(gc => gc.web && gc.web.uri); if (clean.length) c.groundingChunks = clean; } return c; });
      if (viewContext === 'learningPath') setLearningPathHistories(prev => ({ ...prev, [idContext]: cleaned }));
      else setCustomProjects(prev => prev.map(p => p.id === idContext ? { ...p, chatHistory: cleaned } : p));
    }
  }, [activeView, activeCustomProjectId, activeLessonId, t, getChatSession]);

  const handleFirstCodeRun = useCallback(() => unlockAchievement('bug-hunter'), [unlockAchievement]);

  const handleSelectLesson = useCallback((item: Lesson | ProjectStep) => {
    setActiveView('learningPath'); setActiveLessonId(item.id); setActiveMainView('chat');
    const history = learningPathHistories[item.id] || [];
    if (!history.length) handleSendMessage(item.prompt, { isSystemMessage: true, initialHistory: [], targetId: item.id, targetView: 'learningPath' });
    setLearningPath(current => {
      const copy = { ...current, modules: current.modules.map(m => {
        if (m.lessons?.find(l => l.id === item.id)) {
          const already = m.lessons.find(l => l.id === item.id)!.completed;
          const mm = { ...m, lessons: m.lessons.map(l => l.id === item.id ? { ...l, completed: true } : l) };
          if (!already) { setPoints(p => p + 10); unlockAchievement('first-lesson'); }
          return mm;
        } else if (m.project?.steps.find(s => s.id === item.id)) {
          const already = m.project.steps.find(s => s.id === item.id)!.completed;
          const mm = { ...m, project: { ...m.project, steps: m.project.steps.map(s => s.id === item.id ? { ...s, completed: true } : s) } };
          if (!already) { setPoints(p => p + 10); unlockAchievement('first-lesson'); }
          return mm;
        }
        return m;
      }) } as LearningPath;
      const updatedModule = copy.modules.find(m => m.lessons?.some(l => l.id === item.id) || m.project?.steps.some(s => s.id === item.id));
      if (updatedModule) {
        if (updatedModule.lessons?.every(l => l.completed)) unlockAchievement('first-module');
        if (updatedModule.project?.steps.every(s => s.completed)) unlockAchievement('project-builder');
      }
      const allItems = copy.modules.flatMap(m => m.lessons || m.project?.steps || []);
      if (allItems.every(i => i.completed)) unlockAchievement('path-complete');
      return copy;
    });
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [handleSendMessage, unlockAchievement, learningPathHistories]);

  // FIXED: handleSelectPath supports both standard and custom paths for guest & logged-in users
  const handleSelectPath = useCallback((pathId: string) => {
    const standardPath = learningPaths[pathId as LearningPathId];
    const customPath = customLearningPaths.find(p => p.id === pathId);
    const pathData = customPath || standardPath;
    if (!pathData) { console.error(`Path with id "${pathId}" not found.`); return; }
    const newPathData = clone(pathData);

    if (user) {
      if (!customPath) {
        // Logged-in + standard path: reset progress for this path
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
        // Logged-in + custom path: switch WITHOUT reset
        setActivePathId(pathId);
        setLearningPath(newPathData);
        setActiveLessonId(null);
        setActiveView('learningPath');
        setMessages([]);
      }
    } else {
      // Guest user: allow both standard and custom
      if (standardPath) {
        resetStateForGuest(pathId as LearningPathId);
      } else {
        // Guest + custom path from localStorage
        setActivePathId(pathId);
        setLearningPath(newPathData);
        setActiveLessonId(null);
        setActiveView('learningPath');
        setMessages([]);
      }
    }
  }, [user, resetStateForGuest, customLearningPaths]);

  // FIXED: create custom path without race conditions
  const handleCreateCustomPath = useCallback((pathData: Omit<LearningPath, 'id'>) => {
    const newPath: LearningPath = { ...pathData, id: `custom-${Date.now()}` };
    setCustomLearningPaths(prev => {
      const next = [...prev, newPath];
      // Switch to new path immediately using the newly created object (no lookup)
      setActivePathId(newPath.id);
      setLearningPath(newPath);
      setAchievements(getInitialAchievements(newPath.title));
      setPoints(0);
      setActiveLessonId(null);
      setLearningPathHistories({});
      setNotes({});
      setBookmarkedLessonIds([]);
      setActiveView('learningPath');
      setMessages([]);
      setChatHistory({});
      return next;
    });
    setIsCreatePathModalOpen(false);
  }, []);

  const handleCreateProjectFromScaffold = useCallback((name: string, goal: string, files: FileSystemNode[]) => {
    const newProject: CustomProject = { id: `proj-${Date.now()}`, name, goal, chatHistory: [] };
    setCustomProjects(prev => [...prev, newProject]);
    setProjectFiles(files);
    const firstFile = files.find(f => f.type === 'file') as ProjectFile | undefined;
    setOpenFileIds(firstFile ? [firstFile.id] : []);
    setActiveFileId(firstFile ? firstFile.id : null);
    setActiveCustomProjectId(newProject.id);
    setActiveView('customProject');
    setActiveMainView('tools');
    const kickstart = `I've just created a new project called "${name}" with the goal: "${goal}". You have generated the initial file structure for me. Now, please give me a brief overview of the files you created and suggest the first thing I should work on.`;
    handleSendMessage(kickstart, { isSystemMessage: true, initialHistory: [], targetId: newProject.id, targetView: 'customProject' });
    setIsCreateModalOpen(false);
  }, [handleSendMessage]);

  const handleDeleteCustomProject = useCallback(() => {
    if (!projectToDelete) return;
    setCustomProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
    if (activeCustomProjectId === projectToDelete.id) { setActiveCustomProjectId(null); setMessages([]); setActiveView('learningPath'); }
    setProjectToDelete(null);
  }, [projectToDelete, activeCustomProjectId]);

  const handleSelectCustomProject = useCallback((projectId: string) => { setActiveCustomProjectId(projectId); setActiveView('customProject'); setActiveMainView('chat'); if (window.innerWidth < 768) setSidebarOpen(false); }, []);
  const handleInitiateClearHistory = useCallback(() => { const id = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId; if (id && messages.length) setHistoryToClear({ view: activeView, id }); }, [activeView, activeLessonId, activeCustomProjectId, messages]);

  const handleConfirmClearHistory = useCallback(() => {
    if (!historyToClear) return; const { view, id } = historyToClear; chatSessionRef.current = null;
    setChatHistory(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (view === 'learningPath') {
      setLearningPathHistories(prev => { const n = { ...prev }; delete n[id]; return n; });
      const item = learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []).find(l => l.id === id);
      if (item) { setMessages([]); handleSendMessage(item.prompt, { isSystemMessage: true, initialHistory: [], targetId: item.id, targetView: 'learningPath' }); }
    } else {
      const proj = customProjects.find(p => p.id === id); if (proj) {
        setCustomProjects(prev => prev.map(p => p.id === id ? { ...p, chatHistory: [] } : p));
        const kickstart = `Start a new custom project with me. My project is called: "${proj.name}". My main goal is: "${proj.goal}". Ask my current knowledge, suggest a stack, and the first step.`;
        setMessages([]); handleSendMessage(kickstart, { isSystemMessage: true, initialHistory: [], targetId: proj.id, targetView: 'customProject' });
      }
    }
    setHistoryToClear(null);
  }, [historyToClear, learningPath, customProjects, handleSendMessage]);

  const handleUndo = useCallback(() => {
    const id = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId; if (!id) return;
    const ctx = chatHistory[id]; if (!ctx?.past.length) return;
    const newPast = ctx.past.slice(0, -1); const stateToRestore = ctx.past[ctx.past.length - 1];
    const currentState = messagesRef.current || []; const newFuture = [currentState, ...(ctx.future || [])];
    setMessages(stateToRestore);
    if (activeView === 'learningPath') setLearningPathHistories(prev => ({ ...prev, [id]: stateToRestore })); else setCustomProjects(prev => prev.map(p => p.id === id ? { ...p, chatHistory: stateToRestore } : p));
    setChatHistory(prev => ({ ...prev, [id]: { past: newPast, future: newFuture } }));
  }, [activeView, activeLessonId, activeCustomProjectId, chatHistory]);

  const handleRedo = useCallback(() => {
    const id = activeView === 'learningPath' ? activeLessonId : activeCustomProjectId; if (!id) return;
    const ctx = chatHistory[id]; if (!ctx?.future.length) return;
    const stateToRestore = ctx.future[0]; const newFuture = ctx.future.slice(1);
    const currentState = messagesRef.current || []; const newPast = [...(ctx.past || []), currentState];
    setMessages(stateToRestore);
    if (activeView === 'learningPath') setLearningPathHistories(prev => ({ ...prev, [id]: stateToRestore })); else setCustomProjects(prev => prev.map(p => p.id === id ? { ...p, chatHistory: stateToRestore } : p));
    setChatHistory(prev => ({ ...prev, [id]: { past: newPast, future: newFuture } }));
  }, [activeView, activeLessonId, activeCustomProjectId, chatHistory]);

  const activeLesson = useMemo(() => {
    if (!activeLessonId || !learningPath?.modules) return null;
    return learningPath.modules.flatMap(m => m.lessons || m.project?.steps || []).find(l => l.id === activeLessonId) || null;
  }, [activeLessonId, learningPath]);

  const handleRequestChallenge = useCallback(async () => {
    if (!ai || !activeLesson) return; setIsChallengeLoading(true);
    const prompt = `Based on the learning topic "${activeLesson.title}: ${activeLesson.prompt}", create a small, relevant coding challenge for a beginner.`;
    try { const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt }); setChallengeContent(resp.text); setIsChallengeModalOpen(true); }
    catch (e) { console.error('challenge error', e); }
    finally { setIsChallengeLoading(false); }
  }, [ai, activeLesson]);

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

  if (!API_KEY) {
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
      <Header theme={theme} toggleTheme={toggleTheme} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} points={points} user={user} onLogin={handleLogin} onLogout={handleLogout} />
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
          customLearningPaths={customLearningPaths}
          onNewPath={() => setIsCreatePathModalOpen(true)}
        />
        <main className="flex flex-col flex-1 p-2 md:p-4 gap-4 overflow-hidden">
          {!user && (
            <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-lg text-sm text-center">
              <Trans i18nKey="guestModeMessage">You are in guest mode. <button onClick={handleLogin} className="font-bold underline hover:text-primary-600 dark:hover:text-primary-300">Login</button> to save your progress.</Trans>
            </div>
          )}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button onClick={() => setActiveMainView('chat')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMainView === 'chat' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <ChatBubbleIcon className="w-5 h-5" /> {t('tabs.chat')}
              </button>
              <button onClick={() => setActiveMainView('tools')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeMainView === 'tools' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                <CodeIcon className="w-5 h-5" /> {t('tabs.tools')}
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`flex-1 flex flex-col min-h-0 ${activeMainView === 'chat' ? 'flex' : 'hidden'}`}>
              <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} onClearHistory={handleInitiateClearHistory} onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo} error={chatError} onClearError={() => setChatError(null)} onRequestChallenge={handleRequestChallenge} isChallengeLoading={isChallengeLoading} challengeDisabled={!activeLessonId} />
            </div>
            <div className={`flex-1 flex flex-col min-h-0 ${activeMainView === 'tools' ? 'flex' : 'hidden'}`}>
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 mb-2">
                <div className="flex items-center">
                  <button onClick={() => setActiveRightTab('codeEditor')} className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'codeEditor' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <FilesIcon className="w-5 h-5" /> {t('tabs.codeEditor')}
                  </button>
                  <button onClick={() => setActiveRightTab('livePreview')} className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'livePreview' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <EyeIcon className="w-5 h-5" /> {t('tabs.livePreview')}
                  </button>
                  <button onClick={() => setActiveRightTab('playground')} className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'playground' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <PlayIcon className="w-5 h-5" /> {t('tabs.playground')}
                  </button>
                  <button onClick={() => setActiveRightTab('notes')} className={`flex items-center gap-2 py-2 px-4 text-sm font-semibold border-b-2 ${activeRightTab === 'notes' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <NoteIcon className="w-5 h-5" /> {t('tabs.notes')}
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
                    isAnalyzing={isAnalyzing}
                    isSuggesting={isSuggesting}
                    isFormatting={isFormatting}
                    onAnalyzeCode={handleAnalyzeCode}
                    onSuggestCompletion={handleSuggestCompletion}
                    onExplainCode={handleExplainCode}
                    onFormatCode={handleFormatCode}
                    output={projectOutput}
                    onSetOutput={setProjectOutput}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onRenameNode={handleRenameNode}
                    onDeleteNode={handleDeleteNode}
                    onMoveNode={handleMoveNode}
                  />
                )}
                {activeRightTab === 'livePreview' && (<LivePreview files={projectFiles} consoleLogs={livePreviewConsoleLogs} onClearConsole={() => setLivePreviewConsoleLogs([])} />)}
                {activeRightTab === 'playground' && (<CodePlayground onFirstRun={handleFirstCodeRun} />)}
                {activeRightTab === 'notes' && (
                  <NotesPanel
                    note={activeLessonId ? notes[activeLessonId] || '' : ''}
                    onNoteChange={(n) => activeLessonId && handleNoteChange(activeLessonId, n)}
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
      {isCreateModalOpen && (
        <NewProjectModal onClose={() => setIsCreateModalOpen(false)} onScaffoldComplete={handleCreateProjectFromScaffold} ai={ai} aiLanguage={aiLanguage || 'en'} />
      )}
      {isCreatePathModalOpen && (
        <CreatePathModal onClose={() => setIsCreatePathModalOpen(false)} onPathCreated={handleCreateCustomPath} ai={ai} aiLanguage={aiLanguage || 'en'} />
      )}
      {projectToDelete && (
        <ConfirmationModal title={t('deleteProjectModal.title')} message={t('deleteProjectModal.message', { projectName: projectToDelete.name })} onConfirm={handleDeleteCustomProject} onClose={() => setProjectToDelete(null)} confirmText={t('deleteProjectModal.confirm')} />
      )}
      {historyToClear && (
        <ConfirmationModal title={t('clearHistoryModal.title')} message={t('clearHistoryModal.message')} onConfirm={handleConfirmClearHistory} onClose={() => setHistoryToClear(null)} confirmText={t('clearHistoryModal.confirm')} />
      )}
      {nodeToDelete && (
        <ConfirmationModal title={t('deleteNodeModal.title')} message={nodeToDelete.type === 'folder' ? t('deleteNodeModal.messageFolder', { nodeName: nodeToDelete.name }) : t('deleteNodeModal.messageFile', { nodeName: nodeToDelete.name })} onConfirm={handleConfirmDeleteNode} onClose={() => setNodeToDelete(null)} confirmText={t('deleteNodeModal.confirm')} />
      )}
      {isChallengeModalOpen && (
        <ChallengeModal isOpen={isChallengeModalOpen} onClose={() => setIsChallengeModalOpen(false)} challengeText={challengeContent} onSolve={() => setIsChallengeModalOpen(false)} />
      )}
    </div>
  );
};

export default App;
