'use client'
import React, { useEffect } from 'react';
import { Manrope } from 'next/font/google';
import { Calendar } from '@/components/ui/calendar';
import Preferences from '@/components/Preferences';
import { useState } from 'react';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/components/ChatInterface';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2 } from "lucide-react";


const manrope = Manrope({ subsets: ['latin'] })


const transformGoogleEvents = (googleEvents) => {
    return googleEvents.map(event => ({
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        color: getColorFromId(event.colorId), // We'll define this function
        description: event.description || ''
    }));
};

// Google Calendar color IDs to hex colors mapping
const getColorFromId = (colorId) => {
    const colorMap = {
        '1': '#7986cb', // Lavender
        '2': '#33b679', // Sage
        '3': '#8e24aa', // Grape
        '4': '#e67c73', // Flamingo
        '5': '#f6c026', // Banana
        '6': '#f5511d', // Tangerine
        '7': '#039be5', // Peacock
        '8': '#616161', // Graphite
        '9': '#3f51b5', // Blueberry
        '10': '#0b8043', // Basil
        'default': '#3b82f6' // Default blue
    };
    return colorMap[colorId] || colorMap.default;
};

function CalendarPage({ selectedMonthDate, events1, setEvents1 }) {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [authToken, setAuthToken] = React.useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(selectedMonthDate ?? new Date())


    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('authToken', token);
            window.history.replaceState({}, '', '/lee');
            setAuthToken(token);
        } else {
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                setAuthToken(savedToken);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedMonthDate) {
            setSelectedDate(selectedMonthDate);
        }
    }, [selectedMonthDate]);

    useEffect(() => {
        const checkAuthAndFetchEvents = async () => {
            try {
                const authResponse = await fetch('http://127.0.0.1:5000/api/auth-status', {
                    credentials: 'include'
                });

                if (authResponse.ok) {
                    const authData = await authResponse.json();

                    if (authData.isAuthenticated) {
                        const eventsResponse = await fetch('http://127.0.0.1:5000/api/events', {
                            credentials: 'include'
                        });

                        if (eventsResponse.ok) {
                            const eventsData = await eventsResponse.json();
                            setEvents1(eventsData.events);
                            setIsLoggedIn(true);
                        } else {
                            window.location.href = 'http://127.0.0.1:5000/login';
                        }
                    } else {
                        window.location.href = 'http://127.0.0.1:5000/login';
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                window.location.href = 'http://127.0.0.1:5000/login';
            }
        };

        if (!isLoggedIn) {
            checkAuthAndFetchEvents();
        }
    }, [isLoggedIn]);

    // Transform and combine events when events1 changes
    useEffect(() => {
        let timeoutId;

        if (events1.length > 0) {
            setIsLoading(true);
            timeoutId = setTimeout(() => {
                const transformedEvents = transformGoogleEvents(events1);
                setEvents(transformedEvents);
                setIsLoading(false);
            }, 500);
        } else {
            setIsLoading(true);
            timeoutId = setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [events1]);

    console.log('Calendar Events:', events1);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    return (
        <div className="container h-full pt-[2%] relative">
            <WeeklyCalendar
                events={isLoading ? [] : events}
                onEventClick={handleEventClick}
                setEvents1={setEvents1}
                selectedDate={selectedDate}
            />

            {isLoading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            )}

            {selectedEvent && (
                <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedEvent.title}</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p><strong>Time:</strong> {selectedEvent.start.toLocaleString()} - {selectedEvent.end.toLocaleString()}</p>
                            {selectedEvent.description && (
                                <p className="mt-2">{selectedEvent.description}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
                            <Button variant="destructive">Delete Event</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}


const PageLayout = () => {
    const [date, setDate] = React.useState(new Date())
    const [userPreferences, setUserPreferences] = React.useState([]);
    const [welcomeMessage, setWelcomeMessage] = React.useState('');
    const [events1, setEvents1] = React.useState([]);

    // Add useEffect to fetch welcome message when events1 changes
    useEffect(() => {
        const fetchWelcomeMessage = async () => {
            if (events1.length > 0) {
                try {
                    const response = await fetch('http://127.0.0.1:5000/api/welcome_msg', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ events: events1 })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setWelcomeMessage(data.message);
                    }
                } catch (error) {
                    console.error('Error fetching welcome message:', error);
                }
            }
        };

        fetchWelcomeMessage();
    }, [events1]);

    console.log(welcomeMessage);

    const handlePreferencesChange = (newPreferences) => {
        setUserPreferences(newPreferences);
    };

    const handleChatSubmit = async (prompt) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    action_query: prompt,
                    preferences: userPreferences
                })
            });
            console.log('Response:', response);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to schedule event');
            }

            // Fetch updated events after successful scheduling
            const eventsResponse = await fetch('http://127.0.0.1:5000/api/events', {
                credentials: 'include'
            });

            if (eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                setEvents1(eventsData.events);  // Update events
            }

            return responseData;
        } catch (error) {
            console.error('Error scheduling event:', error);
            throw error; // Re-throw to be handled by ChatInterface
        }
    };

    return (
        <div className={manrope.className}>
            <div className="min-h-screen bg-white">
                <div className="w-full">
                    {/* Main Grid Layout */}
                    <div className="grid grid-cols-12 gap-4">

                        {/* Left Column aka Month Calendar View + Preferences */}
                        <div className="col-span-2 h-screen border-r border-black-200">
                            {/* Top Left Month Calendar View */}
                            <div className="h-[35vh]">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="h-full"
                                />
                            </div>

                            {/* Preferences */}
                            <div className="h-[65vh]">
                                <Preferences onPreferencesChange={handlePreferencesChange} />
                            </div>
                        </div>

                        {/* Middle Column aka Main Calendar View */}
                        <div className="col-span-7 h-screen">
                            <CalendarPage events1={events1} setEvents1={setEvents1} selectedMonthDate={date} />
                        </div>

                        {/* Right Column aka Chronos Chatbot */}
                        <div className="col-span-3 h-screen">
                            <ChatInterface
                                onSubmit={handleChatSubmit}
                                welcomeMessage={welcomeMessage}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLayout;