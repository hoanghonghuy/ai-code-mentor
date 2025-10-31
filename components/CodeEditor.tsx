import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FileSystemNode, ProjectFile, ProjectFolder } from '../types';
import { PlayIcon, FolderIcon, FileIcon, ChevronDownIcon, MoreVerticalIcon, PlusIcon, TrashIcon, PencilIcon, XIcon } from './icons';
import { useTranslation } from 'react-i18next';

// Add hljs to the window object for TypeScript
declare const hljs: any;

interface CodeEditorProps {
    files: FileSystemNode[];
    openFileIds: string[];
    activeFileId: string | null;
    onOpenFile: (fileId: string) => void;
    onCloseFile: (fileId: string) => void;
    onSetActiveFile: (fileId: string) => void;
    onUpdateFileContent: (fileId: string, newContent: string) => void;
    onRunProject: () => void;
    isRunning: boolean;
    output: string;
    // File operations
    onCreateFile: (parentId: string | null) => void;
    onCreateFolder: (parentId: string | null) => void;
    onRenameNode: (nodeId: string, newName: string) => void;
    onDeleteNode: (nodeId: string) => void;
}

const getFileExtension = (filename: string) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

const getLanguageFromExtension = (ext: string) => {
    const map: { [key: string]: string } = {
        js: 'javascript',
        ts: 'typescript',
        html: 'xml', // highlight.js uses 'xml' for html
        css: 'css',
        py: 'python',
        go: 'go',
        cs: 'csharp',
        java: 'java',
        md: 'markdown',
        json: 'json'
    };
    return map[ext] || 'plaintext';
}

const ContextMenu: React.FC<{
    position: { x: number; y: number };
    node: FileSystemNode;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onNewFile: () => void;
    onNewFolder: () => void;
}> = ({ position, node, onClose, onRename, onDelete, onNewFile, onNewFolder }) => {
    const { t } = useTranslation();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuStyle: React.CSSProperties = {
        top: position.y,
        left: position.x,
        position: 'fixed',
        zIndex: 50,
    };
    
    const isFolder = node.type === 'folder';

    return (
        <div ref={menuRef} style={menuStyle} className="w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
            {isFolder && (
                <>
                    <button onClick={onNewFile} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <PlusIcon className="w-4 h-4" />{t('codeEditor.newFile')}
                    </button>
                     <button onClick={onNewFolder} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <FolderIcon className="w-4 h-4" />{t('codeEditor.newFolder')}
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                </>
            )}
             <button onClick={onRename} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                <PencilIcon className="w-4 h-4" />{t('codeEditor.rename')}
            </button>
            <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                <TrashIcon className="w-4 h-4" />{t('codeEditor.delete')}
            </button>
        </div>
    );
};

interface FileTreeNodeProps {
  node: FileSystemNode;
  onOpenFile: (fileId: string) => void;
  level: number;
  onContextMenu: (event: React.MouseEvent, node: FileSystemNode) => void;
  renamingNodeId: string | null;
  onRenameNode: (nodeId: string, newName: string) => void;
  setRenamingNodeId: (id: string | null) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onOpenFile, level, onContextMenu, renamingNodeId, onRenameNode, setRenamingNodeId }) => {
    const [isOpen, setIsOpen] = useState(node.type === 'folder' ? node.isOpen ?? true : false);
    const [tempName, setTempName] = useState(node.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isRenaming = renamingNodeId === node.id;

    useEffect(() => {
        if (node.type === 'folder') {
            setIsOpen(node.isOpen ?? true);
        }
    }, [node]);
    
    useEffect(() => {
      if (isRenaming && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isRenaming]);

    const handleToggle = () => {
        if (node.type === 'folder') {
            const newState = !isOpen;
            setIsOpen(newState);
            // This mutation is for session state persistence of the folder's open/closed status.
            // It's a pragmatic choice to avoid complex state management for a UI-only feature.
            node.isOpen = newState;
        }
    };

    const handleClick = () => {
        if (node.type === 'file') {
            onOpenFile(node.id);
        } else {
            handleToggle();
        }
    };

    const handleRenameSubmit = () => {
        if (tempName.trim() && tempName.trim() !== node.name) {
            onRenameNode(node.id, tempName.trim());
        }
        setRenamingNodeId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setTempName(node.name);
            setRenamingNodeId(null);
        }
    };
    
    return (
        <div>
            <div 
                onContextMenu={(e) => onContextMenu(e, node)}
                style={{ paddingLeft: `${level * 1.25}rem`}}
                className="group flex items-center gap-2 p-1 text-sm rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                <div onClick={handleClick} className="flex-1 flex items-center gap-2 truncate">
                    {node.type === 'folder' && (
                        <ChevronDownIcon className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
                    )}
                     <span className="w-4 h-4 flex-shrink-0 ml-1">
                        {node.type === 'folder' ? <FolderIcon className="w-4 h-4 text-yellow-500" /> : <FileIcon className="w-4 h-4 text-blue-500" />}
                    </span>
                    {isRenaming ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={handleKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-0 bg-transparent border border-primary-500 rounded text-sm"
                        />
                    ) : (
                       <span className="truncate">{node.name}</span>
                    )}
                </div>
            </div>
            {node.type === 'folder' && isOpen && (
                <div>
                    {node.children.map(child => (
                        <FileTreeNode 
                           key={child.id} 
                           node={child} 
                           onOpenFile={onOpenFile} 
                           level={level + 1}
                           onContextMenu={onContextMenu}
                           renamingNodeId={renamingNodeId}
                           onRenameNode={onRenameNode}
                           setRenamingNodeId={setRenamingNodeId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const CodeEditor: React.FC<CodeEditorProps> = (props) => {
    const { 
        files, openFileIds, activeFileId, onOpenFile, onCloseFile, onSetActiveFile, 
        onUpdateFileContent, onRunProject, isRunning, output,
        onCreateFile, onCreateFolder, onRenameNode, onDeleteNode
    } = props;
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileSystemNode } | null>(null);
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

    const activeFile = files
        .flatMap(node => node.type === 'file' ? [node] : (node.children.filter(c => c.type === 'file') as ProjectFile[]))
        .find(f => f.id === activeFileId);

    const code = activeFile?.content ?? '';
    const language = activeFile ? getLanguageFromExtension(getFileExtension(activeFile.name)) : 'plaintext';

    const codeRef = useRef<HTMLElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (codeRef.current && activeFile) {
            codeRef.current.innerHTML = hljs.highlight(code, { language, ignoreIllegals: true }).value;
        } else if (codeRef.current) {
            codeRef.current.innerHTML = '';
        }
    }, [code, language, activeFile]);
    
    useEffect(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        window.addEventListener('contextmenu', (e) => {
            if (contextMenu) {
                e.preventDefault();
                closeMenu();
            }
        });
        return () => {
            window.removeEventListener('click', closeMenu);
            window.removeEventListener('contextmenu', closeMenu);
        };
    }, [contextMenu]);

    const handleContextMenu = useCallback((event: React.MouseEvent, node: FileSystemNode) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({ x: event.clientX, y: event.clientY, node });
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (preRef.current) {
          preRef.current.scrollTop = e.currentTarget.scrollTop;
          preRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }
    };

    const findFileById = (id: string): ProjectFile | undefined => {
      const stack: FileSystemNode[] = [...files];
      while(stack.length) {
          const node = stack.pop();
          if(!node) continue;
          if(node.type === 'file' && node.id === id) return node;
          if(node.type === 'folder') stack.push(...node.children);
      }
      return undefined;
    };

    const openFiles = openFileIds.map(findFileById).filter((f): f is ProjectFile => !!f);

  return (
    <>
    <div className="flex flex-row h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="w-56 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div 
              className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
              onContextMenu={(e) => handleContextMenu(e, { id: 'root', name: 'root', type: 'folder', children: files })}
            >
                <h3 className="text-sm font-semibold">{t('sidebar.projects')}</h3>
                <div className="flex gap-1">
                     <button onClick={() => onCreateFile(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title={t('codeEditor.newFile')}>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onCreateFolder(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" title={t('codeEditor.newFolder')}>
                        <FolderIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
                {files.map(node => (
                    <FileTreeNode 
                      key={node.id} 
                      node={node} 
                      onOpenFile={onOpenFile} 
                      level={0}
                      onContextMenu={handleContextMenu}
                      renamingNodeId={renamingNodeId}
                      setRenamingNodeId={setRenamingNodeId}
                      onRenameNode={onRenameNode}
                    />
                ))}
            </div>
        </div>
      
      {/* Main Editor and Output */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
                {openFiles.map(file => (
                    <div 
                        key={file.id} 
                        onClick={() => onSetActiveFile(file.id)}
                        className={`flex items-center gap-2 p-2 text-sm rounded-t-md cursor-pointer border-b-2 ${activeFileId === file.id ? 'bg-gray-100 dark:bg-gray-900 border-primary-500' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                    >
                        <span className="w-4 h-4 flex-shrink-0"><FileIcon className="w-4 h-4 text-blue-500" /></span>
                        <span className="truncate flex-shrink-0">{file.name}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onCloseFile(file.id); }} 
                            className="p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            <XIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
            <button
            onClick={onRunProject}
            disabled={isRunning}
            className="ml-4 p-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
            >
            <PlayIcon className="w-5 h-5"/>
            <span>{isRunning ? t('codeEditor.runningProject') : t('codeEditor.runProject')}</span>
            </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {activeFile ? (
            <div className="flex-1 relative bg-gray-50 dark:bg-gray-900">
                <pre 
                    ref={preRef}
                    aria-hidden="true" 
                    className="absolute inset-0 p-4 font-mono text-sm overflow-auto z-0"
                >
                    <code ref={codeRef} className={`language-${language}`}></code>
                </pre>
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => onUpdateFileContent(activeFileId!, e.target.value)}
                    onScroll={handleScroll}
                    placeholder="Enter your code here"
                    className="absolute inset-0 p-4 font-mono text-sm bg-transparent text-transparent caret-black dark:caret-white border-0 focus:ring-0 resize-none z-10"
                    spellCheck="false"
                />
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
                {openFileIds.length > 0 ? t('codeEditor.selectFile') : t('codeEditor.emptyProject')}
            </div>
        )}
        <div className="h-48 border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-100 dark:bg-black/20 h-full">
                <h3 className="text-sm font-semibold mb-2">{t('codeEditor.output')}</h3>
                <pre className="text-sm whitespace-pre-wrap font-mono h-full overflow-y-auto">{output}</pre>
            </div>
        </div>
      </div>
      </div>
    </div>
     {contextMenu && (
        <ContextMenu
            position={contextMenu}
            node={contextMenu.node}
            onClose={() => setContextMenu(null)}
            onRename={() => {
                setRenamingNodeId(contextMenu.node.id);
                setContextMenu(null);
            }}
            onDelete={() => {
                onDeleteNode(contextMenu.node.id);
                setContextMenu(null);
            }}
            onNewFile={() => {
                const parentId = contextMenu.node.type === 'folder' ? contextMenu.node.id : contextMenu.node.parentId;
                onCreateFile(parentId === 'root' ? null : parentId);
                setContextMenu(null);
            }}
            onNewFolder={() => {
                const parentId = contextMenu.node.type === 'folder' ? contextMenu.node.id : contextMenu.node.parentId;
                onCreateFolder(parentId === 'root' ? null : parentId);
                setContextMenu(null);
            }}
        />
    )}
    </>
  );
};

export default CodeEditor;