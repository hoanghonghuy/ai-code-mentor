import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SendIcon, BotIcon, UserIcon, CodeIcon, BriefcaseIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { ChatMessage, LearningPath, LearningModule } from '../types';
import { GoogleGenAI, Chat, Type } from "@google/genai";
import { SimpleMarkdown } from './MarkdownRenderer';

interface CreatePathModalProps {
  onClose: () => void;
  onPathCreated: (pathData: Omit<LearningPath, 'id'>) => void;
  ai: GoogleGenAI | null;
  aiLanguage: string;
}

const PathPreview: React.FC<{ path: Omit<LearningPath, 'id'> }> = ({ path }) => {
    // FIXED: Safe array handling to prevent undefined errors
    const safeModules = Array.isArray(path.modules) ? path.modules : [];
    
    return (
        <div className="space-y-3">
            {safeModules.map((module, index) => {
                // FIXED: Safe handling of lessons and project steps
                const lessons = Array.isArray(module.lessons) ? module.lessons : [];
                const projectSteps = Array.isArray(module.project?.steps) ? module.project.steps : [];
                const items = [...lessons, ...projectSteps];
                
                return (
                    <div key={index}>
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            {module.project ? <BriefcaseIcon className="w-4 h-4 text-primary-500" /> : <CodeIcon className="w-4 h-4 text-primary-500" />}
                            {module.title || 'Untitled Module'}
                        </h4>
                        <ul className="pl-6 text-xs list-disc list-inside text-gray-600 dark:text-gray-400">
                            {items.map((item, itemIndex) => (
                                <li key={item.id || `item-${itemIndex}`} className="truncate">{item.title || 'Untitled Item'}</li>
                            ))}
                        </ul>
                    </div>
                );
            })}
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
    -   Each module must have a 'title'. A module can have 'lessons' OR a 'project', but not both.
    -   Each lesson/project step MUST have: 'id' (string, e.g., "custom-1-1"), 'title' (string), 'prompt' (string, a good starting prompt for the AI mentor), 'completed' (boolean, always false), and 'priority' (string, always "none").
    -   Generate between 3 to 6 modules for a concise but comprehensive path.
    -   Include at least one guided project module.
    
    You MUST respond in ${responseLanguage}.`;

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction
      }
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

  const handleStartPath = () => {
      if (generatedPath) {
          onPathCreated(generatedPath);
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
                // FIXED: Validate the parsed path structure before setting it
                if (parsedPath && typeof parsedPath === 'object' && parsedPath.title && Array.isArray(parsedPath.modules)) {
                    // Additional validation to ensure modules have proper structure
                    const validModules = parsedPath.modules.every(module => 
                        module && typeof module === 'object' && module.title
                    );
                    
                    if (validModules) {
                        setGeneratedPath(parsedPath);
                        setIsFinished(true);
                    } else {
                        console.warn('Generated path has invalid module structure');
                    }
                } else {
                    console.warn('Generated path has invalid structure');
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