import React, { useMemo } from 'react';
import type { FileSystemNode, ProjectFile } from '../types';

interface LivePreviewProps {
  files: FileSystemNode[];
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

const LivePreview: React.FC<LivePreviewProps> = ({ files }) => {
  const srcDoc = useMemo(() => {
    const htmlFile = findFileByName(files, 'index.html');
    const cssFile = findFileByName(files, 'style.css');
    const jsFile = findFileByName(files, 'script.js');

    if (!htmlFile) {
      return `
        <body style="font-family: sans-serif; color: #555; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
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

    // Inject JavaScript
    if (jsFile) {
      const scriptTag = `<script>\n${jsFile.content}\n</script>`;
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
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
             <h2 className="text-lg font-semibold">Live Preview</h2>
        </div>
        <iframe
            srcDoc={srcDoc}
            title="Live Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-0"
        />
    </div>
  );
};

export default LivePreview;
