import React, { useState } from 'react';
import DayColumn from './DayColumn';
import TimeGrid from './TimeGrid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { startOfWeek, endOfWeek, isWithinInterval, addWeeks, subWeeks, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeeklyCalendar = ({ events, onEventClick }) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get current week's start and end dates
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);

    const navigateWeek = (direction) => {
        setCurrentDate(prevDate => {
            return direction === 'next' ? addWeeks(prevDate, 1) : subWeeks(prevDate, 1);
        });
    };

    // Filter events to only show current week's events
    const currentWeekEvents = events.filter(event => {
        const eventDate = event.start;
        return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
    });

    // Group events by day of week
    const eventsByDay = days.map((day, index) => {
        return currentWeekEvents.filter(event => event.start.getDay() === index);
    });

    return (
        <div className="w-full h-[600px] flex flex-col border rounded-md overflow-hidden">
            {/* Header with navigation and week display */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateWeek('prev')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateWeek('next')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="font-medium ml-2">
                        Week of {format(weekStart, 'MMM d, yyyy')}
                    </span>
                </div>
                <Button
                    variant="outline"
                    onClick={() => setCurrentDate(new Date())}
                >
                    Today
                </Button>
            </div>

            {/* Days header */}
            <div className="flex border-b bg-gray-50">
                <div className="w-16 flex-shrink-0 border-r" />
                {days.map((day, i) => {
                    const date = addWeeks(weekStart, 0);
                    date.setDate(weekStart.getDate() + i);
                    return (
                        <div key={i} className="flex-1 text-center py-2 border-r last:border-r-0">
                            <div className="font-medium">{day}</div>
                            <div className="text-sm text-gray-500">
                                {format(date, 'MMM d')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scrollable area for hours and events */}
            <div className="flex-1 flex overflow-hidden">
                <ScrollArea className="flex-1 h-full">
                    <div className="flex">
                        <TimeGrid />
                        <div className="flex flex-1 h-[1440px]">
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