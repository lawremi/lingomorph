import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import type { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface AdaptationChatProps {
    messages: Message[];
    onSend: (msg: string) => Promise<void>;
    isLoading: boolean;
}

export const AdaptationChat: React.FC<AdaptationChatProps> = ({
    messages,
    onSend,
    isLoading
}) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const msg = input;
        setInput('');
        await onSend(msg);
    };

    return (
        <div className="flex flex-col h-64 bg-slate-800/30 rounded-lg border border-slate-700/50 mt-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 my-auto pt-8">
                        Ask a question about this text...
                    </p>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-lg p-2 text-xs leading-relaxed ${msg.role === 'user'
                                    ? 'bg-violet-600/80 text-white rounded-br-none'
                                    : 'bg-slate-700/80 text-slate-200 rounded-bl-none'
                                    }`}
                            >
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                                        code: ({ children }) => <code className="bg-black/20 rounded px-1">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-black/20 rounded p-2 mb-1 overflow-x-auto">{children}</pre>,
                                        strong: ({ children }) => <strong className="font-bold text-violet-200">{children}</strong>,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700/50 rounded-lg p-2 rounded-bl-none flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-2 bg-slate-800/50 border-t border-slate-700/50 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about this text..."
                    className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded text-xs px-3 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-1.5 rounded transition-colors"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
};
