import React, { useState, useRef, useEffect } from 'react';
import { CopyIcon, CheckIcon } from './icons';

// Add hljs to the window object for TypeScript
declare const hljs: any;

export const CodeBlock: React.FC<{ language: string; code: string; onCopy: () => void; copied: boolean; }> = ({ language, code, onCopy, copied }) => {
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


export const SimpleMarkdown: React.FC<{ text: string; searchQuery: string }> = ({ text, searchQuery }) => {
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
