import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMError } from './index';
import type { LLMProvider, LLMResponse } from './index';

export class GeminiProvider implements LLMProvider {
    id = 'google';
    name = 'Google Gemini';
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(apiKey: string, model: string) {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = model;
    }

    async complete(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
        try {
            // Using configured model
            const model = this.client.getGenerativeModel({
                model: this.model,
                systemInstruction: systemPrompt
            });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return {
                text: response.text()
            };
        } catch (error) {
            console.error('Gemini Error:', error);
            throw new LLMError(error instanceof Error ? error.message : 'Unknown Gemini error', this.id);
        }
    }
}
