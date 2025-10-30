import React, { useState } from 'react';
import { XIcon } from './icons';

interface NewProjectModalProps {
  onClose: () => void;
  onCreateProject: (name: string, goal: string) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreateProject }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && goal.trim()) {
      onCreateProject(name.trim(), goal.trim());
    }
  };

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
        <h2 className="text-xl font-bold mb-4">Create a New Project</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Describe your project goal, and the AI Mentor will guide you from there.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal Portfolio"
              className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="project-goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              What do you want to build?
            </label>
            <textarea
              id="project-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., A simple website to showcase my design work, built with React and Tailwind CSS."
              className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-300"
              disabled={!name.trim() || !goal.trim()}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
