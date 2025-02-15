'use client'
import React from 'react';
import { Manrope } from 'next/font/google';
import { Calendar } from '@/components/ui/calendar';

const manrope = Manrope({ subsets: ['latin'] })

const DemoContent = ({ className, title }) => (
  <div className={`p-4 border border-gray-200 rounded-lg bg-white shadow-sm ${className}`}>
    <h1 className="text-2xl font-semibold text-gray-700 mb-2">{title}</h1>
    <div className="w-full h-full min-h-[100px rounded flex items-center justify-center">
      <span className="text-gray-500">{title} Content</span>
    </div>
  </div>
);

const CalendarLayout = () => {
  const [date, setDate] = React.useState(new Date())
  return (
    <div className={manrope.className}>
      <div className="min-h-screen bg-gray-100">
        <div className="w-full">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-4">

            {/* Left Column aka Month Calendar View + Preferences */}
            <div className="col-span-2 h-screen">
              {/* Top Left Month Calendar View */}
              {/* TODO: Show current date + week highlighted */}
              <div className="h-[33vh] pl-2">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="h-full"
                />
              </div>
              
              {/* Preferences */}
              <div className="h-[67vh]">
                <DemoContent 
                  title="Preferences" 
                  className="h-full bg-[#E4E4E4] rounded-xl"
                />
              </div>
            </div>

            {/* Middle Column aka Main Calendar View */}
            <div className="col-span-7">
              <DemoContent 
                title="Main Calendar View" 
                className="h-full"
              />
            </div>
            
            {/* Right Column aka Chronos Chatbot */}
            <div className="col-span-3 h-screen pt-[10vh]">
              <DemoContent 
                title="Chronos" 
                className="h-[90vh] bg-[#E4E4E4] rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarLayout;
