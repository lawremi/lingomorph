import React, { useState, useEffect } from 'react';
import { Settings, Book, Flame } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { AdaptationView } from './AdaptationView';
import { ProgressBar } from './ProgressBar';
import { useSettings } from '../context/SettingsContext';

type Tab = 'adapt' | 'settings';

export const SidePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('adapt');
    const { settings } = useSettings();
    const [progress, setProgress] = useState({ date: '', count: 0 });
    const [streak, setStreak] = useState({ count: 0, lastMetDate: '' });

    const [syncing, setSyncing] = useState(false);
    const { updateSettings } = useSettings();

    useEffect(() => {
        const loadProgress = async () => {
            const today = new Date().toDateString();
            const result = await chrome.storage.local.get(['dailyProgress', 'streak']);
            const data = result.dailyProgress as { date: string, count: number } | undefined;
            const streakData = result.streak as { count: number, lastMetDate: string } | undefined;

            if (data && data.date === today) {
                setProgress(data);
            } else {
                setProgress({ date: today, count: 0 });
            }

            // Validate Streak
            if (streakData) {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const yesterday = d.toDateString();

                // If last met was strictly before yesterday (and not today), streak is broken
                if (streakData.lastMetDate !== today && streakData.lastMetDate !== yesterday && streakData.count > 0) {
                    console.log("Streak broken. Resetting to 0.");
                    const newStreak = { count: 0, lastMetDate: streakData.lastMetDate };
                    await chrome.storage.local.set({ streak: newStreak });
                    setStreak(newStreak);
                } else {
                    setStreak(streakData);
                }
            }
        };
        loadProgress();

        // Auto-Sync Logic
        const checkAutoSync = async () => {
            if (settings.autoSync) {
                const storage = await chrome.storage.local.get('syncStats');
                const syncStats = storage.syncStats as { lastSynced: number } | undefined;
                const lastSynced = syncStats?.lastSynced || 0;
                const oneDay = 24 * 60 * 60 * 1000;

                // If never synced or > 24h ago, try to sync
                if (Date.now() - lastSynced > oneDay) {
                    console.log("Triggering Auto-Sync...");
                    setSyncing(true);
                    try {
                        const { VocabularySyncService } = await import('../services/sync');
                        const syncer = new VocabularySyncService(settings);
                        await syncer.sync();
                        // Clear any previous error on success
                        updateSettings({ lastSyncError: undefined });
                    } catch (e: any) {
                        console.error("Auto-sync failed:", e);
                        updateSettings({ lastSyncError: e.message || "Auto-sync failed" });
                    } finally {
                        setSyncing(false);
                    }
                }
            }
        };
        // Small delay to ensure settings are loaded
        const timer = setTimeout(checkAutoSync, 1000);

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.dailyProgress?.newValue) {
                const newData = changes.dailyProgress.newValue as { date: string, count: number };
                const today = new Date().toDateString();
                if (newData.date === today) {
                    setProgress(newData);
                } else {
                    setProgress({ date: today, count: 0 });
                }
            }
            if (changes.streak?.newValue) {
                setStreak(changes.streak.newValue as { count: number, lastMetDate: string });
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => {
            chrome.storage.onChanged.removeListener(listener);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="flex flex-col gap-2 p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-2">
                    <img src="/icon.png" alt="Logo" className="w-6 h-6" />
                    <h1 className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                        Lingomorph
                    </h1>
                    {syncing && <span className="text-[10px] text-violet-400 animate-pulse">Syncing...</span>}
                </div>

                <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                Daily Goal
                            </span>
                            {/* Streak Display grouped with Daily Goal */}
                            <div className={`flex items-center gap-1 ${streak.count > 0 ? 'text-orange-400' : 'text-slate-600'}`} title="Daily Streak">
                                <Flame size={14} fill="currentColor" className={streak.count > 0 ? 'animate-pulse' : ''} />
                                <span className="font-bold">{streak.count}</span>
                            </div>
                        </div>
                        <span className={progress.count >= settings.dailyGoal ? 'text-yellow-400 font-bold' : ''}>
                            {progress.count}/{settings.dailyGoal}
                        </span>
                    </div>
                    {/* Render ProgressBar without label to use our custom header */}
                    <ProgressBar current={progress.count} max={settings.dailyGoal} />
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
