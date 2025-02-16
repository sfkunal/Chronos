'use client'
import React, { useState, useEffect } from 'react';
import { MessageCirclePlus } from 'lucide-react';

const Preferences = ({ onPreferencesChange }) => {
  const [preferences, setPreferences] = useState([]);
  const [newPreference, setNewPreference] = useState('');

  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('preferences');
    if (savedPreferences) {
      const parsedPreferences = JSON.parse(savedPreferences);
      setPreferences(parsedPreferences);
      onPreferencesChange(parsedPreferences);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPreference.trim()) return;

    // Update preferences and notify parent
    const updatedPreferences = [...preferences, newPreference];
    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);
    // Save to localStorage
    localStorage.setItem('preferences', JSON.stringify(updatedPreferences));

    // Clear input
    setNewPreference('');
  };

  const handleDelete = (indexToDelete) => {
    const updatedPreferences = preferences.filter((_, index) => index !== indexToDelete);
    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);
    // Save to localStorage
    localStorage.setItem('preferences', JSON.stringify(updatedPreferences));
  };

  return (
    <div className="border-t h-full p-3 bg-gray-50 rounded-xl flex flex-col overflow-hidden">
      <h2 className="text-2xl font-semibold text-gray-700">Preferences</h2>
      <hr className='mt-2 mb-4' />

      {/* Preferences List */}
      <div className="flex-1 overflow-y-auto mb-4 min-h-0">
        {preferences.length === 0 ? (
          <p className="text-gray-500 text-center">No preferences added yet</p>
        ) : (
          <ul className="space-y-2">
            {preferences.map((pref, index) => (
              <li
                key={index}
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {pref}
                <button
                  onClick={() => handleDelete(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete preference"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input Form */}
      <div className="pt-3">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={newPreference}
            onChange={(e) => setNewPreference(e.target.value)}
            placeholder="Add a new preference..."
            className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-blue-600 transition"
            >
            <MessageCirclePlus size="55%" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Preferences;
