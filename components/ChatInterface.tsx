import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon, LinkIcon, CopyIcon, CheckIcon } from './icons';

// Add hljs to the window object for TypeScript
declare const hljs: any;

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const CodeBlock: React.FC<{ language: string; code: string; onCopy: () => void; copied: boolean; }> = ({ language, code, onCopy, copied }) => {
    const codeRef = useRef<HTMLElement>(null);
    const lang = language || 'plaintext';

    useEffect(() => {
        if (codeRef.current) {
            hljs.highlightElement(codeRef.current);
        }
    }, [code, lang]);

    return (
        <div className="relative group my-2 bg-gray-100 dark:bg-[#282c34] rounded-md overflow-hidden text-sm border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-900/50 px-3 py-1.5 border-b border-gray-300 dark:border-gray-700/50">
                <span className="text-xs font-sans text-gray-600 dark:text-gray-400">{lang}</span>
                <button
                    onClick={onCopy}
                    className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-500" />
                    ) : (
                        <CopyIcon className="w-4 h-4" />
                    )}
                </button>
            </div>
            <pre className="m-0 p-4 overflow-x-auto">
                <code ref={codeRef} className={`language-${lang}`}>
                    {code}
                </code>
            </pre>
        </div>
    );
};


const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlockIndex(index);
      setTimeout(() => {
        setCopiedBlockIndex(null);
      }, 2000);
    });
  };

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
          const langMatch = block.match(/^```(\w+)?\n?/);
          const lang = langMatch ? langMatch[1] : '';
          const code = block.replace(/^```(?:\w+)?\n?/, '').replace(/```$/, '').trim();
          return (
             <CodeBlock
                key={index}
                language={lang}
                code={code}
                copied={copiedBlockIndex === index}
                onCopy={() => handleCopyCode(code, index)}
            />
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedMessage, setCopiedMessage] = useState<{ index: number; type: 'text' | 'markdown' } | null>(null);

  useEffect(() => {
    const node = chatContainerRef.current;
    if (node) {
      // Only auto-scroll if the user is near the bottom.
      const isScrolledToBottom = node.scrollHeight - node.clientHeight <= node.scrollTop + 50;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);
  
  const handleCopyFullMessage = (text: string, index: number, type: 'text' | 'markdown') => {
    let contentToCopy = text;
    if (type === 'text') {
        // Basic markdown to text conversion
        contentToCopy = text
            .replace(/```[\s\S]*?```/g, (codeBlock) => codeBlock.replace(/```(.*?)\n/g, '').replace(/```/g, '')) // Keep code content
            .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
            .replace(/(\*|_)(.*?)\1/g, '$2')   // italic
            .replace(/(`)(.*?)\1/g, '$2')      // inline code
            .replace(/^#+\s/gm, '')           // headers
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // links
    }
    
    navigator.clipboard.writeText(contentToCopy).then(() => {
        setCopiedMessage({ index, type });
        setTimeout(() => setCopiedMessage(null), 2000);
    });
  };

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
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
            
            <div className="flex flex-col items-start max-w-xl">
                <div className="w-full group">
                    <div className={`rounded-xl ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <div className="p-3">
                         <SimpleMarkdown text={msg.parts[0].text} />
                      </div>
                       {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="border-t border-gray-300 dark:border-gray-600 mt-2 p-3">
                          <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <LinkIcon className="w-4 h-4" />
                            Sources
                          </h4>
                          <ul className="space-y-1">
                            {/* FIX: Check for chunk.web.uri as it is now optional in the type definition */}
                            {msg.groundingChunks.map((chunk, i) => chunk.web && chunk.web.uri && (
                              <li key={i} className="text-xs">
                                <a 
                                  href={chunk.web.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary-600 dark:text-primary-400 hover:underline truncate block"
                                  title={chunk.web.title}
                                >
                                  {chunk.web.title || chunk.web.uri}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                     {msg.role === 'model' && msg.parts[0].text && (
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={() => handleCopyFullMessage(msg.parts[0].text, index, 'text')}
                                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                aria-label="Copy message as plain text"
                            >
                                {copiedMessage?.index === index && copiedMessage?.type === 'text' ? (
                                    <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                    <CopyIcon className="w-3.5 h-3.5" />
                                )}
                                <span className="text-xs">{copiedMessage?.index === index && copiedMessage?.type === 'text' ? 'Copied' : 'Copy Text'}</span>
                            </button>
                             <button
                                onClick={() => handleCopyFullMessage(msg.parts[0].text, index, 'markdown')}
                                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                aria-label="Copy message as Markdown"
                            >
                                {copiedMessage?.index === index && copiedMessage?.type === 'markdown' ? (
                                    <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                    <CopyIcon className="w-3.5 h-3.5" />
                                )}
                                <span className="text-xs">{copiedMessage?.index === index && copiedMessage?.type === 'markdown' ? 'Copied' : 'Copy Markdown'}</span>
                            </button>
                        </div>
                    )}
                </div>
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