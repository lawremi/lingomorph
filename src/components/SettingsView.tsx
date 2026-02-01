import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { PROVIDERS } from '../config/models';
import { AnkiConnect } from '../services/anki';
import { VocabularySyncService } from '../services/sync';

export const SettingsView: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const [ankiWarning, setAnkiWarning] = useState<string | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [availableFields, setAvailableFields] = useState<string[]>([]);

    // Initial load of Anki models
    useEffect(() => {
        const loadModels = async () => {
            const anki = new AnkiConnect(settings.ankiConnectUrl);
            try {
                const models = await anki.getModelNames();
                setAvailableModels(models);
            } catch (e) {
                console.error("Failed to load Anki models on mount", e);
            }
        };
        loadModels();
    }, [settings.ankiConnectUrl]);

    // Load fields when Note Type changes
    useEffect(() => {
        const loadFields = async () => {
            if (!settings.ankiNoteType) return;

            const anki = new AnkiConnect(settings.ankiConnectUrl);
            try {
                // If "Basic" is selected but not actually in Anki, this might fail or return empty.
                // But generally users will select a valid type from the list.
                const fields = await anki.getModelFieldNames(settings.ankiNoteType);
                setAvailableFields(fields);

                // Auto-select defaults if current settings are not in the new list
                // or if we want to be smart about "Front" / "Back" detection
                if (fields.length > 0) {
                    const updates: any = {};
                    if (!fields.includes(settings.ankiFrontField)) {
                        updates.ankiFrontField = fields.find(f => f.toLowerCase().includes('front') || f.toLowerCase().includes('target') || f.toLowerCase().includes('word')) || fields[0];
                    }
                    if (!fields.includes(settings.ankiBackField)) {
                        updates.ankiBackField = fields.find(f => f.toLowerCase().includes('back') || f.toLowerCase().includes('def') || f.toLowerCase().includes('meaning')) || fields[1] || fields[0];
                    }
                    if (Object.keys(updates).length > 0) {
                        updateSettings(updates);
                    }
                }
            } catch (e) {
                console.error("Failed to load fields for model", settings.ankiNoteType, e);
                setAvailableFields([]);
            }
        };
        loadFields();
    }, [settings.ankiConnectUrl, settings.ankiNoteType]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateSettings({ [name]: value });
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncMsg('Starting sync...');
        setAnkiWarning(null);

        try {
            const syncer = new VocabularySyncService(settings);
            const result = await syncer.sync((msg) => setSyncMsg(msg));

            if (result.errors.length > 0) {
                setSyncMsg(`Completed with ${result.errors.length} warnings.`);
            } else {
                setSyncMsg('Sync completed successfully!');
            }

            // Refresh models after sync
            const anki = new AnkiConnect(settings.ankiConnectUrl);
            const models = await anki.getModelNames();
            setAvailableModels(models);

        } catch (e: any) {
            console.error(e);
            setAnkiWarning(`Sync failed: ${e.message}. Is Anki running with AnkiConnect?`);
            setSyncMsg('Sync failed');
        } finally {
            setSyncing(false);
        }
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
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
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
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                    />
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                    <h3 className="font-semibold text-slate-300">Anki Integration</h3>

                    {/* Note Type Selection */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-slate-400">Note Type</label>
                            <button
                                onClick={async () => {
                                    const anki = new AnkiConnect(settings.ankiConnectUrl);
                                    try {
                                        const models = await anki.getModelNames();
                                        setAvailableModels(models);
                                        // Trigger field reload if current model is still valid, or just let user re-select
                                        setSyncMsg(`Loaded ${models.length} types`);
                                        setTimeout(() => setSyncMsg(''), 2000);
                                    } catch (e) {
                                        setAnkiWarning("Failed to connect to Anki.");
                                    }
                                }}
                                className="text-xs text-slate-500 hover:text-violet-400 transition-colors"
                            >
                                ↻ Refresh from Anki
                            </button>
                        </div>
                        <select
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                            value={settings.ankiNoteType}
                            onChange={(e) => updateSettings({ ankiNoteType: e.target.value })}
                        >
                            {availableModels.length === 0 && <option value="Basic">Basic (Default)</option>}
                            {availableModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Field Mapping */}
                    {availableFields.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-slate-400">Front Field (Word)</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                                    value={settings.ankiFrontField}
                                    onChange={(e) => updateSettings({ ankiFrontField: e.target.value })}
                                >
                                    {availableFields.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-slate-400">Back Field (Definition)</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                                    value={settings.ankiBackField}
                                    onChange={(e) => updateSettings({ ankiBackField: e.target.value })}
                                >
                                    {availableFields.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
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
                        onClick={handleSync}
                        className={`w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 px-4 rounded transition-colors ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>

                    {syncMsg && (
                        <div className="text-xs text-blue-400 mt-2 animate-pulse">
                            {syncMsg}
                        </div>
                    )}

                    {ankiWarning && (
                        <div className="text-xs text-red-400 mt-2 p-2 bg-red-400/10 rounded border border-red-400/20">
                            {ankiWarning}
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            checked={settings.enableLLMNormalization}
                            onChange={(e) => updateSettings({ enableLLMNormalization: e.target.checked })}
                            id="enableLLM"
                            className="rounded bg-slate-700 border-slate-600 text-violet-600 focus:ring-violet-500"
                        />
                        <label htmlFor="enableLLM" className="text-sm text-slate-300">
                            Use AI Normalization (Slower, costlier, but more accurate)
                        </label>
                    </div>



                    <div className="text-xs text-slate-400 mt-3">
                        <SyncStatsDisplay />
                    </div>

                    {settings.vocabularyFingerprint && (
                        <div className="mt-4 pt-3 border-t border-slate-700/50">
                            <details className="group">
                                <summary className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-300 hover:text-white select-none">
                                    <span>Vocabulary Fingerprint</span>
                                    <span className="text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-2 p-2 bg-slate-900/50 rounded text-xs text-slate-400 font-mono leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                                    {settings.vocabularyFingerprint}
                                </div>
                            </details>
                        </div>
                    )}
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                    <h3 className="font-semibold text-slate-300">Daily Goals</h3>
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-300">Target Adaptations</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-right focus:outline-none focus:border-violet-500"
                            value={settings.dailyGoal}
                            onChange={(e) => updateSettings({ dailyGoal: parseInt(e.target.value) || 10 })}
                        />
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                    <h3 className="font-semibold text-slate-300">LLM Provider</h3>

                    <div className="flex flex-col gap-2">
                        <select
                            name="llmProvider"
                            value={settings.llmProvider}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
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
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm text-slate-400">Model</label>
                                    <select
                                        value={providerSettings.model}
                                        onChange={(e) => handleProviderUpdate(activeProvider.id, 'model', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500"
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
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
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
