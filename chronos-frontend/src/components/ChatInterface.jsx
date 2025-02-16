import { useState, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatInterface = ({ welcomeMessage, onSubmit }) => {
    const [messages, setMessages] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [mediaRecorder, setMediaRecorder] = useState(null);

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
            // Add loading message
            setMessages(prev => [...prev, {
                id: prev.length + 1,
                text: "Processing your request...",
                isUser: false
            }]);

            // Send to backend and get response
            const response = await onSubmit(messageToSend);

            // Format response message based on events created
            const responseMessage = formatEventResponse(response);

            // Replace loading message with formatted response
            setMessages(prev => [
                ...prev.slice(0, -1),
                {
                    id: prev.length,
                    text: responseMessage,
                    isUser: false
                }
            ]);
        } catch (error) {
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
            console.error('Error sending message:', error);
        }
    };

    const handleMicClick = () => {
        if (isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        } else {
            const audioChunks = [];
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const recorder = new MediaRecorder(stream);
                    setMediaRecorder(recorder);
                    recorder.start();
                    setIsRecording(true);
    
                    recorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };
    
                    recorder.onstop = async () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        stream.getTracks().forEach(track => track.stop());
                        const formData = new FormData();
                        formData.append('audio', audioBlob, 'temp.wav');

                        try {
                            const response = await fetch('http://127.0.0.1:5000/api/speech-to-text', {
                                method: 'POST',
                                credentials: 'include',
                                body: formData
                            });
                            const data = await response.json();
                            if (data.text) {
                                setNewMessage(data.text);
                            } else {
                                console.error('Error transcribing audio:', data.error);
                            }
                        } catch (error) {
                            console.error('Error sending audio to backend:', error);
                        }
                    };
                })
                .catch(error => console.error('Error accessing microphone:', error));
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
                                max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-md
                                ${message.isUser
                                    ? 'bg-blue-100 text-gray-800 rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}
                            `}
                        >
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
                    <button onClick={handleMicClick}>
                        <Mic className={isRecording ? 'text-red-500' : ''} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;