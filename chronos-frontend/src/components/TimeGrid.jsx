import React from 'react';

const TimeGrid = () => {
    return (
        <div className="w-16 flex-shrink-0 border-r bg-white-500 relative min-h-screen">
            {Array.from({ length: 24 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full border-b border-gray-200 flex items-start justify-end pr-2 text-xs text-gray-500"
                    style={{ top: `${i * 60}px`, height: '60px' }}
                >
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </div>
            ))}
        </div>
    );
};

export default TimeGrid;