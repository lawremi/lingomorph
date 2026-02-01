import React from 'react';
import { Target } from 'lucide-react';

interface ProgressBarProps {
    current: number;
    max: number;
    label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, label }) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const isComplete = current >= max;

    return (
        <div className={`flex flex-col gap-1 w-full max-w-[200px] transition-all duration-500 ${isComplete ? 'scale-105' : ''}`}>
            {label && (
                <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <Target size={12} className={isComplete ? 'text-yellow-400 animate-pulse' : ''} />
                        {label}
                    </span>
                    <span className={isComplete ? 'text-yellow-400 font-bold' : ''}>
                        {current}/{max}
                    </span>
                </div>
            )}
            <div className={`h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative ${isComplete ? 'shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}`}>
                <div
                    className={`h-full transition-all duration-700 ease-out rounded-full ${isComplete
                        ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 animate-shimmer bg-[length:200%_100%]'
                        : 'bg-violet-500'}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
