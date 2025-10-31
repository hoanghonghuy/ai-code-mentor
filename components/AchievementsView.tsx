import React from 'react';
import type { Achievement } from '../types';
import { useTranslation } from 'react-i18next';
import { getIcon } from './icons';

interface AchievementsViewProps {
  achievements: Achievement[];
}

const AchievementsView: React.FC<AchievementsViewProps> = ({ achievements }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {achievements.map(ach => {
        const Icon = getIcon(ach.icon);
        // NOTE: Achievement names/descriptions are dynamic based on path title.
        // Full i18n for these would require a different data structure.
        // For now, we only translate the static parts.
        return (
            <div key={ach.id} className={`flex items-start gap-4 p-4 rounded-lg border ${ach.unlocked ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'}`}>
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${ach.unlocked ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <Icon className={`w-6 h-6 ${ach.unlocked ? 'text-green-600 dark:text-green-300' : 'text-gray-500'}`} />
                </div>
                <div>
                    <h3 className={`font-bold ${ach.unlocked ? 'text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>{ach.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ach.description}</p>
                </div>
            </div>
        )
      })}
    </div>
  );
};

export default AchievementsView;