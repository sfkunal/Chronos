"use client"
// pages/calendar.jsx
import { useState } from 'react';
import Calendar from '@/components/Calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { TimeField } from '@/components/ui/time-field';

// For demonstration purposes, we'll create some sample events
const generateSampleEvents = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return [
        {
            id: '1',
            title: 'Team Meeting',
            start: new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00 AM
            end: new Date(today.getTime() + 11 * 60 * 60 * 1000),   // 11:00 AM
            color: '#3b82f6',
            description: 'Weekly team sync'
        },
        {
            id: '2',
            title: 'Lunch Break',
            start: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM
            end: new Date(today.getTime() + 13 * 60 * 60 * 1000),   // 1:00 PM
            color: '#10b981',
            description: 'Take a break!'
        },
        {
            id: '3',
            title: 'Client Call',
            start: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow 2:00 PM
            end: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),   // Tomorrow 3:00 PM
            color: '#f59e0b',
            description: 'Discuss new project requirements'
        }
    ];
};

export default function CalendarPage() {
    const [events, setEvents] = useState(generateSampleEvents());
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleEventClick = (event) => {
        setSelectedEvent(event);
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-4">Weekly Calendar</h1>

            <Calendar events={events} onEventClick={handleEventClick} />

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