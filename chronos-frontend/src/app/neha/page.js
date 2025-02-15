// 'use client'
// import React, { useEffect } from 'react';
// import { Manrope } from 'next/font/google';
// import { Calendar } from '@/components/ui/calendar';
// import Preferences from '@/components/Preferences';
// import { useState } from 'react';
// import WeeklyCalendar from '@/components/WeeklyCalendar';
// import { Button } from '@/components/ui/button';
// import ChatInterface from '@/components/ChatInterface';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { Loader2 } from "lucide-react";


// const manrope = Manrope({ subsets: ['latin'] })

// const DemoContent = ({ className, title }) => (
//     <div className={`p-4 border border-gray-200 rounded-lg bg-white shadow-sm ${className}`}>
//         <h1 className="text-2xl font-semibold text-gray-700 mb-2">{title}</h1>
//         <div className="w-full h-full min-h-[100px rounded flex items-center justify-center">
//             <span className="text-gray-500">{title} Content</span>
//         </div>
//     </div>
// );

// // For demonstration purposes, we'll create some sample events
// const generateSampleEvents = () => {
//     const now = new Date();
//     const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//     return [
//         {
//             id: '1',
//             title: 'Team Meeting',
//             start: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
//             end: new Date(today.getTime() + 11 * 60 * 60 * 1000),   // 11:00 AM
//             color: '#3b82f6',
//             description: 'Weekly team sync'
//         },
//         {
//             id: '2',
//             title: 'Lunch Break',
//             start: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
//             end: new Date(today.getTime() + 13 * 60 * 60 * 1000),   // 1:00 PM
//             color: '#10b981',
//             description: 'Take a break!'
//         },
//         {
//             id: '3',
//             title: 'Client Call',
//             start: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow 2:00 PM
//             end: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),   // Tomorrow 3:00 PM
//             color: '#f59e0b',
//             description: 'Discuss new project requirements'
//         }
//     ];
// };

// const transformGoogleEvents = (googleEvents) => {
//     return googleEvents.map(event => ({
//         id: event.id,
//         title: event.summary,
//         start: new Date(event.start.dateTime || event.start.date),
//         end: new Date(event.end.dateTime || event.end.date),
//         color: getColorFromId(event.colorId), // We'll define this function
//         description: event.description || ''
//     }));
// };

// // Google Calendar color IDs to hex colors mapping
// const getColorFromId = (colorId) => {
//     const colorMap = {
//         '1': '#7986cb', // Lavender
//         '2': '#33b679', // Sage
//         '3': '#8e24aa', // Grape
//         '4': '#e67c73', // Flamingo
//         '5': '#f6c026', // Banana
//         '6': '#f5511d', // Tangerine
//         '7': '#039be5', // Peacock
//         '8': '#616161', // Graphite
//         '9': '#3f51b5', // Blueberry
//         '10': '#0b8043', // Basil
//         'default': '#3b82f6' // Default blue
//     };
//     return colorMap[colorId] || colorMap.default;
// };

// function CalendarPage() {
//     const [events, setEvents] = useState([]);
//     const [selectedEvent, setSelectedEvent] = useState(null);
//     const [isLoggedIn, setIsLoggedIn] = React.useState(false);
//     const [events1, setEvents1] = React.useState([]);
//     const [authToken, setAuthToken] = React.useState(null);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         const params = new URLSearchParams(window.location.search);
//         const token = params.get('token');

//         if (token) {
//             localStorage.setItem('authToken', token);
//             window.history.replaceState({}, '', '/lee');
//             setAuthToken(token);
//         } else {
//             const savedToken = localStorage.getItem('authToken');
//             if (savedToken) {
//                 setAuthToken(savedToken);
//             }
//         }
//     }, []);

//     useEffect(() => {
//         const checkAuthAndFetchEvents = async () => {
//             try {
//                 const authResponse = await fetch('http://127.0.0.1:5000/api/auth-status', {
//                     credentials: 'include'
//                 });

//                 if (authResponse.ok) {
//                     const authData = await authResponse.json();

//                     if (authData.isAuthenticated) {
//                         const eventsResponse = await fetch('http://127.0.0.1:5000/api/events', {
//                             credentials: 'include'
//                         });

//                         if (eventsResponse.ok) {
//                             const eventsData = await eventsResponse.json();
//                             setEvents1(eventsData.events);
//                             setIsLoggedIn(true);
//                         } else {
//                             window.location.href = 'http://127.0.0.1:5000/login';
//                         }
//                     } else {
//                         window.location.href = 'http://127.0.0.1:5000/login';
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error:', error);
//                 window.location.href = 'http://127.0.0.1:5000/login';
//             }
//         };

//         if (!isLoggedIn) {
//             checkAuthAndFetchEvents();
//         }
//     }, [isLoggedIn]);

//     // Transform and combine events when events1 changes
//     useEffect(() => {
//         let timeoutId;

//         if (events1.length > 0) {
//             setIsLoading(true);
//             timeoutId = setTimeout(() => {
//                 const transformedEvents = transformGoogleEvents(events1);
//                 setEvents(transformedEvents);
//                 setIsLoading(false);
//             }, 500);
//         } else {
//             setIsLoading(true);
//             timeoutId = setTimeout(() => {
//                 setEvents(generateSampleEvents());
//                 setIsLoading(false);
//             }, 500);
//         }

//         return () => {
//             if (timeoutId) clearTimeout(timeoutId);
//         };
//     }, [events1]);

//     console.log('Calendar Events:', events1);

//     const handleEventClick = (event) => {
//         setSelectedEvent(event);
//     };

//     return (
//         <div className="container h-full pt-[2%] relative">
//             <WeeklyCalendar events={isLoading ? [] : events} onEventClick={handleEventClick} />

//             {isLoading && (
//                 <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
//                     <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
//                 </div>
//             )}

//             {selectedEvent && (
//                 <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
//                     <DialogContent>
//                         <DialogHeader>
//                             <DialogTitle>{selectedEvent.title}</DialogTitle>
//                         </DialogHeader>
//                         <div className="py-4">
//                             <p><strong>Time:</strong> {selectedEvent.start.toLocaleString()} - {selectedEvent.end.toLocaleString()}</p>
//                             {selectedEvent.description && (
//                                 <p className="mt-2">{selectedEvent.description}</p>
//                             )}
//                         </div>
//                         <div className="flex justify-end gap-2">
//                             <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
//                             <Button variant="destructive">Delete Event</Button>
//                         </div>
//                     </DialogContent>
//                 </Dialog>
//             )}
//         </div>
//     );
// }


// const PageLayout = () => {
//     const [date, setDate] = React.useState(new Date())
//     return (
//         <div className={manrope.className}>
//             <div className="min-h-screen bg-gray-50">
//                 <div className="w-full">
//                     {/* Main Grid Layout */}
//                     <div className="grid grid-cols-12 gap-4">

//                         {/* Left Column aka Month Calendar View + Preferences */}
//                         <div className="col-span-2 h-screen">
//                             {/* Top Left Month Calendar View */}
//                             <div className="h-[35vh]">
//                                 <Calendar
//                                     mode="single"
//                                     selected={date}
//                                     onSelect={setDate}
//                                     className="h-full"
//                                 />
//                             </div>

//                             {/* Preferences */}``
//                             <div className="h-[65vh]">
//                                 <Preferences />
//                             </div>
//                         </div>

//                         {/* Middle Column aka Main Calendar View */}
//                         <div className="col-span-7 h-screen">
//                             <CalendarPage />
//                         </div>

//                         {/* Right Column aka Chronos Chatbot */}
//                         <div className="col-span-3 h-screen">
//                             {/* <DemoContent
//                                 title="Chronos"
//                                 className="h-[90vh] bg-[#E4E4E4] rounded-xl"
//                             /> */}
//                             <ChatInterface />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default PageLayout;