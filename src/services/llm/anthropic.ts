import Anthropic from '@anthropic-ai/sdk';
import { LLMError } from './index';
import type { LLMProvider, LLMResponse } from './index';

export class AnthropicProvider implements LLMProvider {
    id = 'anthropic';
    name = 'Anthropic';
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new Anthropic({
            apiKey,
            dangerouslyAllowBrowser: true
        });
        this.model = model;
    }

    async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: prompt }]
            });

            // Anthropic content is an array of content blocks
            const text = response.content
                .filter(c => c.type === 'text')
                .map(c => (c as any).text)
                .join('');

            return {
                text
            };
        } catch (error) {
            console.error('Anthropic Error:', error);
            throw new LLMError(error instanceof Error ? error.message : 'Unknown Anthropic error', this.id);
        }
    }
}
