import React, { useState, useMemo } from 'react';
import { XIcon, SearchIcon } from './icons';

interface SettingsViewProps {
  customDocs: string[];
  onAddDoc: (url: string) => void;
  onRemoveDoc: (index: number) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ customDocs, onAddDoc, onRemoveDoc }) => {
  const [newDocUrl, setNewDocUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDocUrl.trim() && customDocs.every(doc => doc !== newDocUrl.trim())) {
      onAddDoc(newDocUrl.trim());
      setNewDocUrl('');
    }
  };

  const filteredDocs = useMemo(() =>
    customDocs.filter(doc =>
      doc.toLowerCase().includes(searchTerm.toLowerCase())
    ), [customDocs, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Custom Documentation Sources</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add URLs to documentation for the AI to potentially reference. (Note: This is a foundational feature for future targeted lookups).
        </p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="url"
            value={newDocUrl}
            onChange={(e) => setNewDocUrl(e.target.value)}
            placeholder="https://react.dev"
            className="flex-1 p-2 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="p-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-300"
          >
            Add
          </button>
        </form>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Your Sources</h4>
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sources..."
            className="w-full p-2 pl-10 text-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {customDocs.length > 0 ? (
           filteredDocs.length > 0 ? (
            <ul className="space-y-2">
              {filteredDocs.map((doc) => {
                const originalIndex = customDocs.indexOf(doc);
                return (
                    <li key={doc} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={doc}>{doc}</span>
                        <button onClick={() => onRemoveDoc(originalIndex)} className="p-1 text-gray-400 hover:text-red-500">
                        <XIcon className="w-4 h-4" />
                        </button>
                    </li>
                );
              })}
            </ul>
           ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No sources found for "{searchTerm}".</p>
           )
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No custom sources added yet.</p>
        )}
      </div>
    </div>
  );
};

export default SettingsView;