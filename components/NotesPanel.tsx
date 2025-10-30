import React from 'react';

interface NotesPanelProps {
  note: string;
  onNoteChange: (newNote: string) => void;
  activeLessonTitle: string | null;
  disabled?: boolean;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ note, onNoteChange, activeLessonTitle, disabled = false }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">My Notes</h2>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        {disabled ? (
            <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
                <p>Notes are available in Learning Path mode.</p>
            </div>
        ) : activeLessonTitle ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes for: <span className="text-primary-600 dark:text-primary-400">{activeLessonTitle}</span></p>
            </div>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={`Type your notes for "${activeLessonTitle}" here...`}
              className="w-full h-full p-4 font-sans text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none"
              spellCheck="false"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
            <p>Select a lesson to start taking notes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;