import React, { useState } from 'react';
import DayColumn from './DayColumn';
import TimeGrid from './TimeGrid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { startOfWeek, endOfWeek, isWithinInterval, addWeeks, subWeeks, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const WeeklyCalendar = ({ events, onEventClick }) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

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

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (searchQuery.length > 2) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();
                console.log('response:', data);
                // console.log('answer:', data.answer);
            } catch (error) {
                console.error('Error searching events:', error);
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-4">
                <h1 className="text-4xl font-bold mb-4">
                    <span className="font-bold">{format(currentDate, 'MMMM')}</span>
                    <span className="font-normal"> {format(currentDate, 'yyyy')}</span></h1>
                <div className="flex items-center justify-end px-4 py-2 bg-white-50">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search events..."
                            className="pl-10 pr-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                        <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <Search className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            </div>
            {/* Header with navigation and week display */}
            <div className="flex items-center justify-end px-4 py-2 bg-white-50 border-b">
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateWeek('prev')}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateWeek('next')}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Days header */}
            <div className="flex border-b bg-white-50">
                <div className="w-16 flex-shrink-0 border-r" />
                {days.map((day, i) => {
                    const date = addWeeks(weekStart, 0);
                    date.setDate(weekStart.getDate() + i);
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                    return (
                        <div key={i} className="flex-1 text-center py-2 border-r last:border-r-0">
                            <div className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
                                {day}
                            </div>
                            <div className={`text-sm ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
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
                                    onEventClick={onEventClick} />
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default WeeklyCalendar;