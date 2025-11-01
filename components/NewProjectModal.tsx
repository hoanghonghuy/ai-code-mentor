import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SendIcon, BotIcon, UserIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { CustomProject, FileSystemNode, ChatMessage } from '../types';
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { SimpleMarkdown } from './MarkdownRenderer';


interface NewProjectModalProps {
  onClose: () => void;
  onScaffoldComplete: (name: string, goal: string, files: FileSystemNode[]) => void;
  ai: GoogleGenAI | null;
  aiLanguage: string;
}

const fileSystemNodeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: 'A unique identifier for the node (e.g., "file-1", "folder-1").' },
        name: { type: Type.STRING, description: 'The name of the file or folder (e.g., "index.html", "src").' },
        type: { type: Type.STRING, description: 'The type of the node, either "file" or "folder".' },
        content: { type: Type.STRING, description: 'The content of the file. This should be an empty string for folders.' },
        parentId: { type: Type.STRING, description: 'The ID of the parent folder. For root nodes, this should be null.' },
        children: {
            type: Type.ARRAY,
            description: 'An array of child nodes. This should be an empty array for files.',
            items: {
                // This creates a recursive definition
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    content: { type: Type.STRING },
                    parentId: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.OBJECT } } // Simplified recursion for schema
                }
            }
        },
    },
    required: ['id', 'name', 'type', 'parentId']
};

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onScaffoldComplete, ai, aiLanguage }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [projectDetails, setProjectDetails] = useState<{name: string, goal: string} | null>(null);

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeChat = async () => {
    if (!ai) return;

    setIsLoading(true);

    const languageMap: { [key: string]: string } = { 'en': 'English', 'vi': 'Vietnamese' };
    const responseLanguage = languageMap[aiLanguage] || 'English';

    const systemInstruction = `You are an AI assistant that helps users scaffold a new coding project. Your goal is to have a short conversation to understand what the user wants to build, and then generate the initial file structure for them.

    **Conversation Flow:**
    1.  Start by greeting the user and asking for the project's name and main goal.
    2.  Ask one or two clarifying questions if needed (e.g., "What technologies do you plan to use?").
    3.  Once you have a clear idea, confirm with the user (e.g., "Okay, so you want to build a [description]. Shall I generate the files for that?").
    4.  IMPORTANT: When the user confirms, your FINAL message MUST be the JSON object representing the file system, and NOTHING ELSE.
    
    **JSON Output Rules:**
    -   Your final response must be ONLY a valid JSON object. No markdown, no "Here is the JSON", just the raw JSON.
    -   The JSON must be an array of FileSystemNode objects.
    -   Each node must have \`id\`, \`name\`, \`type\`, \`parentId\`.
    -   Files must have a \`content\` property. Folders should have \`content: ""\` or not have it.
    -   Folders must have a \`children\` array. Files must have an empty \`children\` array.
    -   Root nodes must have \`parentId: null\`. Child nodes must have the \`id\` of their parent.
    -   Create sensible boilerplate content for files like index.html, package.json, etc.
    
    You MUST respond in ${responseLanguage}.`;

    chatSessionRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: fileSystemNodeSchema,
        }
      }
    });

    const initialBotMessage: ChatMessage = {
      role: 'model',
      parts: [{ text: t('newProjectModal.initialBotMessage') }]
    };
    setMessages([initialBotMessage]);
    setIsLoading(false);
  };
  
  useEffect(() => {
    initializeChat();
  }, [ai, aiLanguage, t]);

  const handleFinalGeneration = async () => {
      if (!chatSessionRef.current || !projectDetails) return;
      setIsLoading(true);
      
      try {
        // Send a final confirmation message to trigger the JSON-only response
        const result = await chatSessionRef.current.sendMessage({ message: "Yes, please generate the files." });
        const text = result.text.trim();
        
        try {
            const files = JSON.parse(text) as FileSystemNode[];
            onScaffoldComplete(projectDetails.name, projectDetails.goal, files);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", e);
             const errorMsg: ChatMessage = { role: 'model', parts: [{ text: "I'm sorry, I couldn't generate the project files correctly. Please try again."}]};
             setMessages(prev => [...prev, errorMsg]);
        }

      } catch (error) {
        console.error('Error generating files:', error);
      } finally {
        setIsLoading(false);
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && chatSessionRef.current) {
      const userInput = input.trim();
      setInput('');
      
      // Heuristic to capture project name/goal from early messages
      if (!projectDetails && messages.length < 4) {
          if (!projectDetails?.name && (userInput.toLowerCase().includes('name is') || userInput.toLowerCase().includes('call it'))) {
              setProjectDetails(prev => ({...prev, name: userInput, goal: prev?.goal || ''}));
          }
          if (!projectDetails?.goal && (userInput.toLowerCase().includes('build') || userInput.toLowerCase().includes('create'))) {
              setProjectDetails(prev => ({...prev, name: prev?.name || 'New Project', goal: userInput}));
          }
           if (messages.length === 2) {
                // Assume first user message is name, second is goal
                const name = messages[1].parts[0].text;
                setProjectDetails({ name: name, goal: userInput });
           }
      }

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
        
        // Heuristic to detect when the conversation is ready for generation
        if (text.toLowerCase().includes("shall i generate") || text.toLowerCase().includes("ready to create")) {
            setIsFinished(true);
        }

      } catch (error) {
        console.error("Error sending message to scaffolder:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold">{t('newProjectModal.scaffoldTitle')}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Chat Area */}
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
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
           {isFinished ? (
               <button
                  onClick={handleFinalGeneration}
                  disabled={isLoading || !projectDetails}
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300"
                >
                  {isLoading ? t('newProjectModal.generating') : t('newProjectModal.generateProject')}
                </button>
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

export default NewProjectModal;