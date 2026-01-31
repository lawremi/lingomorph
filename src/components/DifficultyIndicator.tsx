import React from 'react';

interface DifficultyIndicatorProps {
    newWordsCount: number;
    totalWords: number;
}

export const DifficultyIndicator: React.FC<DifficultyIndicatorProps> = ({ newWordsCount, totalWords }) => {
    const percentage = totalWords > 0 ? (newWordsCount / totalWords) * 100 : 0;

    let label = 'Easy';
    let color = 'text-green-400';
    let barColor = 'bg-green-400';

    if (percentage > 20) {
        label = 'Hard';
        color = 'text-red-400';
        barColor = 'bg-red-400';
    } else if (percentage > 5) {
        label = 'Good Match';
        color = 'text-yellow-400';
        barColor = 'bg-yellow-400';
    }

    return (
        <div className="flex items-center gap-2 text-xs">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
                <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className={`font-medium ${color}`}>{label}</span>
            <span className="text-slate-500">{Math.round(percentage)}% new</span>
        </div>
    );
};
