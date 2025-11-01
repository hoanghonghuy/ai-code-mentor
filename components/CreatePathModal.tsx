import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SendIcon, BotIcon, UserIcon, CodeIcon, BriefcaseIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { ChatMessage, LearningPath, LearningModule } from '../types';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SimpleMarkdown } from './MarkdownRenderer';
import { repairLearningPath, validateLearningPath } from '../services/pathService';

interface CreatePathModalProps {
  onClose: () => void;
  onPathCreated: (pathData: Omit<LearningPath, 'id'>) => void;
  ai: GoogleGenAI | null;
  aiLanguage: string;
}

const PathPreview: React.FC<{ path: Omit<LearningPath, 'id'> }> = ({ path }) => {
    return (
        <div className="space-y-3">
            {path.modules.map((module, index) => (
                <div key={index}>
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                        {module.project ? <BriefcaseIcon className="w-4 h-4 text-primary-500" /> : <CodeIcon className="w-4 h-4 text-primary-500" />}
                        {module.title}
                    </h4>
                    <ul className="pl-6 text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                        {(module.lessons || module.project?.steps || []).map(item => (
                            <li key={item.id} className="truncate">{item.title}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const CreatePathModal: React.FC<CreatePathModalProps> = ({ onClose, onPathCreated, ai, aiLanguage }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<Omit<LearningPath, 'id'> | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatedPath]);

  const initializeChat = async () => {
    if (!ai) return;

    setIsLoading(true);

    const languageMap: { [key: string]: string } = { 'en': 'English', 'vi': 'Vietnamese' };
    const responseLanguage = languageMap[aiLanguage] || 'English';

    const systemInstruction = `You are an AI Learning Path Designer. Your goal is to have a short conversation with a user to understand their learning goals and then generate a structured, personalized learning path for them.

    **Conversation Flow:**
    1.  Start by greeting the user and asking about their ultimate learning goal. Be encouraging.
    2.  Ask one or two essential clarifying questions to understand their current skill level and any specific technologies they are interested in.
    3.  Once you have a clear plan, confirm with the user (e.g., "Great! I can create a path for you on [topic]. I am ready to generate it.").
    4.  IMPORTANT: After the user confirms (e.g., they say "yes" or "go ahead"), your NEXT message MUST be the JSON object representing the learning path, and NOTHING ELSE.
    
    **JSON Output Rules:**
    -   Your final response must be ONLY a valid JSON object. No markdown, no "Here is the JSON", just the raw JSON.
    -   The JSON object must match the 'LearningPath' structure.
    -   It must have a 'title' (string) and 'modules' (array).
    -   Each module must have a 'title'. A module can have 'lessons' OR a 'project'. If project exists but steps is missing, set steps to an empty array [].
    -   Each lesson/project step MUST have: 'id' (string, e.g., "custom-1-1"), 'title' (string), 'prompt' (string), 'completed' (boolean, always false), and 'priority' (string, always "none").
    -   Generate between 3 to 6 modules for a concise but comprehensive path.
    -   Include at least one guided project module with 3-5 steps.
    
    You MUST respond in ${responseLanguage}.`;

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction }
    });

    const initialBotMessage: ChatMessage = {
      role: 'model',
      parts: [{ text: t('createPathModal.initialBotMessage') }]
    };
    setMessages([initialBotMessage]);
    setIsLoading(false);
  };
  
  useEffect(() => {
    initializeChat();
  }, [ai, aiLanguage, t]);

  // Normalize + repair before passing to onPathCreated
  const normalizeAndStart = (rawPath: Omit<LearningPath, 'id'>) => {
    // 1) Nếu module có project nhưng thiếu steps, gán steps = []
    const normalized: Omit<LearningPath, 'id'> = {
      title: rawPath.title || 'Custom Learning Path',
      description: rawPath.description || 'Custom learning path created by user',
      modules: (rawPath.modules || []).map((m: any) => {
        const hasLessons = Array.isArray(m.lessons);
        const hasProject = !!m.project && typeof m.project === 'object';
        const fixedProject = hasProject ? {
          title: m.project.title || 'Guided Project',
          description: m.project.description || '',
          steps: Array.isArray(m.project.steps) ? m.project.steps : []
        } : undefined;

        // Nếu module vừa không có lessons vừa không có steps → seed 1 lesson starter
        const finalLessons = hasLessons ? m.lessons : (!fixedProject || fixedProject.steps.length === 0) ? [
          { id: `lesson-${Date.now()}-${Math.random()}`, title: 'Introduction', prompt: 'Start here.', completed: false, priority: 'none' }
        ] : undefined;

        // Nếu cả lessons và project đều tồn tại → ưu tiên lessons để tránh double content
        return {
          title: m.title || 'Untitled Module',
          description: m.description || '',
          lessons: finalLessons,
          project: finalLessons ? undefined : fixedProject
        } as LearningModule;
      })
    };

    // 2) Sửa sâu bằng repairLearningPath
    const repaired = repairLearningPath(normalized) || normalized as any;

    // 3) Validate lần cuối (không chặn UI nếu fail; ta đã normalize rồi)
    if (!validateLearningPath({ ...repaired, id: 'temp' })) {
      console.warn('Normalized path still not strictly valid, proceeding with best-effort data.');
    }

    onPathCreated(repaired);
  };

  const handleStartPath = () => {
      if (generatedPath) {
          normalizeAndStart(generatedPath);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && chatSessionRef.current) {
      const userInput = input.trim();
      setInput('');

      const userMessage: ChatMessage = { role: 'user', parts: [{ text: userInput }] };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const result = await chatSessionRef.current.sendMessageStream({ message: userInput });
        
        let text = '';
        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        setMessages(prev => [...prev, modelMessage]);

        for await (const chunk of result) {
            text += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text }] };
                return newMessages;
            });
        }
        
        try {
            const cleanedText = text.trim().replace(/^```json\s*|```\s*$/g, '');
            if (cleanedText.startsWith('{')) {
                const parsedPath = JSON.parse(cleanedText) as Omit<LearningPath, 'id'>;
                if(parsedPath.title && parsedPath.modules) {
                    setGeneratedPath(parsedPath);
                    setIsFinished(true);
                }
            }
        } catch (error) {
           console.log("Not a JSON response, continuing conversation.");
        }

      } catch (error) {
        console.error("Error sending message to path creator:", error);
         const errorMsg: ChatMessage = { role: 'model', parts: [{ text: "I'm sorry, I ran into an error. Please try again."}]};
         setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">{t('createPathModal.title')}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
                <div className={`rounded-xl p-3 max-w-md ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                   <SimpleMarkdown text={msg.parts[0].text} searchQuery="" />
                </div>
                {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
              </div>
            ))}
            {isLoading && !isFinished && (
                 <div className="flex gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>
                    <div className="max-w-xl p-3 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse mr-1.5"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse mr-1.5 animation-delay-200"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse animation-delay-400"></div>
                    </div>
                </div>
            )}
            {isFinished && generatedPath && (
                 <div className="p-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-2">{t('createPathModal.preview')}</h3>
                    <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-md max-h-48 overflow-y-auto">
                        <PathPreview path={generatedPath} />
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
           {isFinished ? (
               <div className="space-y-2">
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400">{t('createPathModal.confirmMessage')}</p>
                    <button
                        onClick={handleStartPath}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300"
                        >
                        {isLoading ? t('createPathModal.starting') : t('createPathModal.startPath')}
                    </button>
               </div>
           ) : (
             <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
           )}
        </div>
      </div>
    </div>
  );
};

export default CreatePathModal;