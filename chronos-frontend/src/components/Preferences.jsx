'use client'
import React, { useState } from 'react';

const Preferences = ({ onPreferencesChange }) => {
  const [preferences, setPreferences] = useState([]);
  const [newPreference, setNewPreference] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPreference.trim()) return;

    // Update preferences and notify parent
    const updatedPreferences = [...preferences, newPreference];
    setPreferences(updatedPreferences);
    onPreferencesChange(updatedPreferences);

    // Clear input
    setNewPreference('');
  };

  return (
    <div className="h-full p-4 bg-[#E4E4E4] rounded-xl flex flex-col overflow-hidden">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Preferences</h2>
      
      {/* Preferences List */}
      <div className="flex-1 overflow-y-auto mb-4 min-h-0">
        {preferences.length === 0 ? (
          <p className="text-gray-500 text-center">No preferences added yet</p>
        ) : (
          <ul className="space-y-2">
            {preferences.map((pref, index) => (
              <li 
                key={index} 
                className="p-2 bg-white rounded-lg shadow-sm"
              >
                {pref}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input Form */}
      <div className="mt-auto">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newPreference}
            onChange={(e) => setNewPreference(e.target.value)}
            placeholder="Add a new preference..."
            className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Preference
          </button>
        </form>
      </div>
    </div>
  );
};

export default Preferences;
