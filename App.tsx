import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { LearningPath, Lesson, ChatMessage, Achievement, GroundingChunk, LearningPathId, ProjectStep, CustomProject, User, UserData, Priority, FileSystemNode, ProjectFolder, ProjectFile, Theme } from './types';
import Header from './components/Header';
import LearningPathView from './components/LearningPathView';
import ChatInterface from './components/ChatInterface';
import CodePlayground from './components/CodePlayground';
import CodeEditor from './components/CodeEditor';
import Notification from './components/Notification';
import { CodeIcon, ChatBubbleIcon, FilesIcon, EyeIcon, PlayIcon, NoteIcon } from './components/icons';
import NotesPanel from './components/NotesPanel';
import NewProjectModal from './components/NewProjectModal';
import ConfirmationModal from './components/ConfirmationModal';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import { useTranslation, Trans } from 'react-i18next';
import LivePreview from './components/LivePreview';
import ChallengeModal from './components/ChallengeModal';
import CreatePathModal from './components/CreatePathModal';

import { getStandardPath, getStandardPaths, getAllPathItems } from './services/pathService';
import { saveUserData, loadUserData, clearUserData } from './services/storageService';
import { usePathManagement } from './hooks/usePathManagement';
import { safeArray, safeString, deepClone } from './utils/guards';

const THEME_KEY = 'ai-mentor-theme';
const API_KEY = process.env.API_KEY || process.env.REACT_APP_API_KEY || process.env.VITE_API_KEY || (import.meta as any)?.env?.VITE_API_KEY || '';

const getInitialAchievements = (pathTitle: string): Achievement[] => [
  { id: 'first-lesson', name: 'First Step', description: 'Complete your first lesson.', icon: 'TrophyIcon', unlocked: false },
  { id: 'first-module', name: 'Module Master', description: 'Complete all lessons in a module.', icon: 'TrophyIcon', unlocked: false },
  { id: 'bug-hunter', name: 'Bug Hunter', description: 'Run code for the first time.', icon: 'TrophyIcon', unlocked: false },
  { id: 'project-builder', name: 'Project Builder', description: 'Complete your first guided project.', icon: 'TrophyIcon', unlocked: false },
  { id: 'path-complete', name: `${pathTitle} Journeyman`, description: `Complete the entire ${pathTitle} path.`, icon: 'TrophyIcon', unlocked: false },
];

const defaultProjectFiles: FileSystemNode[] = [
  { id: 'file-1', name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>', parentId: null },
  { id: 'file-2', name: 'style.css', type: 'file', content: 'body {\n  font-family: sans-serif;\n}', parentId: null },
  { id: 'file-3', name: 'script.js', type: 'file', content: "console.log('Hello from script.js!');", parentId: null },
];

const getInitialState = (pathId: LearningPathId): Omit<UserData, 'lastSaved'> => {
  const path = getStandardPath(pathId);
  const allItems = getAllPathItems(path);
  const firstItemId = allItems[0]?.id || null;
  return {
    activePathId: pathId,
    learningPath: path,
    activeLessonId: firstItemId, // Auto-select bài đầu tiên
    learningPathHistories: {},
    customProjects: [],
    activeCustomProjectId: null,
    points: 0,
    achievements: getInitialAchievements(path.title),
    notes: {},
    bookmarkedLessonIds: [],
    customDocs: ['https://react.dev', 'https://developer.mozilla.org/'],
    aiLanguage: 'en',
    theme: (typeof window !== 'undefined' ? (localStorage.getItem(THEME_KEY) as Theme) : 'dark') || 'dark',
    projectFiles: deepClone(defaultProjectFiles),
    openFileIds: ['file-1', 'file-3'],
    activeFileId: 'file-3',
    customLearningPaths: [],
  };
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

  // States
  const [user, setUser] = useState(null as any);
  const [authLoading, setAuthLoading] = useState(true);
  const initialState = useMemo(() => getInitialState('js-basics'), []);

  const [theme, setTheme] = useState<Theme>(() => (typeof window !== 'undefined' ? (localStorage.getItem(THEME_KEY) as Theme) : 'dark') || 'dark');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar mặc định mở
  const [chatError, setChatError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'learningPath' | 'customProject'>('learningPath');
  const [activeMainView, setActiveMainView] = useState<'chat' | 'tools'>('chat');

  const [activePathId, setActivePathId] = useState<string>(initialState.activePathId);
  const [learningPath, setLearningPath] = useState<LearningPath>(initialState.learningPath);
  const [customLearningPaths, setCustomLearningPaths] = useState<LearningPath[]>(initialState.customLearningPaths);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(initialState.activeLessonId); // auto-selected
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

  const ai = useMemo(() => { try { return API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null; } catch { return null; } }, []);
  const hasLoadedData = useRef(false);

  const resetStateForGuest = useCallback((pathId: LearningPathId = 'js-basics') => {
    const freshState = getInitialState(pathId);
    setActivePathId(freshState.activePathId);
    setLearningPath(freshState.learningPath);
    setCustomLearningPaths(freshState.customLearningPaths);
    setActiveLessonId(freshState.activeLessonId); // auto-select
    setLearningPathHistories(freshState.learningPathHistories);
    setCustomProjects(freshState.customProjects);
    setActiveCustomProjectId(freshState.activeCustomProjectId);
    setPoints(freshState.points);
    setAchievements(freshState.achievements);
    setNotes(freshState.notes);
    setBookmarkedLessonIds(freshState.bookmarkedLessonIds);
    setAiLanguage(freshState.aiLanguage);
    setTheme(freshState.theme);
    setProjectFiles(freshState.projectFiles);
    setOpenFileIds(freshState.openFileIds);
    setActiveFileId(freshState.activeFileId);
    setMessages([]);
    setActiveView('learningPath');
    setChatHistory({});
    setSidebarOpen(true); // luôn mở sidebar sau reset
  }, []);

  const { handleSelectPath, handleCreateCustomPath } = usePathManagement(
    user,
    { activePathId, learningPath, customLearningPaths },
    {
      setActivePathId,
      setLearningPath,
      setCustomLearningPaths,
      setAchievements,
      setPoints,
      setActiveLessonId,
      setLearningPathHistories,
      setNotes,
      setBookmarkedLessonIds,
      setActiveView,
      setMessages,
      setChatHistory,
      resetStateForGuest,
    }
  );

  // Auto-load guest/remote data
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        clearUserData(null);
        setUser(currentUser);
        const userData = await loadUserData(currentUser);
        if (userData) {
          setActivePathId(userData.activePathId || initialState.activePathId);
          setLearningPath(userData.learningPath || initialState.learningPath);
          setCustomLearningPaths(safeArray(userData.customLearningPaths));
          setActiveLessonId(userData.activeLessonId || initialState.activeLessonId); // auto-select nếu trống
        } else { resetStateForGuest('js-basics'); }
        hasLoadedData.current = true;
      } else {
        setUser(null);
        hasLoadedData.current = false;
        const userData = await loadUserData(null);
        if (userData) {
          setActivePathId(userData.activePathId || initialState.activePathId);
          setLearningPath(userData.learningPath || initialState.learningPath);
          setCustomLearningPaths(safeArray(userData.customLearningPaths));
          setActiveLessonId(userData.activeLessonId || initialState.activeLessonId);
        } else { resetStateForGuest('js-basics'); }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [initialState, resetStateForGuest]);

  // Save state
  useEffect(() => {
    if (authLoading) return; if (user && !hasLoadedData.current) return;
    const currentState: Omit<UserData, 'lastSaved'> = {
      activePathId, learningPath, activeLessonId, learningPathHistories, customProjects, activeCustomProjectId,
      points, achievements, notes, bookmarkedLessonIds, customDocs, aiLanguage, theme, projectFiles, openFileIds, activeFileId, customLearningPaths,
    };
    const timer = setTimeout(() => { saveUserData(user, currentState).catch(console.error); }, 1200);
    return () => clearTimeout(timer);
  }, [user, authLoading, activePathId, learningPath, activeLessonId, learningPathHistories, customProjects, activeCustomProjectId, points, achievements, notes, bookmarkedLessonIds, customDocs, aiLanguage, theme, projectFiles, openFileIds, activeFileId, customLearningPaths]);

  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };
  const handleLogout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleSelectLesson = useCallback((item: Lesson | ProjectStep) => {
    setActiveView('learningPath'); setActiveLessonId(item.id); setActiveMainView('chat');
  }, []);

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
          allPaths={getStandardPaths()}
          activePathId={activePathId}
          onSelectPath={handleSelectPath}
          bookmarkedLessonIds={bookmarkedLessonIds}
          onToggleBookmark={(id) => setBookmarkedLessonIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onSetPriority={() => {}}
          customDocs={customDocs}
          onAddDoc={(url) => setCustomDocs(prev => [...prev, url])}
          onRemoveDoc={(i) => setCustomDocs(prev => prev.filter((_, idx) => idx !== i))}
          customProjects={customProjects}
          activeCustomProjectId={activeCustomProjectId}
          onSelectCustomProject={(id) => { setActiveCustomProjectId(id); setActiveView('customProject'); }}
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
          onDeleteCustomPath={() => {}}
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
              <ChatInterface messages={messages} onSendMessage={async (m)=>{ if(!ai){ setChatError('Gemini AI not initialized'); return; } }} isLoading={isLoading} onClearHistory={()=>{}} onUndo={()=>{}} onRedo={()=>{}} canUndo={false} canRedo={false} error={chatError} onClearError={()=>setChatError(null)} onRequestChallenge={()=>{}} isChallengeLoading={isChallengeLoading} challengeDisabled={!activeLessonId} />
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
                {activeRightTab === 'livePreview' && (<LivePreview files={projectFiles} consoleLogs={livePreviewConsoleLogs} onClearConsole={() => setLivePreviewConsoleLogs([])} />)}
                {activeRightTab === 'notes' && (
                  <NotesPanel
                    note={activeLessonId ? notes[activeLessonId] || '' : ''}
                    onNoteChange={(n) => activeLessonId && setNotes(prev => ({ ...prev, [activeLessonId]: n }))}
                    activeLessonTitle={safeString(getAllPathItems(learningPath).find(l => l.id === activeLessonId)?.title)}
                    disabled={activeView === 'customProject'}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Notification achievement={notification} />
      {isCreateModalOpen && (<NewProjectModal onClose={() => setIsCreateModalOpen(false)} onScaffoldComplete={()=>{}} ai={ai} aiLanguage={aiLanguage || 'en'} />)}
      {isCreatePathModalOpen && (<CreatePathModal onClose={() => setIsCreatePathModalOpen(false)} onPathCreated={handleCreateCustomPath} ai={ai} aiLanguage={aiLanguage || 'en'} />)}
      {projectToDelete && (<ConfirmationModal title={t('deleteProjectModal.title')} message={t('deleteProjectModal.message', { projectName: projectToDelete.name })} onConfirm={() => { setCustomProjects(prev => prev.filter(p => p.id !== projectToDelete.id)); setProjectToDelete(null); }} onClose={() => setProjectToDelete(null)} confirmText={t('deleteProjectModal.confirm')} />)}
    </div>
  );
};

export default App;