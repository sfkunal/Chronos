import React from 'react';
import DayColumn from './DayColumn';
import TimeGrid from './TimeGrid';
import { ScrollArea } from '@/components/ui/scroll-area';

const WeeklyCalendar = ({ events, onEventClick }) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Group events by day of week
    const eventsByDay = days.map((day, index) => {
        return events.filter(event => event.start.getDay() === index);
    });

    return (
        <div className="w-full h-[600px] flex flex-col border rounded-md overflow-hidden">
            {/* Header with day names */}
            <div className="flex border-b bg-gray-50">
                <div className="w-16 flex-shrink-0 border-r" /> {/* Empty corner for time labels */}
                {days.map((day, i) => (
                    <div key={i} className="flex-1 text-center py-2 font-medium border-r last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Scrollable area for hours and events */}
            <div className="flex-1 flex overflow-hidden">
                <ScrollArea className="flex-1 h-full">
                    <div className="flex">
                        <TimeGrid />
                        <div className="flex flex-1 h-[1440px]"> {/* Set fixed height to match TimeGrid */}
                            {days.map((day, i) => (
                                <DayColumn
                                    key={i}
                                    events={eventsByDay[i]}
                                    onEventClick={onEventClick}
                                />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default WeeklyCalendar;