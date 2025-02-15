import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Event = ({ event, style, onClick }) => {
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        className="absolute left-1 right-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={onClick}
                        style={{
                            ...style,
                            backgroundColor: event.color || '#3b82f6',
                        }}
                    >
                        <CardContent className="p-2 text-white text-xs">
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="opacity-90 text-xs">
                                {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="max-w-xs">
                        <div className="font-bold">{event.title}</div>
                        <div className="text-sm">
                            {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.description && (
                            <div className="mt-2 text-sm">{event.description}</div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default Event;