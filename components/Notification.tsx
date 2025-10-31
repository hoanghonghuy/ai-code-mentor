import React, { useEffect, useState } from 'react';
import type { Achievement } from '../types';
import { getIcon } from './icons';
import { useTranslation } from 'react-i18next';

interface NotificationProps {
  achievement: Achievement | null;
}

const Notification: React.FC<NotificationProps> = ({ achievement }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 4500); // Start fade out before it's removed
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [achievement]);

  if (!achievement) return null;

  const Icon = getIcon(achievement.icon);

  return (
    <div className={`fixed top-5 right-5 z-50 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-primary-500">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-900">
            <Icon className="w-7 h-7 text-yellow-500 dark:text-yellow-300" />
        </div>
        <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('notification.unlocked')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{achievement.name}</p>
        </div>
      </div>
    </div>
  );
};

export default Notification;