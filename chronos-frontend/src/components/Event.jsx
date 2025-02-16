import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

const Event = ({ event, style, onClick, dayIndex, setEvents1 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const cardRef = useRef(null);
    const textareaRef = useRef(null);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cardRef.current && !cardRef.current.contains(event.target)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Determine transform origin based on day
    const getTransformOrigin = () => {
        if (dayIndex === 0) return 'left center';  // Sunday
        if (dayIndex === 6) return 'right center';  // Saturday
        return 'center center';  // Other days
    };

    // Determine position classes based on day
    const getPositionClasses = () => {
        if (dayIndex === 0) return "origin-left";  // Sunday
        if (dayIndex === 6) return "origin-right";  // Saturday
        return "origin-center";  // Other days
    };

    // Add auto-resize function for textarea
    const adjustTextareaHeight = (element) => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
    };

    const handleEditOrDelete = async (query) => {
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/editOrDelete', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    event: {
                        id: event.id,
                        summary: event.title,
                        description: event.description,
                        start: event.start,
                        end: event.end,
                    }
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                toast.success(data.message);
                setIsExpanded(false);
                
                // Fetch updated events
                const eventsResponse = await fetch('http://127.0.0.1:5000/api/events', {
                    credentials: 'include'
                });

                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    setEvents1(eventsData.events);  // Update events
                }
            } else if (data.status === 'unknown') {
                toast.warning(data.message);
            }
            
        } catch (error) {
            console.error('Error processing edit/delete request:', error);
        } finally {
            setIsLoading(false);
            setNoteText('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (noteText.trim()) {
                handleEditOrDelete(noteText);
            }
        }
    };

    return (
        <Card
            ref={cardRef}
            className={cn(
                "absolute left-1 right-1 overflow-hidden cursor-pointer transition-all duration-200 rounded-[10px] border-[0.5px] border-[#C9CACD]",
                isExpanded ? `z-[1000] scale-[2] shadow-xl ${getPositionClasses()} !h-auto` : "hover:ring-2 hover:ring-blue-400"
            )}
            onClick={(e) => {
                if (e.target.tagName !== 'TEXTAREA') {
                    setIsExpanded(!isExpanded);
                }
            }}
            style={{
                ...style,
                backgroundColor: event.color || '#3b82f6',
                transformOrigin: getTransformOrigin(),
                maxHeight: isExpanded ? '300px' : style.height,
            }}
        >
            <div className="flex flex-col h-full">
                <CardContent className={cn(
                    "p-2 text-white",
                    isExpanded ? "text-sm" : "text-xs"
                )}>
                    <div className="font-medium">{event.title}</div>
                    <div className="opacity-90">
                        {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                    {isExpanded && (
                        <>
                            <div className="mt-2 opacity-75 whitespace-normal overflow-y-auto max-h-[80px] text-[10px] leading-tight">
                                {event.description && event.description}
                            </div>
                            {event.attendees && event.attendees.length > 0 && (
                                <div className="mt-1 opacity-75 overflow-y-auto max-h-[36px] text-[6px] leading-[12px] italic">
                                    {event.attendees.map((attendee, index) => (
                                        <div key={index}>
                                            {attendee.email}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>

                {isExpanded && (
                    <div className="bg-white w-full p-1 pt-2">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={noteText}
                                onChange={(e) => {
                                    setNoteText(e.target.value);
                                    adjustTextareaHeight(e.target);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Modify or delete event?"
                                disabled={isLoading}
                                className={cn(
                                    "w-full px-2 py-1 text-[10px] leading-tight placeholder:text-gray-400 resize-none min-h-[24px] max-h-[100px] overflow-y-auto focus:outline-none text-gray-700 rounded-[5px] border border-gray-200",
                                    isLoading && "opacity-50"
                                )}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => adjustTextareaHeight(e.target)}
                            />
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Event;