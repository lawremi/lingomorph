import React, { useState } from 'react';
import { InteractiveWord } from './InteractiveWord';
import { DifficultyIndicator } from './DifficultyIndicator';
import type { AdaptedText } from '../types';
import { AdaptationService } from '../services/text/adaptation';
import { useSettings } from '../context/SettingsContext';
import { LLMFactory } from '../services/llm/factory';
import { getVocabSample } from '../services/db';
import { Sparkles, Grab } from 'lucide-react';

export const AdaptationView: React.FC = () => {
    const { settings } = useSettings();
    const [inputText, setInputText] = useState('');
    const [history, setHistory] = useState<AdaptedText[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tooltip State Management
    const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
    const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
            const sample = await getVocabSample(50);
            const provider = LLMFactory.createProvider(settings);
            const service = new AdaptationService(provider, settings);
            const result = await service.adaptText(inputText, sample);

            setHistory(prev => [...prev, result]);
            setInputText(''); // Clear input after successful adaptation
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

    const handleAddAnki = async (word: string, lemma: string, definition?: string) => {
        try {
            const { AnkiConnect } = await import('../services/anki');
            const anki = new AnkiConnect(settings.ankiConnectUrl);
            const deck = await anki.getDeckNames();
            const targetDeck = deck.find(d => d.toLowerCase().includes(settings.targetLanguage.toLowerCase())) || deck[0];

            if (!targetDeck) throw new Error('No deck found');

            // Basic Note Type handling - assuming "Basic" or similar for now
            // In a real app we'd let user map model fields
            await anki.addNote(targetDeck, 'Basic', {
                'Front': lemma,
                'Back': `${definition || ''} <br><small>(${word})</small>`
            }, ['lingomorph']);

            alert(`Added "${lemma}" to Anki deck "${targetDeck}"!`);
        } catch (e: any) {
            console.error(e);
            alert(`Failed to add to Anki: ${e.message}`);
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
                            newWordsCount={item.words.filter(w => w.status === 'new').length}
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
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <details className="text-xs text-slate-500">
                            <summary className="cursor-pointer hover:text-slate-400 select-none">Show Original</summary>
                            <p className="mt-2 italic p-2 bg-slate-800/30 rounded">
                                {item.original}
                            </p>
                        </details>
                    </div>
                ))}
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
