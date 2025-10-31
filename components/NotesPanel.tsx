import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

interface NotesPanelProps {
  note: string;
  onNoteChange: (newNote: string) => void;
  activeLessonTitle: string | null;
  disabled?: boolean;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ note, onNoteChange, activeLessonTitle, disabled = false }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">{t('notes.title')}</h2>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {disabled ? (
            <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
                <p>{t('notes.disabled')}</p>
            </div>
        ) : activeLessonTitle ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Trans i18nKey="notes.notesFor" values={{ lessonTitle: activeLessonTitle }}>
                    Notes for: <span className="text-primary-600 dark:text-primary-400">{activeLessonTitle}</span>
                  </Trans>
                </p>
            </div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={t('notes.placeholder', { lessonTitle: activeLessonTitle })}
              className="w-full h-full p-4 font-sans text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none"
              spellCheck="false"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
            <p>{t('notes.selectLesson')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;