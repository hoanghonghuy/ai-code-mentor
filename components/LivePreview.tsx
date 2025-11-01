import React, { useMemo, useState } from 'react';
import type { FileSystemNode, ProjectFile } from '../types';
import { useTranslation } from 'react-i18next';

interface LivePreviewProps {
  files: FileSystemNode[];
  consoleLogs: any[];
  onClearConsole: () => void;
}

const findFileByName = (nodes: FileSystemNode[], name: string): ProjectFile | null => {
  for (const node of nodes) {
    if (node.type === 'file' && node.name.toLowerCase() === name.toLowerCase()) {
      return node;
    }
    if (node.type === 'folder') {
      const found = findFileByName(node.children, name);
      if (found) return found;
    }
  }
  return null;
};

const LivePreview: React.FC<LivePreviewProps> = ({ files, consoleLogs, onClearConsole }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');

  const srcDoc = useMemo(() => {
    const htmlFile = findFileByName(files, 'index.html');
    const cssFile = findFileByName(files, 'style.css');
    const jsFile = findFileByName(files, 'script.js');

    if (!htmlFile) {
      return `
        <body style="font-family: sans-serif; color: #555; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb;">
            <p>No <code>index.html</code> file found in your project.</p>
        </body>
      `;
    }

    let htmlContent = htmlFile.content;

    // Inject CSS
    if (cssFile) {
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      } else {
        htmlContent += styleTag;
      }
    }
    
    // Inject proxy for console.log
    const consoleProxyScript = `
      <script>
        const originalConsoleLog = console.log;
        const originalConsoleWarn = console.warn;
        const originalConsoleError = console.error;
        const originalConsoleInfo = console.info;

        const postMessageProxy = (level) => (...args) => {
          window.parent.postMessage({
            source: 'live-preview-console',
            level: level,
            args: args.map(arg => {
              // Basic serialization, can be improved
              if (arg instanceof Error) {
                return { __error: true, message: arg.message, stack: arg.stack };
              }
              try {
                // Attempt to clone, will fail on complex objects but handles many cases
                return JSON.parse(JSON.stringify(arg));
              } catch (e) {
                return String(arg);
              }
            })
          }, '*');
        };

        console.log = (...args) => { originalConsoleLog.apply(console, args); postMessageProxy('log')(...args); };
        console.warn = (...args) => { originalConsoleWarn.apply(console, args); postMessageProxy('warn')(...args); };
        console.error = (...args) => { originalConsoleError.apply(console, args); postMessageProxy('error')(...args); };
        console.info = (...args) => { originalConsoleInfo.apply(console, args); postMessageProxy('info')(...args); };
        
        window.addEventListener('error', (event) => {
            console.error(event.message, 'at', event.filename, ':', event.lineno);
        });
      </script>
    `;

    if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head>\n${consoleProxyScript}`);
    } else {
        htmlContent = `${consoleProxyScript}${htmlContent}`;
    }


    // Inject JavaScript
    if (jsFile) {
      const scriptTag = `<script>\ntry {\n${jsFile.content}\n} catch (e) { console.error(e); }\n</script>`;
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        htmlContent += scriptTag;
      }
    }

    return htmlContent;
  }, [files]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
             <div className="flex items-center">
                <button onClick={() => setActiveTab('preview')} className={`py-2 px-4 text-xs font-semibold border-b-2 ${activeTab === 'preview' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{t('tabs.livePreview')}</button>
                <button onClick={() => setActiveTab('console')} className={`py-2 px-4 text-xs font-semibold border-b-2 ${activeTab === 'console' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{t('tabs.console')}</button>
             </div>
             {activeTab === 'console' && (
                <button onClick={onClearConsole} className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded mr-2">{t('codeEditor.clear')}</button>
             )}
        </div>
        <div className={`flex-1 min-h-0 ${activeTab === 'preview' ? '' : 'hidden'}`}>
            <iframe
                srcDoc={srcDoc}
                title="Live Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0"
            />
        </div>
        <div className={`flex-1 min-h-0 ${activeTab === 'console' ? '' : 'hidden'}`}>
            <div className="p-2 font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 h-full overflow-y-auto">
                {consoleLogs.length === 0 ? (
                    <p className="text-gray-500 italic">Console is empty.</p>
                ) : consoleLogs.map((log, index) => {
                    const colors: Record<string, string> = {
                        log: 'dark:text-gray-300',
                        warn: 'text-yellow-600 dark:text-yellow-400',
                        error: 'text-red-600 dark:text-red-400',
                        info: 'text-blue-600 dark:text-blue-400'
                    };
                    return (
                       <div key={index} className={`flex items-start gap-2 py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${colors[log.level] || ''}`}>
                            <span className="flex-shrink-0">&gt;</span>
                            <div className="flex-1 whitespace-pre-wrap break-words">
                                {log.args.map((arg: any, i: number) => {
                                    if (arg && arg.__error) {
                                        return <span key={i} className="text-red-500">{arg.message}</span>;
                                    }
                                    return <span key={i}>{JSON.stringify(arg, null, 2)} </span>;
                                })}
                            </div>
                       </div>
                    )
                })}
            </div>
        </div>
    </div>
  );
};

export default LivePreview;