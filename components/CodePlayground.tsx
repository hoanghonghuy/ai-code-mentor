import React, { useState, useMemo, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PlayIcon } from './icons';

interface CodePlaygroundProps {
  onFirstRun: () => void;
}

type SupportedLanguage = 'javascript' | 'python' | 'csharp' | 'go' | 'java';

const defaultCode: Record<SupportedLanguage, string> = {
  javascript: '// Write your JavaScript code here\nconsole.log("Hello, AI Mentor!");',
  python: '# Write your Python code here\nprint("Hello, AI Mentor!")',
  csharp: `// Write your C# code here
using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello, AI Mentor!");
    }
}`,
  go: `// Write your Go code here
package main

import "fmt"

func main() {
    fmt.Println("Hello, AI Mentor!")
}`,
  java: `// Write your Java code here
class Main {
    public static void main(String[] args) {
        System.out.println("Hello, AI Mentor!");
    }
}`
};

const CodePlayground: React.FC<CodePlaygroundProps> = ({ onFirstRun }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState(defaultCode.javascript);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const hasRunOnce = useRef(false);

  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return null;
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setCode(defaultCode[lang]);
    setOutput('');
  };

  const handleRunCode = async () => {
    if (!ai) {
        setOutput("Error: Gemini AI not initialized. Check API Key.");
        return;
    };

    if (!hasRunOnce.current) {
      onFirstRun();
      hasRunOnce.current = true;
    }

    setIsRunning(true);
    setOutput('Executing code...');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Execute the following ${language} code and provide only the raw console output. If there is an error, provide only the error message. Do not add any explanation or formatting. Code:\n\n\`\`\`${language}\n${code}\n\`\`\``
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-2.5-dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-2.5-dark:border-gray-700">
        <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Code Playground</h2>
            <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="p-1 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
            </select>
        </div>
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
        <div className="h-48 border-t border-gray-2.5-dark:border-gray-700">
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