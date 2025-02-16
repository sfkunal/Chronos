import React, { useState, useEffect, useRef } from 'react';
import DayColumn from './DayColumn';
import TimeGrid from './TimeGrid';
import { ScrollArea } from '@/components/ui/scroll-area';
import { startOfWeek, endOfWeek, isWithinInterval, addWeeks, subWeeks, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';


const WeeklyCalendar = ({ events, onEventClick, setEvents1 }) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef(null);

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
            setIsLoading(true);
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(searchQuery)}`);
                const data = await response.json();
                setSearchResults(data);
            } catch (error) {
                console.error('Error searching events:', error);
                setSearchResults(null);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setSearchResults(null);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        if (scrollAreaRef.current) {
            // 6 AM = 6 hours * 60 pixels per hour
            const scrollToPosition = 6 * 60;
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = scrollToPosition;
            }
        }
    }, []); // Empty dependency array means this runs once when component mounts

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-4">
                <h1 className="text-4xl font-bold mb-4">
                    <span className="font-bold">{format(currentDate, 'MMMM')}</span>
                    <span className="font-normal"> {format(currentDate, 'yyyy')}</span></h1>
                <div className="flex items-center justify-end px-4 py-2 bg-white-50">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    const tempSpan = document.createElement('span');
                                    tempSpan.style.visibility = 'hidden';
                                    tempSpan.style.position = 'absolute';
                                    tempSpan.style.whiteSpace = 'pre';
                                    tempSpan.style.font = window.getComputedStyle(e.target).font;
                                    tempSpan.textContent = e.target.value || e.target.placeholder;
                                    document.body.appendChild(tempSpan);
                                    const width = Math.max(256, Math.min(512, tempSpan.offsetWidth + 64));
                                    document.body.removeChild(tempSpan);
                                    e.target.style.width = `${width}px`;
                                }}
                                placeholder="Search events..."
                                className={`
                                    pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                                    transition-all duration-1000 ease-in-out
                                    ${isSearchExpanded 
                                        ? 'w-64 opacity-100' 
                                        : 'w-0 opacity-0 overflow-hidden border-0'
                                    }
                                `}
                                autoFocus
                                onBlur={() => {
                                    if (!searchQuery) {
                                        setIsSearchExpanded(false);
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setIsSearchExpanded(true)}
                                className={`
                                    p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-0
                                    absolute right-0 top-0 transition-opacity duration-300
                                    ${isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                                `}
                            >
                                <svg
                                    className="h-5 w-5 text-gray-400"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            {isSearchExpanded && (
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
                            )}
                        </div>
                        {(isLoading || searchResults) && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="p-4 max-h-96 overflow-y-auto">
                                    {isLoading ? (
                                        <div className="flex items-center py-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            <span className="ml-3 text-sm text-gray-600">Searching...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                {searchResults.answer}
                                            </div>
                                            {searchResults.events && searchResults.events.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Related Events</div>
                                                    {searchResults.events.map((event, index) => (
                                                        <div 
                                                            key={index}
                                                            className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                                                            onClick={() => onEventClick(event)}
                                                        >
                                                            <div className="font-medium">{event.title}</div>
                                                            <div className="text-sm text-gray-500">
                                                                {format(new Date(event.start), 'MMM d, h:mm a')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <button 
                                    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                                    onClick={() => {
                                        setSearchResults(null);
                                        setIsLoading(false);
                                    }}
                                >
                                    <svg 
                                        className="h-4 w-4 text-gray-400"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
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
                <ScrollArea ref={scrollAreaRef} className="flex-1 h-full">
                    <div className="flex">
                        <TimeGrid />
                        <div className="flex flex-1 h-[1440px]">
                            {days.map((day, i) => (
                                <DayColumn
                                    key={i}
                                    events={eventsByDay[i]}
                                    dayIndex={i}
                                    onEventClick={onEventClick}
                                    setEvents1={setEvents1}
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