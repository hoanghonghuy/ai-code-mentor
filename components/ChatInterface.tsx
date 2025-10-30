
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`|\`[^\`]*?\`)/g);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```(javascript|js|python|py|html|css|bash|sh)?\n?/, '').replace(/```$/, '');
          return <pre key={index} className="bg-gray-200 dark:bg-gray-800 p-3 rounded-md overflow-x-auto"><code className="font-mono text-sm">{code}</code></pre>;
        }
        if (part.startsWith('`')) {
            return <code key={index} className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded-md font-mono text-sm">{part.slice(1, -1)}</code>
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">AI Mentor Chat</h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
            <div className={`max-w-xl p-3 rounded-xl ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <SimpleMarkdown text={msg.parts[0].text} />
            </div>
            {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
          </div>
        ))}
         {isLoading && messages[messages.length - 1]?.role === 'user' && (
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor..."
            className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <SendIcon className="w-5 h-5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
   