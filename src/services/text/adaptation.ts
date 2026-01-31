import type { LLMProvider } from '../llm/index';
import type { AdaptedText, UserSettings } from '../../types';
import { ADAPTATION_SYSTEM_PROMPT } from './prompts';
import { getVocabByLemma } from '../db';

export class AdaptationService {
    private provider: LLMProvider;
    private settings: UserSettings;

    constructor(provider: LLMProvider, settings: UserSettings) {
        this.provider = provider;
        this.settings = settings;
    }

    async adaptText(text: string, knownVocabSample: string[] = []): Promise<AdaptedText> {
        const prompt = ADAPTATION_SYSTEM_PROMPT
            .replace('{targetLang}', this.settings.targetLanguage)
            .replace('{nativeLang}', this.settings.nativeLanguage)
            .replace('{vocabSample}', knownVocabSample.join(', '))
            .replace('{ratio}', '20') // TODO: Make configurable
            .replace('{text}', text);

        const response = await this.provider.complete(prompt);

        // Parse JSON output
        // The LLM might wrap it in markdown code blocks
        const cleanJson = response.text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanJson);

            const words = await Promise.all(parsed.analysis.map(async (item: any) => {
                const lemma = item.lemma.toLowerCase();
                const knownWord = await getVocabByLemma(lemma);

                return {
                    text: item.token,
                    lemma: item.lemma,
                    status: knownWord ? knownWord.status : 'new',
                    definition: item.translation,
                    level: item.level
                };
            }));

            return {
                original: text,
                adapted: parsed.adaptedText,
                words
            };
        } catch (e) {
            console.error('Failed to parse LLM response', e);
            // Fallback
            return {
                original: text,
                adapted: response.text,
                words: []
            };
        }
    }
}
