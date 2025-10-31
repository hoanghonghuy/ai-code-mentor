import React, { useState } from 'react';
import type { Theme } from '../types';
import { SunIcon, MoonIcon, CodeIcon, MenuIcon, StarIcon, LoginIcon, LogoutIcon, ChevronDownIcon } from './icons';
import type { User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  points: number;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="font-bold text-gray-700 dark:text-gray-200">{user.displayName?.charAt(0)}</span>
                    </div>
                )}
                <span className="hidden sm:inline font-semibold text-sm">{user.displayName}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                 <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-10"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <LogoutIcon className="w-4 h-4" />
                        {t('userMenu.logout')}
                    </button>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, toggleSidebar, points, user, onLogin, onLogout }) => {
  const { t } = useTranslation();
  return (
    <header className="flex items-center justify-between p-2 md:p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-4">
         <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          <MenuIcon className="w-6 h-6"/>
        </button>
        <div className="flex items-center gap-2">
            <CodeIcon className="w-8 h-8 text-primary-600"/>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">{t('header.title')}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 font-bold py-1 px-3 rounded-full">
            <StarIcon className="w-5 h-5"/>
            <span>{points}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label={t('header.toggleTheme')}
        >
          {theme === 'light' ? (
            <MoonIcon className="w-6 h-6 text-gray-700" />
          ) : (
            <SunIcon className="w-6 h-6 text-yellow-400" />
          )}
        </button>

        {user ? (
            <UserMenu user={user} onLogout={onLogout} />
        ) : (
            <button
                onClick={onLogin}
                className="flex items-center gap-2 p-2 sm:px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-semibold"
            >
                <LoginIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{t('header.login')}</span>
            </button>
        )}
      </div>
    </header>
  );
};

export default Header;