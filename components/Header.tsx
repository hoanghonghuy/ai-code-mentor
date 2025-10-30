import React from 'react';
import type { Theme } from '../types';
import { SunIcon, MoonIcon, CodeIcon, MenuIcon, StarIcon } from './icons';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  points: number;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, toggleSidebar, points }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-4">
         <button onClick={toggleSidebar} className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          <MenuIcon className="w-6 h-6"/>
        </button>
        <div className="flex items-center gap-2">
            <CodeIcon className="w-8 h-8 text-primary-600"/>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">AI Code Mentor</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 font-bold py-1 px-3 rounded-full">
            <StarIcon className="w-5 h-5"/>
            <span>{points}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? (
            <MoonIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <SunIcon className="w-6 h-6 text-yellow-400" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;