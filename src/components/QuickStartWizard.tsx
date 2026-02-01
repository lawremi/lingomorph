import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { PROVIDERS } from '../config/models';
import { ModelManager } from '../services/mediapipe/modelManager';
import { ArrowRight, Download, Check } from 'lucide-react';

export const QuickStartWizard: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const { settings, updateSettings } = useSettings();
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cached, setCached] = useState(false);

    useEffect(() => {
        if (settings.llmProvider === 'mediapipe') {
            ModelManager.isModelCached().then(setCached);
        }
    }, [settings.llmProvider, downloading]);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateSettings({ llmProvider: e.target.value as any });
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const providerId = settings.llmProvider;
        const current = settings.providers[providerId];
        updateSettings({
            providers: {
                ...settings.providers,
                [providerId]: { ...current, apiKey: e.target.value }
            }
        });
    };



    const isConfigured = () => {
        if (settings.llmProvider === 'mediapipe') return cached;
        return !!settings.providers[settings.llmProvider]?.apiKey;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100 p-6">
            <div className="flex-1 flex flex-col justify-center items-center gap-6 max-w-sm mx-auto w-full">
                <div className="text-center space-y-2">
                    <img src="/icon.png" alt="Logo" className="w-12 h-12 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                        Welcome to Lingomorph
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Configure your AI provider to start adapting the web.
                    </p>
                </div>

                <div className="w-full space-y-4 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Provider</label>
                        <select
                            value={settings.llmProvider}
                            onChange={handleProviderChange}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
                        >
                            {Object.values(PROVIDERS).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {settings.llmProvider === 'mediapipe' ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-200">
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <span className="text-amber-400">⚠️</span> Hardware Warning
                                </p>
                                <p className="text-xs text-amber-300/80 mb-2">
                                    Gemma 3 12B is a large model (~8GB download). It requires a high-performance device with at least 16GB RAM and a dedicated GPU.
                                </p>
                                <p className="font-semibold mb-1">Setup Steps:</p>
                                <ol className="list-decimal pl-4 space-y-1 text-xs text-amber-300/80">
                                    <li>Accept license for <a href="https://huggingface.co/litert-community/Gemma3-12B-IT" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Gemma 3 12B</a>.</li>
                                    <li>Get a <a href="https://huggingface.co/settings/tokens/new?canReadGatedRepos=true&tokenType=fineGrained" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">HF Access Token</a>.</li>
                                </ol>
                            </div>

                            {!cached && (
                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        value={settings.providers['mediapipe']?.apiKey || ''}
                                        onChange={(e) => {
                                            const current = settings.providers['mediapipe'];
                                            updateSettings({
                                                providers: {
                                                    ...settings.providers,
                                                    mediapipe: { ...current, apiKey: e.target.value }
                                                }
                                            });
                                        }}
                                        placeholder="Paste Hugging Face Token (hf_...)"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                                    />

                                    <button
                                        onClick={async () => {
                                            const token = settings.providers['mediapipe']?.apiKey;
                                            if (!token) {
                                                alert("Please enter a Hugging Face Access Token.");
                                                return;
                                            }
                                            setDownloading(true);
                                            try {
                                                await ModelManager.downloadModel(token, setProgress);
                                                setCached(true);
                                            } catch (e: any) {
                                                console.error(e);
                                                alert("Download failed: " + e.message);
                                            } finally {
                                                setDownloading(false);
                                            }
                                        }}
                                        disabled={downloading}
                                        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {downloading ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                                {progress}%
                                            </>
                                        ) : (
                                            <>
                                                <Download size={18} />
                                                Download Gemma 3 12B
                                            </>
                                        )}
                                    </button>
                                    {downloading && (
                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {cached && (
                                <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 p-3 rounded-lg border border-green-400/20">
                                    <Check size={18} />
                                    Model Ready
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Key</label>
                            <input
                                type="password"
                                value={settings.providers[settings.llmProvider]?.apiKey || ''}
                                onChange={handleApiKeyChange}
                                placeholder={PROVIDERS[settings.llmProvider].placeholderApiKey}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                            <p className="text-[10px] text-slate-500">
                                Your key is stored locally and never shared.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={onComplete}
                    disabled={!isConfigured()}
                    className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/20"
                >
                    Start Learning <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};
