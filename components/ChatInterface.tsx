


import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon, LinkIcon, CopyIcon, CheckIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, XIcon, TrashIcon, UndoIcon, RedoIcon } from './icons';
import { useTranslation } from 'react-i18next';

// Add hljs to the window object for TypeScript
declare const hljs: any;

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onClearHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  error: string | null;
  onClearError: () => void;
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


const SimpleMarkdown: React.FC<{ text: string; searchQuery: string }> = ({ text, searchQuery }) => {
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlockIndex(index);
      setTimeout(() => {
        setCopiedBlockIndex(null);
      }, 2000);
    });
  };

    const highlightText = (textSegment: string): React.ReactNode => {
        if (!searchQuery.trim() || !textSegment) {
            return textSegment;
        }
        // Escape special characters for regex
        const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        
        if (!regex.test(textSegment)) {
            return textSegment;
        }

        const parts = textSegment.split(regex);
        
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 text-black rounded px-0.5">{part}</mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

  const parseInline = (line: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|(`)(.*?)\5/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(highlightText(line.substring(lastIndex, match.index)));
      }
      if (match[2] !== undefined) {
        elements.push(<strong key={match.index}>{highlightText(match[2])}</strong>);
      } else if (match[4] !== undefined) {
        elements.push(<em key={match.index}>{highlightText(match[4])}</em>);
      } else if (match[6] !== undefined) {
        elements.push(<code key={match.index} className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded-md font-mono text-sm">{match[6]}</code>);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(highlightText(line.substring(lastIndex)));
    }

    return <>{elements}</>;
  };
  
  const renderTextBlock = (block: string, blockIndex: number) => {
    const elements: React.ReactNode[] = [];
    const lines = block.trim().split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      const headingMatch = line.match(/^(#{1,6})\s(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        // FIX: Dynamically create heading tags using React.createElement
        // to avoid JSX namespace and component casing issues.
        const tag = `h${level}`;
        elements.push(React.createElement(tag, { key: `${blockIndex}-${i}`, className: "my-2 font-bold" }, parseInline(headingMatch[2])));
        i++;
        continue;
      }

      if (line.match(/^(---|___|\*\*\*)$/)) {
        elements.push(<hr key={`${blockIndex}-${i}`} className="my-4 border-gray-300 dark:border-gray-600" />);
        i++;
        continue;
      }

      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].substring(2));
          i++;
        }
        elements.push(<blockquote key={`${blockIndex}-${i}-bq`} className="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-2 italic text-gray-600 dark:text-gray-400">{renderTextBlock(quoteLines.join('\n'), i)}</blockquote>);
        continue;
      }

      if (line.match(/^(\*|-)\s/)) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length && lines[i].match(/^(\*|-)\s/)) {
          listItems.push(<li key={`${blockIndex}-${i}`}>{parseInline(lines[i].replace(/^(\*|-)\s/, ''))}</li>);
          i++;
        }
        elements.push(<ul key={`${blockIndex}-${i}-ul`} className="list-disc pl-5 my-2 space-y-1">{listItems}</ul>);
        continue;
      }

      if (line.match(/^\d+\.\s/)) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
          listItems.push(<li key={`${blockIndex}-${i}`}>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>);
          i++;
        }
        elements.push(<ol key={`${blockIndex}-${i}-ol`} className="list-decimal pl-5 my-2 space-y-1">{listItems}</ol>);
        continue;
      }

      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        if (lines[i].match(/^(#|>|(\*|-)\s|\d+\.\s|---|___|\*\*\*|```)/)) break;
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        elements.push(<p key={`${blockIndex}-${i}-p`} className="my-2">{parseInline(paraLines.join(' '))}</p>);
      }
      
      while (i < lines.length && lines[i].trim() === '') {
        i++;
      }
    }
    return elements;
  };

  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      {blocks.map((block, index) => {
        if (!block) return null;

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

        return renderTextBlock(block, index);
      })}
    </div>
  );
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onClearHistory, onUndo, onRedo, canUndo, canRedo, error, onClearError }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [copiedMessage, setCopiedMessage] = useState<{ index: number; type: 'text' | 'markdown' } | null>(null);
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  
  // Effect for auto-scrolling
  useEffect(() => {
    const node = chatContainerRef.current;
    if (node && !isSearchOpen) { // Only auto-scroll when not searching
      const isScrolledToBottom = node.scrollHeight - node.clientHeight <= node.scrollTop + 50;
      if (isScrolledToBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isSearchOpen]);
  
   // Effect for real-time search with debouncing to prevent hangs
  useEffect(() => {
    if (!isSearchOpen) {
        setSearchResults([]);
        setCurrentResultIndex(-1);
        return;
    }

    // Debounce the search logic to avoid performance issues during message streaming
    const handler = setTimeout(() => {
      if (searchQuery.trim() === '') {
          setSearchResults([]);
          setCurrentResultIndex(-1);
          return;
      }
      const results = messages
          .map((msg, index) => 
              msg.parts[0].text.toLowerCase().includes(searchQuery.toLowerCase()) ? index : -1
          )
          .filter(index => index !== -1);
      
      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : -1);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, messages, isSearchOpen]);

  // Effect for scrolling to search result
  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults.length > 0) {
        const messageIndex = searchResults[currentResultIndex];
        messageRefs.current[messageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentResultIndex, searchResults]);

  const handleToggleSearch = () => {
    setIsSearchOpen(prev => !prev);
    if(isSearchOpen) setSearchQuery('');
  };

  const handleNavigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    if (direction === 'next') {
        setCurrentResultIndex(prev => (prev + 1) % searchResults.length);
    } else {
        setCurrentResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    }
  };


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

  messageRefs.current = [];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{t('chat.title')}</h2>
        <div className="flex items-center gap-2">
           <button
            onClick={onUndo}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('chat.undo')}
            disabled={!canUndo || isLoading}
            title={t('chat.undo')}
          >
              <UndoIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onRedo}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('chat.redo')}
            disabled={!canRedo || isLoading}
            title={t('chat.redo')}
          >
              <RedoIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClearHistory}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('chat.clearHistory')}
            disabled={isLoading || messages.length === 0}
            title={t('chat.clearHistory')}
          >
              <TrashIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleSearch}
            className={`p-2 rounded-md ${isSearchOpen ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            aria-label="Search messages"
          >
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
       {isSearchOpen && (
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-gray-400" />
                </span>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('chat.searchPlaceholder')}
                    className="w-full p-1.5 pl-8 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                />
            </div>
            <button onClick={() => handleNavigateSearch('prev')} disabled={searchResults.length < 2} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronUpIcon className="w-5 h-5"/></button>
            <button onClick={() => handleNavigateSearch('next')} disabled={searchResults.length < 2} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"><ChevronDownIcon className="w-5 h-5"/></button>
            <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-center">
              {searchResults.length > 0 ? t('chat.searchResults', { current: currentResultIndex + 1, total: searchResults.length }) : searchQuery ? t('chat.noResults') : ''}
            </span>
            <button onClick={handleToggleSearch} className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><XIcon className="w-5 h-5"/></button>
          </div>
        </div>
      )}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg, index) => {
           const activeSearchResultIndex = searchResults.length > 0 ? searchResults[currentResultIndex] : -1;
           const isCurrentSearchResult = index === activeSearchResultIndex;

           return (
              <div 
                key={index} 
                ref={el => { if(el) messageRefs.current[index] = el }}
                className={`flex gap-3 transition-colors duration-300 p-2 rounded-lg ${msg.role === 'user' ? 'justify-end' : ''} ${isCurrentSearchResult ? 'bg-primary-500/10' : ''}`}
              >
                {msg.role === 'model' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary-500 flex items-center justify-center"><BotIcon className="w-5 h-5 text-white" /></div>}
                
                <div className="flex flex-col max-w-4xl">
                    <div className="group">
                        <div className={`rounded-xl ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          <div className="p-3">
                            {msg.role === 'model' && index === messages.length - 1 && isLoading ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                    <p>{msg.parts[0].text}<span className="inline-block w-2 h-4 bg-gray-800 dark:bg-gray-200 animate-pulse ml-1 align-bottom"></span></p>
                                </div>
                            ) : (
                                <SimpleMarkdown text={msg.parts[0].text} searchQuery={isSearchOpen ? searchQuery : ''} />
                            )}
                          </div>
                           {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                            <div className="border-t border-gray-300 dark:border-gray-600 mt-2 p-3">
                              <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <LinkIcon className="w-4 h-4" />
                                {t('chat.sources')}
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
                                    <span className="text-xs">{copiedMessage?.index === index && copiedMessage?.type === 'text' ? t('chat.copied') : t('chat.copyText')}</span>
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
                                    <span className="text-xs">{copiedMessage?.index === index && copiedMessage?.type === 'markdown' ? t('chat.copied') : t('chat.copyMarkdown')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {msg.role === 'user' && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5" /></div>}
              </div>
        )})}
         {isLoading && messages[messages.length - 1]?.role === 'user' && (
             <div className="flex gap-3 p-2">
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
        {error && (
          <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm flex items-center justify-between">
            <p><span className="font-bold">{t('chat.errorTitle')}:</span> {error}</p>
            <button onClick={onClearError} className="p-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <SendIcon className="w-5 h-5" />
            <span>{t('chat.send')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;