import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  // 1. Helper to parse inline elements: **bold**, *italic*, `code`
  const parseInline = (line: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    // Regex to find bold (**text** or __text__), italic (*text* or _text_), or inline code (`code`)
    const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Add preceding text
      if (match.index > lastIndex) {
        elements.push(line.substring(lastIndex, match.index));
      }
      // Add the matched element
      if (match[2] !== undefined) { // Bold
        elements.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[4] !== undefined) { // Italic
        elements.push(<em key={match.index}>{match[4]}</em>);
      } else if (match[6] !== undefined) { // Code
        elements.push(<code key={match.index} className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded-md font-mono text-sm">{match[6]}</code>);
      }
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }

    return <>{elements}</>;
  };

  // 2. Split text by code blocks to isolate them
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      {blocks.map((block, index) => {
        if (!block) return null;

        // 3. Render code blocks
        if (block.startsWith('```')) {
          const code = block.replace(/^```(?:javascript|js|python|py|html|css|bash|sh)?\n?/, '').replace(/```$/, '');
          return (
            <pre key={index} className="bg-gray-200 dark:bg-gray-800 p-3 my-2 rounded-md overflow-x-auto">
              <code className="font-mono text-sm">{code.trim()}</code>
            </pre>
          );
        }

        // 4. Process and render text blocks, splitting by paragraphs
        const paragraphs = block.trim().split(/\n{2,}/g);
        return paragraphs.map((para, paraIndex) => {
          if (!para.trim()) return null;

          const key = `${index}-${paraIndex}`;
          // 5. Check for lists
          const lines = para.split('\n');
          const isUnorderedList = lines.length > 0 && lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
          const isOrderedList = lines.length > 0 && lines.every(line => /^\d+\.\s/.test(line.trim()));

          if (isUnorderedList) {
            return (
              <ul key={key} className="list-disc pl-5 my-2 space-y-1">
                {lines.map((item, i) => (
                  <li key={i}>{parseInline(item.replace(/^(\*|-)\s/, ''))}</li>
                ))}
              </ul>
            );
          }

          if (isOrderedList) {
            return (
              <ol key={key} className="list-decimal pl-5 my-2 space-y-1">
                {lines.map((item, i) => (
                  <li key={i}>{parseInline(item.replace(/^\d+\.\s/, ''))}</li>
                ))}
              </ol>
            );
          }

          // 6. Render as a paragraph
          return <p key={key} className="my-2">{parseInline(para)}</p>;
        });
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