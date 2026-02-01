import React, { useState } from 'react';
import { InteractiveWord } from './InteractiveWord';
import { DifficultyIndicator } from './DifficultyIndicator';
import type { AdaptedText } from '../types';
import { AdaptationService } from '../services/text/adaptation';
import { useSettings } from '../context/SettingsContext';
import { LLMFactory } from '../services/llm/factory';
import { Sparkles, Grab, MessageSquare } from 'lucide-react';
import { AdaptationChat } from './AdaptationChat';
import type { Message } from '../types';

export const AdaptationView: React.FC = () => {
    const { settings } = useSettings();
    const [inputText, setInputText] = useState('');
    const [history, setHistory] = useState<AdaptedText[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasVocab, setHasVocab] = useState(false);

    const bottomRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom on history update
    React.useEffect(() => {
        if (history.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history]);

    // Check for vocab existence
    React.useEffect(() => {
        chrome.storage.local.get('syncStats', (result) => {
            const stats = result.syncStats as { totalWords: number } | undefined;
            if (stats && stats.totalWords > 0) {
                setHasVocab(true);
            }
        });
    }, []);

    // Tooltip State Management
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
    const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Chat State
    const [openChatId, setOpenChatId] = useState<number | null>(null);
    const [chatLoading, setChatLoading] = useState(false);

    const handleWordHover = (id: string, active: boolean) => {
        if (active) {
            // Mouse Enter: Clear any pending close and set new active immediately
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
                tooltipTimeoutRef.current = null;
            }
            setActiveTooltipId(id);
        } else {
            // Mouse Leave: Delay closing
            tooltipTimeoutRef.current = setTimeout(() => {
                setActiveTooltipId(null);
            }, 300);
        }
    };

    // Load history on mount
    React.useEffect(() => {
        chrome.storage.local.get(['adaptationHistory'], (result) => {
            if (result.adaptationHistory) {
                setHistory(result.adaptationHistory as AdaptedText[]);
            } else {
                setHistory([]);
            }
        });
    }, []);

    // Save history whenever it changes
    React.useEffect(() => {
        chrome.storage.local.set({ adaptationHistory: history });
    }, [history]);

    // Check for pending selection (from Context Menu)
    React.useEffect(() => {
        const checkSelection = async () => {
            const result = await chrome.storage.local.get('pendingSelection');
            if (typeof result.pendingSelection === 'string') {
                setInputText(result.pendingSelection);
                chrome.storage.local.remove('pendingSelection');
            }
        };
        checkSelection();

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.pendingSelection?.newValue && typeof changes.pendingSelection.newValue === 'string') {
                setInputText(changes.pendingSelection.newValue);
                chrome.storage.local.remove('pendingSelection');
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    const handleAdapt = async () => {
        if (!inputText) return;
        setLoading(true);
        setError(null);
        try {
            const provider = LLMFactory.createProvider(settings);
            const service = new AdaptationService(provider, settings);
            const result = await service.adaptText(inputText);

            setHistory(prev => [...prev, result]);
            setInputText(''); // Clear input after successful adaptation

            // Increment daily progress (Adaptations goal)
            const today = new Date().toDateString();
            const storage = await chrome.storage.local.get('dailyProgress');
            let progress = storage.dailyProgress as { date: string, count: number } | undefined;

            if (!progress || progress.date !== today) {
                progress = { date: today, count: 0 };
            }

            progress.count += 1;
            await chrome.storage.local.set({ dailyProgress: progress });

            // Streak Logic
            if (progress.count >= settings.dailyGoal) {
                const streakResult = await chrome.storage.local.get('streak');
                let streak = streakResult.streak as { count: number, lastMetDate: string } | undefined;
                const yesterday = new Date(Date.now() - 86400000).toDateString();

                if (!streak) {
                    streak = { count: 1, lastMetDate: today };
                } else if (streak.lastMetDate !== today) {
                    if (streak.lastMetDate === yesterday) {
                        streak.count += 1;
                        streak.lastMetDate = today;
                    } else {
                        streak = { count: 1, lastMetDate: today };
                    }
                }

                await chrome.storage.local.set({ streak });
            }

        } catch (e: any) {
            console.error(e);
            let msg = e.message || 'Adaptation failed. Unknown error.';
            if (msg.includes('429')) msg = 'Rate limit exceeded. Please try again later or check your quota.';
            if (msg.includes('401')) msg = 'Invalid API Key. Please check your settings.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (index: number) => {
        setHistory(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddAnki = async (lemma: string, definition?: string) => {
        try {
            const { AnkiConnect } = await import('../services/anki');
            const anki = new AnkiConnect(settings.ankiConnectUrl);
            const deck = await anki.getDeckNames();
            const targetDeck = deck.find(d => d.toLowerCase().includes(settings.targetLanguage.toLowerCase())) || deck[0];

            if (!targetDeck) throw new Error('No deck found');

            // Use configured note type (defaulting to Basic if not set)
            const noteType = settings.ankiNoteType || 'Basic';
            const frontField = settings.ankiFrontField || 'Front';
            const backField = settings.ankiBackField || 'Back';

            const fields = {
                [frontField]: lemma,
                [backField]: definition || ''
            };

            const result = await anki.addNote(targetDeck, noteType, fields, ['lingomorph']);

            // Assume result is the note ID (AnkiConnect returns ID)
            const noteId = result;

            // Update local state to 'new' (Blue) immediately
            setHistory(prev => prev.map((item, _) => {
                // Optimization: only update if this item contains the word (checking lemma)
                // Or we scan all items to be safe
                return {
                    ...item,
                    words: item.words.map(w => {
                        if (w.lemma === lemma) {
                            return { ...w, status: 'new', id: noteId, definition: definition || w.definition };
                        }
                        return w;
                    })
                };
            }));

            // Persist to DB so we don't need to re-sync immediately
            try {
                const { saveVocab } = await import('../services/db');
                await saveVocab([{
                    id: noteId,
                    word: lemma, // using lemma as key word
                    lemma: lemma,
                    status: 'new',
                    definition: definition,
                    lastSynced: Date.now()
                }]);
            } catch (dbErr) {
                console.error("Failed to save to local DB", dbErr);
            }

            alert(`Added "${lemma}" to Anki deck "${targetDeck}"!`);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to add to Anki: ${e.message}`);
        }
    };

    const handleChatSend = async (msg: string, index: number) => {
        if (chatLoading) return;

        const currentItem = history[index];
        const newMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: msg,
            timestamp: Date.now()
        };

        // Optimistic update
        const updatedHistory = [...history];
        updatedHistory[index] = {
            ...currentItem,
            chatHistory: [...(currentItem.chatHistory || []), newMsg]
        };
        setHistory(updatedHistory);
        setChatLoading(true);

        try {
            const provider = LLMFactory.createProvider(settings);
            // Construct context-aware prompt
            const systemContext = `
You are a helpful language tutor discussing a specific text adaptation.
Original Text: "${currentItem.original}"
Adapted Text: "${currentItem.adapted}"
Target Language: ${settings.targetLanguage}
User's Native Language: ${settings.nativeLanguage}

Answer the user's question about the text, vocabulary, grammar, or culture. Keep answers concise and helpful.
`;

            const prompt = `${systemContext}\n\nUser Question: ${msg}`;
            const response = await provider.complete(prompt);

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            };

            const finalHistory = [...updatedHistory];
            finalHistory[index] = {
                ...finalHistory[index],
                chatHistory: [...(finalHistory[index].chatHistory || []), botMsg]
            };
            setHistory(finalHistory);

        } catch (e: any) {
            console.error('Chat failed:', e);
            // Add error message
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${e.message || 'Failed to get response'}`,
                timestamp: Date.now()
            };
            const errorHistory = [...updatedHistory];
            errorHistory[index] = {
                ...errorHistory[index],
                chatHistory: [...(errorHistory[index].chatHistory || []), errorMsg]
            };
            setHistory(errorHistory);
        } finally {
            setChatLoading(false);
        }
    };

    const handleWordClick = (word: string, lemma: string) => {
        console.log('Clicked:', word, lemma);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
            {/* Scrollable History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {history.length === 0 && !loading && (
                    <div className="text-center text-slate-500 mt-10">
                        <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No adaptations yet. Try pasting some text below!</p>
                    </div>
                )}

                {history.map((item, idx) => (
                    <div key={idx} className="space-y-4 border-b border-slate-800 pb-6 last:border-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                Adapted Text {idx + 1}
                            </h2>
                            <button
                                onClick={() => handleDelete(idx)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Delete
                            </button>
                        </div>

                        <DifficultyIndicator
                            newWordsCount={item.words.filter(w => w.status === 'new' || w.status === 'untracked').length}
                            totalWords={item.words.length}
                        />

                        <div className="bg-slate-800/50 p-4 rounded-lg leading-relaxed text-lg border border-slate-700/50">
                            <div className="flex flex-wrap items-baseline gap-y-2">
                                {item.words.map((w, i) => {
                                    const wordId = `hist-${idx}-word-${i}`;
                                    return (
                                        <InteractiveWord
                                            key={i}
                                            word={w.text}
                                            lemma={w.lemma}
                                            status={w.status}
                                            definition={w.definition}
                                            level={w.level}
                                            isActive={activeTooltipId === wordId}
                                            onHover={(active) => handleWordHover(wordId, active)}
                                            onClick={handleWordClick}
                                            onAddAnki={handleAddAnki}
                                            hasVocab={hasVocab}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <details className="flex-1">
                                <summary className="cursor-pointer hover:text-slate-400 select-none">Show Original</summary>
                                <p className="mt-2 italic p-2 bg-slate-800/30 rounded">
                                    {item.original}
                                </p>
                            </details>

                            <button
                                onClick={() => setOpenChatId(openChatId === idx ? null : idx)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${openChatId === idx
                                    ? 'text-violet-300 bg-violet-500/20'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`}
                            >
                                <MessageSquare size={14} />
                                {openChatId === idx ? 'Close Chat' : 'Ask AI'}
                            </button>
                        </div>

                        {openChatId === idx && (
                            <AdaptationChat
                                messages={item.chatHistory || []}
                                onSend={(msg) => handleChatSend(msg, idx)}
                                isLoading={chatLoading}
                            />
                        )}
                    </div>
                ))}

                {/* Dummy element for auto-scrolling */}
                <div ref={bottomRef} />
            </div>

            {/* Fixed Input Area at Bottom */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 shadow-xl z-10">
                {error && (
                    <div className="mb-2 w-full bg-red-500/10 border border-red-500/50 text-red-200 p-2 rounded text-xs">
                        <p className="font-semibold">Error: {error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <textarea
                        className="flex-1 h-20 bg-slate-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-violet-500 border border-transparent resize-none"
                        placeholder="Paste text to adapt..."
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleAdapt();
                            }
                        }}
                    />
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleAdapt}
                            disabled={loading || !inputText}
                            className="btn-primary h-full flex items-center justify-center px-4"
                            title="Adapt Text (Ctrl+Enter)"
                        >
                            {loading ? <Sparkles className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="mt-2 flex justify-between items-center">
                    <button
                        onClick={async () => {
                            try {
                                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                                if (tab.id) {
                                    const results = await chrome.scripting.executeScript({
                                        target: { tabId: tab.id },
                                        func: () => window.getSelection()?.toString() || ''
                                    });
                                    const text = results[0]?.result;
                                    if (text) {
                                        setInputText(text);
                                        setError(null);
                                    }
                                }
                            } catch (e) {
                                console.error('Failed to grab selection:', e);
                            }
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                        <Grab size={12} />
                        Grab Selection
                    </button>
                    <span className="text-[10px] text-slate-600">Ctrl+Enter to submit</span>
                </div>
            </div>
        </div>
    );
};
