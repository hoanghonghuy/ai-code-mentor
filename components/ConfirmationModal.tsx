import React from 'react';
import { XIcon } from './icons';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onClose, confirmText = 'Confirm' }) => {
  const { t } = useTranslation();
  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
            <XIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3 pt-4">
            <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
            {t('newProjectModal.cancel')}
            </button>
            <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
            >
            {confirmText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;