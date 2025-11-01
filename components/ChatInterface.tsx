



import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SendIcon, UserIcon, BotIcon, LinkIcon, CopyIcon, CheckIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, XIcon, TrashIcon, UndoIcon, RedoIcon } from './icons';
import { SimpleMarkdown } from './MarkdownRenderer';
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