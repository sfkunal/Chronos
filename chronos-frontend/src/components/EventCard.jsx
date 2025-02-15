'use client'
import React, { useState } from 'react';

const EventCard = ({ 
  color = 'blue',
  title, 
  description, 
  timeStart, 
  timeEnd, 
  toggleEdit = false,
  onEdit
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEditClick = () => {
    setShowEditMenu(!showEditMenu);
    if (typeof onEdit === 'function') {
      onEdit();
    }
  };

  return (
    <div 
      className={`
        relative
        p-4
        rounded-lg
        border-l-4
        bg-white
        shadow-sm
        hover:shadow-md
        transition-all
        duration-200
        font-inter
      `}
      style={{ borderLeftColor: color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {toggleEdit && isHovered && (
        <button
          onClick={handleEditClick}
          className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          type="button"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      )}

      <div className="mb-2">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <div className="text-sm text-gray-600">
          {formatTime(timeStart)} - {formatTime(timeEnd)}
        </div>
      </div>

      {description && (
        <p className="text-gray-700 text-sm line-clamp-2">
          {description}
        </p>
      )}
    </div>
  );
};

export default EventCard;
