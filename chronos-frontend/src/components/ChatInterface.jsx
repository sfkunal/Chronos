import { useState } from 'react';
import { Send, ArrowUp } from 'lucide-react';

const ChatApp = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "I'm starting a new project at work. I'll need to set aside 2 hours a week to work independently",
            isUser: true
        },
        {
            id: 2,
            text: "Sounds great! Looks like you're most available between 1pm and 5pm on Thursday and Friday. What time/day would you like to book?",
            isUser: false
        },
        {
            id: 3,
            text: "Friday 1pm to 3pm",
            isUser: true
        },
        {
            id: 4,
            text: "Updated. Is this a reoccurring time block?",
            isUser: false
        },
        {
            id: 5,
            text: "Yes, reoccurring for the next month.",
            isUser: true
        },
        {
            id: 6,
            text: "Got it! Your meeting is now booked in your calendar.",
            isUser: false
        }
    ]);

    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;

        setMessages([
            ...messages,
            { id: messages.length + 1, text: newMessage, isUser: true }
        ]);

        setNewMessage('');

        // Simulate a bot response
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    id: prev.length + 1,
                    text: "Thanks for your message! I'll follow up shortly.",
                    isUser: false
                }
            ]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-lg">
            {/* Header */}
            <div className="p-3 border-b flex items-center space-x-3 bg-white">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg width="50%" height="50%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L15 15" stroke="#4F6BED" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="9" stroke="#4F6BED" strokeWidth="2" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-800">Chronos</h1>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`
                max-w-xs lg:max-w-md px-3 py-2 rounded-lg
                ${message.isUser
                                    ? 'bg-blue-100 text-gray-800 rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
              `}
                        >
                            {message.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input area */}
            <div className="p-3 border-t bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 py-2 px-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSendMessage();
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition"
                    >
                        <Send size="50%" />
                    </button>
                </div>
            </div>

            {/* Follow up */}
            <div className="p-3 border-t bg-white">
                <div className="flex items-center space-x-2 text-gray-500">
                    <span>/</span>
                    <span>Follow up</span>
                </div>
            </div>

            {/* Float button */}
            <div className="absolute bottom-3 right-3">
                <button className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center hover:bg-blue-200 transition">
                    <ArrowUp size="50%" />
                </button>
            </div>
        </div>
    );
};

export default ChatApp;