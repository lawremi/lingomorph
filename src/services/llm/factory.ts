import type { UserSettings } from '../../types';
import type { LLMProvider } from './index';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';

export class LLMFactory {
    static createProvider(settings: UserSettings): LLMProvider {
        const providerSettings = settings.providers[settings.llmProvider];

        if (!providerSettings?.apiKey) {
            throw new Error(`${settings.llmProvider} API Key not configured`);
        }

        switch (settings.llmProvider) {
            case 'google':
                return new GeminiProvider(providerSettings.apiKey, providerSettings.model);
            case 'openai':
                return new OpenAIProvider(providerSettings.apiKey, providerSettings.model);
            case 'anthropic':
                return new AnthropicProvider(providerSettings.apiKey, providerSettings.model);
            default:
                throw new Error(`Unsupported provider: ${settings.llmProvider}`);
        }
    }
}
