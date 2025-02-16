import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

const ChatInterface = ({ welcomeMessage, onSubmit, onEventsUpdate }) => {
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [processingStage, setProcessingStage] = useState(null);

    useEffect(() => {
        if (welcomeMessage && messages.length === 0) {
            setMessages([{
                id: 1,
                text: welcomeMessage,
                isUser: false
            }]);
        }
    }, [welcomeMessage]);

    const formatEventResponse = (response) => {
        if (!response || !response.events || !Array.isArray(response.events)) {
            return "I've processed your request, but there was an issue with the response format.";
        }

        const eventCount = response.events.length;
        if (eventCount === 0) {
            return "No events were created. Please try again.";
        }

        if (eventCount === 1) {
            return `I've created your event: "${response.events[0].summary}". Check your calendar for details!`;
        }

        const eventSummaries = response.events.map(event => event.summary).join('" and "');
        return `I've created ${eventCount} events: "${eventSummaries}". Check your calendar for details!`;
    };

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
            // Add initial processing message
            const processingMessageId = messages.length + 2;
            setMessages(prev => [...prev, {
                id: processingMessageId,
                text: "Processing your request...",
                isUser: false,
                isProcessing: true
            }]);

            // Use polling instead of EventSource
            const pollStatus = async () => {
                const response = await fetch(`http://127.0.0.1:5000/api/schedule/status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        query: messageToSend,
                        preferences: []
                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();

                // Update message with current stage
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    {
                        id: processingMessageId,
                        text: data.message || "Processing your request...",
                        isUser: false,
                        isProcessing: true,
                        stage: data.stage
                    }
                ]);

                // If not complete, poll again
                if (!data.complete) {
                    setTimeout(pollStatus, 1000);
                } else {
                    // Final response received
                    const responseMessage = formatEventResponse(data.response);
                    setMessages(prev => [
                        ...prev.slice(0, -1),
                        {
                            id: processingMessageId,
                            text: responseMessage,
                            isUser: false
                        }
                    ]);

                    // Fetch updated events after successful event creation
                    const eventsResponse = await fetch('http://127.0.0.1:5000/api/events', {
                        credentials: 'include'
                    });

                    if (eventsResponse.ok) {
                        const eventsData = await eventsResponse.json();
                        onEventsUpdate(eventsData.events);
                    }
                }
            };

            // Start polling
            await pollStatus();

        } catch (error) {
            console.error('Error:', error);
            // Handle different types of errors
            let errorMessage = "Sorry, I encountered an error while processing your request. Please try again.";

            if (error.message && error.message.includes("Invalid JSON response from LLM")) {
                errorMessage = "I had trouble understanding how to schedule these events. Could you rephrase your request?";
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = `Error: ${error.response.data.message}`;
            }

            // Replace loading message with error
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: prev.length,
                    text: errorMessage,
                    isUser: false
                }
            ]);
        }
    };

    // Update the message rendering to include processing stages
    const renderMessage = (message) => {
        if (message.isProcessing) {
            return (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <span>Processing</span>
                        <span className="flex space-x-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                        </span>
                    </div>
                    {message.stage && (
                        <div className="text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4">
                                    <svg className="animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                                <span>{message.stage}</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <ReactMarkdown
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                    em: ({ node, ...props }) => <em className="italic" {...props} />,
                }}
            >
                {message.text}
            </ReactMarkdown>
        );
    };

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-lg">
            {/* Header */}
            <div className="p-3 border-b flex items-center space-x-3 bg-white">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Image
                        src="/logo.svg"
                        alt="Chronos Logo"
                        width={21}
                        height={21}
                        priority
                    />
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
                                max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-md
                                ${message.isUser
                                    ? 'bg-blue-100 text-gray-800 rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
                            `}
                        >
                            {renderMessage(message)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input area */}
            <div className="p-3 border-t bg-white">
                <div className="flex items-center space-x-2 relative">
                    <textarea  // Changed from input to textarea
                        type="text"
                        placeholder="Type a message..."
                        className="h-24 flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 align-top resize-none"  // Added align-top and resize-none
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();  // Prevent new line on Enter
                                handleSendMessage();
                            }
                        }}
                        rows="1"  // Start with one row
                    />
                    <button
                        onClick={handleSendMessage}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-blue-600 transition"
                    >
                        <Send size="50%" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;