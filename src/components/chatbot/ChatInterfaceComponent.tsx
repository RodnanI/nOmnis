'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, MessageSquare, PlusCircle, MessageCircle } from 'lucide-react';
import './chatbot.css';
import ModelSelector from './ModelSelector';
import MessageContent from './MessageContent';
import { chatModels } from '@/config/chatModels';
import { v4 as uuidv4 } from 'uuid';
// No longer importing BackToHomeButton here

// Function to track statistics
async function trackStats(action: string, data: any) {
    try {
        await fetch('/api/statistics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, data }),
        });
    } catch (error) {
        console.error('Error tracking statistics:', error);
    }
}

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    timestamp: Date;
    messages: Message[];
}

interface ChatInterfaceComponentProps {
    user: any;
    theme: string;
}

export default function ChatInterfaceComponent({ user, theme }: ChatInterfaceComponentProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(chatModels[0]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Effect to auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const maxHeight = 200;
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = scrollHeight > maxHeight ? `${maxHeight}px` : `${scrollHeight}px`;
            textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
        }
    }, [input]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize a conversation on mount
    useEffect(() => {
        createNewConversation();
    }, []);

    const createNewConversation = () => {
        const conversationId = uuidv4();
        const newConversation: Conversation = {
            id: conversationId,
            title: 'New Conversation',
            timestamp: new Date(),
            messages: []
        };

        setConversations(prev => [...prev, newConversation]);
        setCurrentConversationId(conversationId);
        setMessages([]);

        // Track new conversation creation
        trackStats('conversation_created', { modelName: selectedModel.name });

        return conversationId;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: uuidv4(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');

        // Track that user sent a message
        trackStats('message_sent', { 
            role: 'user', 
            length: input.length,
            modelName: selectedModel.name 
        });

        // Simulate sending to chat API
        await sendToChatApi(newMessages);
    };

    const sendToChatApi = async (messageHistory: Message[]) => {
        setIsLoading(true);

        try {
            // Simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 1000));

            const assistantMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: generateResponse(messageHistory),
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Track assistant response
            trackStats('message_received', { 
                role: 'assistant', 
                length: assistantMessage.content.length,
                modelName: selectedModel.name
            });

            // Update conversation title and messages in the conversations array
            if (currentConversationId) {
                const updatedMessages = [...messageHistory, assistantMessage];
                
                setConversations(prev => 
                    prev.map(conv => {
                        if (conv.id === currentConversationId) {
                            // Create a new title if this is the first message
                            const title = messageHistory.length === 1 
                                ? messageHistory[0].content.slice(0, 30) + (messageHistory[0].content.length > 30 ? '...' : '')
                                : conv.title;
                                
                            return { 
                                ...conv, 
                                title, 
                                messages: updatedMessages 
                            };
                        }
                        return conv;
                    })
                );
            }
        } catch (error) {
            console.error('Error in chat API:', error);
            // Add error message
            setMessages(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'assistant',
                    content: 'Sorry, I encountered an error processing your request. Please try again.',
                    timestamp: new Date()
                }
            ]);

            // Track error
            trackStats('chat_error', { modelName: selectedModel.name });
        } finally {
            setIsLoading(false);
        }
    };

    const generateResponse = (messageHistory: Message[]): string => {
        const lastMessage = messageHistory[messageHistory.length - 1].content;

        // Simple rule-based response generator
        if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi')) {
            return `Hello! I'm an AI assistant. How can I help you today?`;
        } else if (lastMessage.toLowerCase().includes('help')) {
            return `I'd be happy to help! Please let me know what you need assistance with, and I'll do my best to provide relevant information.`;
        } else if (lastMessage.includes('?')) {
            return `That's an interesting question. As an AI assistant, I'm designed to provide helpful, accurate, and ethical responses. Based on what you've asked, I'd say it depends on several factors. Could you provide more details so I can give you a more tailored response?`;
        } else {
            return `Thank you for your message. I'm here to assist you with various tasks, from answering questions to helping with complex problems. Feel free to ask me anything else!`;
        }
    };

    const switchConversation = (conversationId: string) => {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            setCurrentConversationId(conversationId);
            setMessages(conversation.messages || []);

            // Track conversation switch
            trackStats('conversation_switched', { conversationId });
        }
    };

    return (
        <div className="flex h-screen bg-theme-gradient">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-opacity-80 backdrop-blur-sm sidebar-gradient">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <motion.button
                        onClick={createNewConversation}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-2 px-4 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>New Chat</span>
                    </motion.button>
                </div>

                <div className="p-2 overflow-y-auto max-h-[calc(100vh-64px)]">
                    {conversations.map((conv) => (
                        <motion.button
                            key={conv.id}
                            onClick={() => switchConversation(conv.id)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`w-full p-3 text-left rounded-lg mb-1 transition-all ${
                                currentConversationId === conv.id
                                    ? 'bg-primary/20 text-primary'
                                    : 'hover:bg-secondary/70'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                <div className="truncate">{conv.title}</div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                <div className="absolute top-4 right-4 z-20">
                    <ModelSelector
                        models={chatModels}
                        selectedModel={selectedModel}
                        onSelectModel={(model) => {
                            setSelectedModel(model);
                            // Track model selection
                            trackStats('model_selected', { modelName: model.name });
                        }}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence>
                        {messages.map((message) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`flex ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                } mb-6`}
                            >
                                <div
                                    className={`relative p-4 rounded-2xl max-w-3xl ${
                                        message.role === 'user'
                                            ? 'bg-primary text-white rounded-br-sm'
                                            : 'bg-secondary rounded-bl-sm'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            message.role === 'user' ? 'bg-primary-hover' : 'bg-secondary-hover'
                                        }`}>
                                            {message.role === 'user' ? (
                                                <User className="w-5 h-5 text-white" />
                                            ) : (
                                                <Bot className="w-5 h-5 text-theme" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <MessageContent content={message.content} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <form onSubmit={handleSubmit} className="flex gap-3 max-w-5xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full px-4 py-3 bg-secondary backdrop-blur-sm text-theme rounded-lg border border-theme pr-12 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Type a message..."
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg ${
                                    isLoading || !input.trim()
                                        ? 'bg-secondary/30 text-theme/30 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary-hover text-white'
                                }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}