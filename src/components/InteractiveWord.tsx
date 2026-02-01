import React from 'react';
import type { WordStatus } from '../types';

interface InteractiveWordProps {
    word: string;
    lemma: string;
    status: WordStatus['status'];
    definition?: string;
    level?: string;
    isActive?: boolean;
    onHover?: (active: boolean) => void;
    onClick: (word: string, lemma: string) => void;
    onAddAnki?: (lemma: string, definition?: string) => void;
    hasVocab?: boolean;
}

export const InteractiveWord: React.FC<InteractiveWordProps> = ({
    word,
    lemma,
    status,
    definition,
    level,
    isActive = false,
    onHover,
    onClick,
    onAddAnki,
    hasVocab = true
}) => {
    // Local state fallback if not controlled (backward compat)
    const [internalActive, setInternalActive] = React.useState(false);

    // Use controlled state if available, otherwise local
    const showTooltip = onHover ? isActive : internalActive;

    const getStatusColor = () => {
        // If not synced yet, everything looks "normal" (white/slate-200)
        if (!hasVocab && status === 'untracked') return 'text-slate-200';

        switch (status) {
            case 'untracked': return 'text-slate-400 border-b border-indigo-400/30 hover:bg-white/5'; // Gray with subtle hint
            case 'new': return 'text-blue-400 border-b border-blue-400/30 bg-blue-400/5'; // Anki New
            case 'learning': return 'text-red-400 border-b border-red-400/30 bg-red-400/5'; // Anki Learning
            case 'review': return 'text-slate-200 border-b border-slate-500/30 hover:bg-white/5'; // Anki Review (Subtle)
            case 'suspended': return 'text-yellow-400 border-b border-yellow-400/30 bg-yellow-400/5'; // Anki Suspended
            case 'buried': return 'text-amber-700 border-b border-amber-700/30 bg-amber-700/5'; // Anki Buried
            case 'known': return 'text-slate-200';
            default: return 'text-slate-200';
        }
    };


    const handleMouseEnter = () => {
        if (onHover) {
            onHover(true);
        } else {
            setInternalActive(true);
        }
    };

    const handleMouseLeave = () => {
        if (onHover) {
            onHover(false);
        } else {
            setInternalActive(false);
        }
    };

    return (
        <span
            className={`relative inline-block mx-0.5 px-0.5 rounded cursor-pointer transition-colors hover:bg-white/5 ${getStatusColor()}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick(word, lemma)}
        >
            {word}

            {/* Tooltip */}
            {showTooltip && (status !== 'known' || definition) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-700 rounded shadow-xl text-xs whitespace-nowrap z-50 flex flex-col gap-1 min-w-[120px]">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-200">{lemma}</span>
                            {level && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                                    {level}
                                </span>
                            )}
                        </div>
                    </div>

                    {definition && <div className="text-slate-400 max-w-[200px] whitespace-normal break-words">{definition}</div>}

                    {status === 'untracked' && onAddAnki && hasVocab && (
                        <button
                            className="mt-1 w-full text-[10px] bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 pointer-events-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddAnki(lemma, definition);
                            }}
                        >
                            <span className="font-bold">+</span> Add to Anki
                        </button>
                    )}

                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                </div>
            )}
        </span>
    );
};
