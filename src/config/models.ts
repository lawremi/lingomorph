export interface Model {
    id: string;
    name: string;
}

export interface ProviderConfig {
    id: string;
    name: string;
    models: Model[];
    placeholderApiKey: string;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
    google: {
        id: 'google',
        name: 'Google Gemini',
        placeholderApiKey: 'AIza...',
        models: [
            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
            { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        ]
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        placeholderApiKey: 'sk-...',
        models: [
            { id: 'gpt-5.2', name: 'GPT-5.2 (Flagship)' },
            { id: 'gpt-5', name: 'GPT-5' },
            { id: 'gpt-5-mini', name: 'GPT-5 mini' },
            { id: 'gpt-4o', name: 'GPT-4o (Legacy)' },
        ]
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        placeholderApiKey: 'sk-ant-...',
        models: [
            { id: 'claude-4.5-sonnet', name: 'Claude 4.5 Sonnet' },
            { id: 'claude-4.5-opus', name: 'Claude 4.5 Opus' },
            { id: 'claude-4.5-haiku', name: 'Claude 4.5 Haiku' },
            { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
        ]
    },
    mediapipe: {
        id: 'mediapipe',
        name: 'MediaPipe (On-Device)',
        placeholderApiKey: 'hf_... (Hugging Face Token)',
        models: [
            { id: 'gemma3-12b-it-int4-web.task', name: 'Gemma 3 12B IT (Int4)' }
        ]
    }
};

// Flattened generic lists if needed, but PROVIDERS structure is preferred for generic UI.
export const GOOGLE_MODELS = PROVIDERS.google.models;
export const OPENAI_MODELS = PROVIDERS.openai.models;
export const ANTHROPIC_MODELS = PROVIDERS.anthropic.models;
