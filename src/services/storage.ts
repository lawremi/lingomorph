import type { UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const isExtension = typeof chrome !== 'undefined' && !!chrome.storage;

export const saveSettings = async (settings: UserSettings): Promise<void> => {
    if (isExtension) {
        await chrome.storage.local.set({ settings });
    } else {
        localStorage.setItem('lingomorph_settings', JSON.stringify(settings));
    }
};

export const loadSettings = async (): Promise<UserSettings> => {
    if (isExtension) {
        const result = await chrome.storage.local.get('settings');
        return { ...DEFAULT_SETTINGS, ...(result.settings as Partial<UserSettings>) };
    } else {
        const stored = localStorage.getItem('lingomorph_settings');
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    }
};
