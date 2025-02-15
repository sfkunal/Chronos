import React from 'react';
import Event from './Event';

const DayColumn = ({ events, onEventClick }) => {
    return (
        <div className="flex-1 relative border-r last:border-r-0">
            {/* Render hour guidelines */}
            {Array.from({ length: 24 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-full border-b border-gray-100 pointer-events-none"
                    style={{ top: `${i * 60}px`, height: '60px' }}
                />
            ))}

            {/* Render events */}
            {events.map(event => {
                const startHour = event.start.getHours();
                const startMinute = event.start.getMinutes();
                const endHour = event.end.getHours();
                const endMinute = event.end.getMinutes();

                const top = (startHour * 60) + startMinute;
                const height = ((endHour * 60) + endMinute) - top;

                return (
                    <Event
                        key={event.id}
                        event={event}
                        style={{ top: `${top}px`, height: `${height}px` }}
                        onClick={() => onEventClick?.(event)}
                    />
                );
            })}
        </div>
    );
};

export default DayColumn;