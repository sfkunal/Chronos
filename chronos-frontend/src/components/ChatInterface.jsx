import { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInterface = ({ onSubmit }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Hi! I'm Chronos, your AI scheduling assistant. How can I help you today?",
            isUser: false
        }
    ]);

    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        // Add user message to chat
        const userMessage = {
            id: messages.length + 1,
            text: newMessage,
            isUser: true
        };
        setMessages(prev => [...prev, userMessage]);

        // Store message to send
        const messageToSend = newMessage;
        setNewMessage('');

        try {
            // Add loading message
            setMessages(prev => [...prev, {
                id: prev.length + 1,
                text: "Processing your request...",
                isUser: false
            }]);

            // Send to backend
            await onSubmit(messageToSend);

            // Replace loading message with confirmation
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: prev.length,
                    text: "I've processed your request. Check your calendar for updates!",
                    isUser: false
                }
            ]);
        } catch (error) {
            // Replace loading message with error
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: prev.length,
                    text: "Sorry, I encountered an error while processing your request. Please try again.",
                    isUser: false
                }
            ]);
            console.error('Error sending message:', error);
        }
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
        </div>
    );
};

export default ChatInterface;