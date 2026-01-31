import OpenAI from 'openai';
import { LLMError } from './index';
import type { LLMProvider, LLMResponse } from './index';

export class OpenAIProvider implements LLMProvider {
    id = 'openai';
    name = 'OpenAI';
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new OpenAI({
            apiKey,
            dangerouslyAllowBrowser: true // Client-side use
        });
        this.model = model;
    }

    async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        try {
            const messages: any[] = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });

            const completion = await this.client.chat.completions.create({
                messages,
                model: this.model,
            });

            return {
                text: completion.choices[0].message.content || ''
            };
        } catch (error) {
            console.error('OpenAI Error:', error);
            throw new LLMError(error instanceof Error ? error.message : 'Unknown OpenAI error', this.id);
        }
    }
}
