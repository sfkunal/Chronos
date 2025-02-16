import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const Event = ({ event, style, onClick, dayIndex }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [noteText, setNoteText] = useState('');
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

    useEffect(() => {
        if (isExpanded) {
            console.log('Expanded event data:', event);
        }
    }, [isExpanded, event]);

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

    return (
        <Card
            ref={cardRef}
            className={cn(
                "absolute left-1 right-1 overflow-hidden cursor-pointer transition-all duration-200 rounded-[10px] border-[1.5px] border-[#C9CACD]",
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
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="opacity-90">
                        {formatTime(event.start)} - {formatTime(event.end)}
                    </div>
                    {isExpanded && (
                        <div className="mt-2 opacity-75 whitespace-normal overflow-y-auto max-h-[80px] text-[10px] leading-tight">
                            {event.description && event.description}
                        </div>
                    )}
                </CardContent>

                {isExpanded && (
                    <div className="bg-white w-full p-1 pt-2">
                        <textarea
                            ref={textareaRef}
                            value={noteText}
                            onChange={(e) => {
                                setNoteText(e.target.value);
                                adjustTextareaHeight(e.target);
                            }}
                            placeholder="Modify or delete event?"
                            className="w-full px-2 py-1 text-[10px] leading-tight placeholder:text-gray-400 resize-none min-h-[24px] max-h-[100px] overflow-y-auto focus:outline-none text-gray-700 rounded-[5px] border border-gray-200"
                            onClick={(e) => e.stopPropagation()}
                            onFocus={(e) => adjustTextareaHeight(e.target)}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Event;