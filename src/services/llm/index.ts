export interface LLMResponse {
    text: string;
    // potentially usage stats, etc.
}

export interface LLMProvider {
    id: string;
    name: string;
    complete(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}

export class LLMError extends Error {
    public provider: string;
    constructor(message: string, provider: string) {
        super(message);
        this.provider = provider;
        this.name = 'LLMError';
    }
}
