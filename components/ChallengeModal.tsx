import React from 'react';
import { XIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { SimpleMarkdown } from './MarkdownRenderer';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeText: string | null;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ isOpen, onClose, challengeText }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4 p-6 relative max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
            <XIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">{t('challengeModal.title')}</h2>
        
        <div className="flex-1 overflow-y-auto pr-2">
            {challengeText ? (
                <SimpleMarkdown text={challengeText} searchQuery="" />
            ) : (
                <p className="text-gray-500">{t('challengeModal.loading')}</p>
            )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              {t('challengeModal.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;