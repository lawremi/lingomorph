import type { UserSettings } from '../../types';
import type { LLMProvider } from './index';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';

import { MediaPipeProvider } from './mediapipe';

export class LLMFactory {
    // Singleton instance for MediaPipe to avoid reloading the model/worker
    private static mediapipeInstance: MediaPipeProvider | null = null;

    static createProvider(settings: UserSettings): LLMProvider {
        const providerSettings = settings.providers[settings.llmProvider];

        if (settings.llmProvider !== 'mediapipe' && !providerSettings?.apiKey) {
            throw new Error(`${settings.llmProvider} API Key not configured`);
        }

        switch (settings.llmProvider) {
            case 'google':
                return new GeminiProvider(providerSettings.apiKey, providerSettings.model);
            case 'openai':
                return new OpenAIProvider(providerSettings.apiKey, providerSettings.model);
            case 'anthropic':
                return new AnthropicProvider(providerSettings.apiKey, providerSettings.model);
            case 'mediapipe':
                if (!LLMFactory.mediapipeInstance) {
                    LLMFactory.mediapipeInstance = new MediaPipeProvider();
                }
                return LLMFactory.mediapipeInstance;
            default:
                throw new Error(`Unsupported provider: ${settings.llmProvider}`);
        }
    }
}
