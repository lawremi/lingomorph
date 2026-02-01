import React, { useState } from 'react';
import { Settings, Book } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { AdaptationView } from './AdaptationView';

type Tab = 'adapt' | 'settings';

export const SidePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('adapt');

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <img src="/icon.png" alt="Logo" className="w-6 h-6" />
                    <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                        Lingomorph
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'adapt' && <AdaptationView />}
                {activeTab === 'settings' && <SettingsView />}
            </main>

            {/* Basic Tab Bar */}
            <nav className="flex items-center justify-around p-2 border-t border-slate-800 bg-slate-900">
                <button
                    onClick={() => setActiveTab('adapt')}
                    className={`p-2 rounded-lg transition-colors ${activeTab === 'adapt' ? 'text-violet-400 bg-violet-400/10' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    title="Adapt Text"
                >
                    <Book size={20} />
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`p-2 rounded-lg transition-colors ${activeTab === 'settings' ? 'text-violet-400 bg-violet-400/10' : 'text-slate-400 hover:text-slate-200'
                        }`}
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </nav>
        </div>
    );
};
