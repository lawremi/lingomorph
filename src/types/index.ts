export interface UserSettings {
    llmProvider: 'google' | 'openai' | 'anthropic';
    ankiConnectUrl: string;
    targetLanguage: string;
    nativeLanguage: string;
    enableLLMNormalization: boolean;
    ankiNoteType: string;
    ankiFrontField: string;
    ankiBackField: string;
    vocabularyFingerprint?: string;
    dailyGoal: number;
    providers: Record<string, ProviderSettings>;
}

export interface ProviderSettings {
    apiKey: string;
    model: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
    llmProvider: 'google',
    ankiConnectUrl: 'http://127.0.0.1:8765',
    targetLanguage: 'Spanish',
    nativeLanguage: 'English',
    enableLLMNormalization: false,
    ankiNoteType: 'Basic',
    ankiFrontField: 'Front',
    ankiBackField: 'Back',
    vocabularyFingerprint: '',
    dailyGoal: 10,
    providers: {
        google: { apiKey: '', model: 'gemini-3-flash-preview' },
        openai: { apiKey: '', model: 'gpt-5-mini' },
        anthropic: { apiKey: '', model: 'claude-4.5-sonnet' }
    }
};

export interface WordStatus {
    word: string;
    status: 'untracked' | 'new' | 'learning' | 'review' | 'known' | 'suspended' | 'buried';
    definition?: string;
    id?: number; // Anki Note ID
}

export interface SyncStats {
    lastSynced: number; // timestamp
    loadedDecks: string[];
    totalWords: number;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AdaptedText {
    original: string;
    adapted: string;
    words: {
        text: string;
        lemma: string;
        definition?: string;
        level?: string; // e.g., 'A1', 'B2', 'High', 'Low'
        status: WordStatus['status'];
    }[];
    chatHistory?: Message[];
}
