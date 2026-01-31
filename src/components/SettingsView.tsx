import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { PROVIDERS } from '../config/models';

export const SettingsView: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [syncing, setSyncing] = React.useState(false);
    const [syncMsg, setSyncMsg] = React.useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateSettings({ [name]: value });
    };

    const handleProviderUpdate = (providerId: string, field: 'apiKey' | 'model', value: string) => {
        const updatedProviders = {
            ...settings.providers,
            [providerId]: {
                ...settings.providers[providerId],
                [field]: value
            }
        };
        updateSettings({ providers: updatedProviders });
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold mb-4">Settings</h2>

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-400">Target Language</label>
                    <select
                        name="targetLanguage"
                        value={settings.targetLanguage}
                        onChange={handleChange}
                        className="w-full"
                    >
                        <option value="Spanish">Spanish</option>
                        <option value="Korean">Korean</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Chinese">Chinese (Mandarin)</option>
                        <option value="Russian">Russian</option>
                        <option value="Arabic">Arabic</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-400">Native Language</label>
                    <select
                        name="nativeLanguage"
                        value={settings.nativeLanguage}
                        onChange={handleChange}
                        className="w-full"
                    >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Korean">Korean</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Japanese">Japanese</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-slate-400">Anki Connect URL</label>
                    <input
                        name="ankiConnectUrl"
                        value={settings.ankiConnectUrl}
                        onChange={handleChange}
                        type="text"
                    />
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-300">Vocabulary Sync</h3>
                    </div>
                    <p className="text-xs text-slate-400">
                        Sync your Anki decks to identify known words.
                    </p>
                    <button
                        disabled={syncing}
                        onClick={async () => {
                            setSyncing(true);
                            setSyncMsg('Starting sync...');
                            try {
                                const { VocabularySyncService } = await import('../services/sync');
                                const syncer = new VocabularySyncService(settings);
                                const result = await syncer.sync((msg) => setSyncMsg(msg));
                                if (result.errors.length > 0) {
                                    alert(`Synced ${result.added} words. Warnings: \n${result.errors.join('\n')}`);
                                    setSyncMsg(`Completed with ${result.errors.length} warnings.`);
                                } else {
                                    alert(`Synced ${result.added} words from Anki!`);
                                    setSyncMsg('');
                                }
                            } catch (e: any) {
                                console.error(e);
                                alert(`Sync failed: ${e.message}`);
                                setSyncMsg('Sync failed');
                            } finally {
                                setSyncing(false);
                            }
                        }}
                        className={`btn-secondary w-full text-sm py-2 ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>

                    {syncMsg && (
                        <div className="text-xs text-blue-400 mt-2 animate-pulse">
                            {syncMsg}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            checked={settings.enableLLMNormalization}
                            onChange={(e) => updateSettings({ enableLLMNormalization: e.target.checked })}
                            id="enableLLM"
                        />
                        <label htmlFor="enableLLM" className="text-sm text-slate-300">
                            Use AI Normalization (Much slower and costlier, but more accurate dictionary forms)
                        </label>
                    </div>

                    <div className="text-xs text-slate-400 border-t border-slate-700/50 pt-3 mt-3">
                        <SyncStatsDisplay />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                    <h3 className="font-semibold text-slate-300">LLM Provider</h3>

                    <div className="flex flex-col gap-2">
                        <select
                            name="llmProvider"
                            value={settings.llmProvider}
                            onChange={handleChange}
                            className="w-full"
                        >
                            {Object.values(PROVIDERS).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Provider Configuration */}
                    {(() => {
                        const activeProvider = PROVIDERS[settings.llmProvider];
                        if (!activeProvider) return null;

                        // Access nested setting safely
                        const providerSettings = settings.providers[activeProvider.id] || { apiKey: '', model: '' };

                        return (
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">{activeProvider.name} API Key</label>
                                    <input
                                        value={providerSettings.apiKey}
                                        onChange={(e) => handleProviderUpdate(activeProvider.id, 'apiKey', e.target.value)}
                                        type="password"
                                        placeholder={activeProvider.placeholderApiKey}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Model</label>
                                    <select
                                        value={providerSettings.model}
                                        onChange={(e) => handleProviderUpdate(activeProvider.id, 'model', e.target.value)}
                                    >
                                        {activeProvider.models.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

const SyncStatsDisplay: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);

    React.useEffect(() => {
        const loadStats = async () => {
            const result = await chrome.storage.local.get('syncStats');
            if (result.syncStats) {
                setStats(result.syncStats);
            }
        };
        loadStats();

        const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.syncStats?.newValue) {
                setStats(changes.syncStats.newValue);
            }
        };
        chrome.storage.onChanged.addListener(listener);
        return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    if (!stats) return <p>No sync data yet.</p>;

    // Format relative time (e.g. "5 mins ago")
    const getTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between">
                <span>Last Synced:</span>
                <span className="text-slate-300">{getTimeAgo(stats.lastSynced)}</span>
            </div>
            <div className="flex justify-between">
                <span>Total Words:</span>
                <span className="text-slate-300">{stats.totalWords}</span>
            </div>
            <div className="flex justify-between">
                <span>Decks:</span>
                <span className="text-slate-300 truncate max-w-[150px]" title={stats.loadedDecks.join(', ')}>
                    {stats.loadedDecks.join(', ')}
                </span>
            </div>
        </div>
    );
};
