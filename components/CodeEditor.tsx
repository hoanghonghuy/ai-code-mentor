

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { FileSystemNode, ProjectFile, ProjectFolder } from '../types';
import { PlayIcon, FolderIcon, ChevronDownIcon, MoreVerticalIcon, PlusIcon, TrashIcon, PencilIcon, XIcon, getIconForFile } from './icons';
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
    output: any;
    onSetOutput: (output: any) => void;
    // File operations
    onCreateFile: (parentId: string | null) => void;
    onCreateFolder: (parentId: string | null) => void;
    onRenameNode: (nodeId: string, newName: string) => void;
    onDeleteNode: (nodeId: string) => void;
    onMoveNode: (draggedNodeId: string, targetFolderId: string | null) => void;
}

const findFileInTree = (nodes: FileSystemNode[], fileId: string | null): ProjectFile | undefined => {
    if (!fileId) return undefined;
    const stack: FileSystemNode[] = [...nodes];
    while(stack.length) {
        const node = stack.pop();
        if(!node) continue;
        if(node.type === 'file' && node.id === fileId) return node;
        if(node.type === 'folder') stack.push(...node.children);
    }
    return undefined;
};


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
  onMoveNode: (draggedNodeId: string, targetFolderId: string | null) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onOpenFile, level, onContextMenu, renamingNodeId, onRenameNode, setRenamingNodeId, onMoveNode }) => {
    const [isOpen, setIsOpen] = useState(node.type === 'folder' ? node.isOpen ?? true : false);
    const [tempName, setTempName] = useState(node.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isRenaming = renamingNodeId === node.id;
    const [isDragOver, setIsDragOver] = useState(false);

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

    const Icon = getIconForFile(node.name, node.type === 'folder', isOpen);

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('application/node-id', node.id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('dragging');
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        if (node.type === 'folder') {
            e.preventDefault();
            setIsDragOver(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drop from bubbling up to parent folders
        setIsDragOver(false);
        if (node.type === 'folder') {
            const draggedNodeId = e.dataTransfer.getData('application/node-id');
            if (draggedNodeId && draggedNodeId !== node.id) {
                onMoveNode(draggedNodeId, node.id);
            }
        }
    };
    
    return (
        <div className="tree-node-container">
            {level > 0 && (
                <div
                    className="tree-branch"
                    style={{
                        left: `calc(${(level - 1) * 1.25}rem + 0.5rem - 1px)`,
                    }}
                ></div>
            )}
            <div 
                draggable="true"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onContextMenu={(e) => onContextMenu(e, node)}
                style={{ paddingLeft: `${level * 1.25}rem`}}
                className={`group flex items-center gap-2 p-1 text-sm rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${isDragOver ? 'drag-over-folder' : ''}`}
            >
                <div onClick={handleClick} className="flex-1 flex items-center gap-2 truncate">
                    {node.type === 'folder' && (
                        <ChevronDownIcon className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
                    )}
                     <span className="w-4 h-4 flex-shrink-0 ml-1">
                        <Icon className="w-4 h-4" />
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
                <div className="relative">
                    {node.children.length > 0 && (
                        <div 
                            className="tree-connector"
                            style={{
                                left: `calc(${level * 1.25}rem + 0.5rem - 1px)`
                            }}
                        />
                    )}
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
                           onMoveNode={onMoveNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const OutputDisplay: React.FC<{ output: any; isRunning: boolean; }> = ({ output, isRunning }) => {
    const { t } = useTranslation();

    if (isRunning) {
        return (
            <div className="p-4 text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-300">
                {t('playground.executing')}
            </div>
        );
    }

    let parsedOutput: any = null;
    let isRawText = false;

    if (typeof output === 'string') {
        try {
            // It might be a stringified JSON from a previous state or a raw string
            const potentialJson = JSON.parse(output);
            if(typeof potentialJson === 'object' && potentialJson !== null) {
                parsedOutput = potentialJson;
            } else {
                 isRawText = true;
            }
        } catch (e) {
            isRawText = true;
        }
        if(isRawText || !output) {
             parsedOutput = { type: 'raw', rawText: output };
        }
    } else if (output && typeof output === 'object') {
        parsedOutput = output;
    }

    if (!parsedOutput || Object.keys(parsedOutput).length === 0) {
        return <div className="p-4 text-gray-500">{t('codeEditor.outputPlaceholder')}</div>;
    }

    if (parsedOutput.type === 'web') {
        return (
            <div className="p-4 font-sans">
                {/* Virtual Browser Window */}
                <div className="mx-auto my-2 max-w-full w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg shadow-md bg-gray-100 dark:bg-gray-800">
                    {/* Title bar */}
                    <div className="flex items-center gap-1.5 p-2 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="flex-1 text-center text-xs text-gray-600 dark:text-gray-400 font-medium bg-gray-200 dark:bg-gray-700 rounded-md px-2 py-0.5">
                            {parsedOutput.windowTitle || 'Untitled'}
                        </div>
                    </div>
                    {/* Browser content */}
                    <div className="p-4 bg-white dark:bg-gray-900 rounded-b-lg min-h-[5rem]">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">
                            {parsedOutput.browserContent || ''}
                        </pre>
                    </div>
                </div>

                {/* Console Logs */}
                {parsedOutput.consoleLogs && parsedOutput.consoleLogs.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Console</h4>
                        <div className="bg-gray-900 text-gray-200 font-mono text-xs rounded-md p-3 overflow-x-auto">
                            {parsedOutput.consoleLogs.map((log: string, i: number) => (
                                <div key={i} className="flex items-start border-b border-gray-700 last:border-b-0 py-1">
                                    <span className="text-gray-500 mr-2 flex-shrink-0">&gt;</span>
                                    <pre className="flex-1 whitespace-pre-wrap break-all">{log}</pre>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    let textToDisplay = '';
    if (parsedOutput.type === 'script' && Array.isArray(parsedOutput.consoleLogs)) {
        textToDisplay = parsedOutput.consoleLogs.join('\n');
    } else if (parsedOutput.type === 'error') {
        textToDisplay = `Error: ${parsedOutput.error}`;
    } else if (parsedOutput.type === 'raw') {
        textToDisplay = parsedOutput.rawText;
    } else if (typeof parsedOutput === 'string') {
        textToDisplay = parsedOutput;
    } else if (typeof parsedOutput === 'object') {
        // Fallback for unexpected object structures
        textToDisplay = JSON.stringify(parsedOutput, null, 2);
    }

    if (!textToDisplay) {
        return <div className="p-4 text-gray-500">{t('codeEditor.outputPlaceholder')}</div>;
    }

    return (
        <pre className="p-4 text-sm whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-300">
            {textToDisplay}
        </pre>
    );
};


const CodeEditor: React.FC<CodeEditorProps> = (props) => {
    const { 
        files, openFileIds, activeFileId, onOpenFile, onCloseFile, onSetActiveFile, 
        onUpdateFileContent, onRunProject, isRunning, output, onSetOutput,
        onCreateFile, onCreateFolder, onRenameNode, onDeleteNode, onMoveNode
    } = props;
    const { t } = useTranslation();
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileSystemNode } | null>(null);
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
    const [isRootDragOver, setIsRootDragOver] = useState(false);

    const [sidebarWidth, setSidebarWidth] = useState(224); // Corresponds to w-56
    const isResizing = useRef(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current || !editorContainerRef.current) return;
        const startX = editorContainerRef.current.getBoundingClientRect().left;
        const newWidth = e.clientX - startX;
        // Add constraints for min/max width
        if (newWidth >= 160 && newWidth <= 600) {
            setSidebarWidth(newWidth);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, [handleMouseMove]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    }, [handleMouseMove, handleMouseUp]);

    const activeFile = useMemo(() => findFileInTree(files, activeFileId), [files, activeFileId]);
    
    const openFiles = useMemo(() => 
        openFileIds.map(id => findFileInTree(files, id)).filter((f): f is ProjectFile => !!f),
        [files, openFileIds]
    );

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
    
    const handleRootDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsRootDragOver(false);
        const draggedNodeId = e.dataTransfer.getData('application/node-id');
        if (draggedNodeId) {
            onMoveNode(draggedNodeId, null); // null targetId means move to root
        }
    };

    const TabIcon = ({ name }: { name: string }) => {
        const Icon = getIconForFile(name, false);
        return <Icon className="w-4 h-4" />;
    };


  return (
    <>
    <div ref={editorContainerRef} className="flex flex-row h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* File Tree Sidebar */}
        <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div 
              className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
              onContextMenu={(e) => handleContextMenu(e, { id: 'root', name: 'root', type: 'folder', children: files, parentId: null })}
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
            <div 
                className={`flex-1 p-2 overflow-y-auto ${isRootDragOver ? 'drag-over-folder' : ''}`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsRootDragOver(true); }}
                onDragLeave={() => setIsRootDragOver(false)}
                onDrop={handleRootDrop}
            >
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
                      onMoveNode={onMoveNode}
                    />
                ))}
            </div>
        </div>
      
        {/* Resizer */}
        <div
            className="w-1.5 flex-shrink-0 cursor-col-resize group"
            onMouseDown={handleMouseDown}
        >
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 group-hover:bg-primary-500 transition-colors duration-200"></div>
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
                            <span className="w-4 h-4 flex-shrink-0"><TabIcon name={file.name} /></span>
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
                <div className="h-48 border-t border-gray-200 dark:border-gray-700 flex flex-col">
                     <div className="flex-shrink-0 flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-semibold uppercase tracking-wider">{t('codeEditor.output')}</h3>
                        <button 
                            onClick={() => onSetOutput('')}
                            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 p-1 rounded"
                            title={t('codeEditor.clearOutput')}
                        >
                            {t('codeEditor.clear')}
                        </button>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                       <OutputDisplay output={output} isRunning={isRunning} />
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