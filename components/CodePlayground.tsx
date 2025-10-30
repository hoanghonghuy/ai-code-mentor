
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PlayIcon } from './icons';

const CodePlayground: React.FC = () => {
  const [code, setCode] = useState('// Write your JavaScript code here\nconsole.log("Hello, AI Mentor!");');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return null;
  }, []);

  const handleRunCode = async () => {
    if (!ai) {
        setOutput("Error: Gemini AI not initialized. Check API Key.");
        return;
    };

    setIsRunning(true);
    setOutput('Executing code...');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Execute the following JavaScript code and provide only the raw console output. If there is an error, provide only the error message. Do not add any explanation or formatting. Code:\n\n\`\`\`javascript\n${code}\n\`\`\``
      });
      setOutput(response.text.trim());
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('An unexpected error occurred while running the code.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Code Playground</h2>
        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="p-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <PlayIcon className="w-5 h-5"/>
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative">
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code here"
                className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none"
                spellCheck="false"
            />
        </div>
        <div className="h-48 border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 bg-gray-100 dark:bg-black/20 h-full">
                <h3 className="text-sm font-semibold mb-2">Output:</h3>
                <pre className="text-sm whitespace-pre-wrap font-mono h-full overflow-y-auto">{output}</pre>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
   