import type { LLMProvider } from '../llm/index';
import type { AdaptedText, UserSettings } from '../../types';
import { ADAPTATION_ONLY_PROMPT, ANALYSIS_PROMPT } from './prompts';
import { getVocabByLemma } from '../db';

export class AdaptationService {
    private provider: LLMProvider;
    private settings: UserSettings;

    constructor(provider: LLMProvider, settings: UserSettings) {
        this.provider = provider;
        this.settings = settings;
    }

    async adaptText(text: string): Promise<AdaptedText> {
        const fingerprint = this.settings.vocabularyFingerprint || "Beginner (No vocabulary data available)";

        // Step 1: Adaptation (Text Only)
        console.log("Step 1: Adapting text...");
        const adaptationPrompt = ADAPTATION_ONLY_PROMPT
            .replace(/{targetLang}/g, this.settings.targetLanguage)
            .replace(/{nativeLang}/g, this.settings.nativeLanguage)
            .replace(/{vocabFingerprint}/g, fingerprint)
            .replace(/{ratio}/g, '20') // TODO: Make configurable
            .replace('{text}', text);

        const adaptationResponse = await this.provider.complete(adaptationPrompt);

        let adaptedText = adaptationResponse.text.trim();
        // Remove markdown block if model added it despite instructions
        adaptedText = adaptedText.replace(/^```(text|markdown)?\n?/i, '').replace(/\n?```$/, '').trim();

        // Step 2: Analysis (JSON)
        console.log("Step 2: Analyzing text...", adaptedText.substring(0, 50) + "...");
        const analysisPrompt = ANALYSIS_PROMPT
            .replace(/{targetLang}/g, this.settings.targetLanguage)
            .replace(/{nativeLang}/g, this.settings.nativeLanguage)
            .replace('{text}', adaptedText);

        const analysisResponse = await this.provider.complete(analysisPrompt);
        const cleanJson = analysisResponse.text.replace(/```json\n?|\n?```/g, '').trim();

        try {
            if (!cleanJson) {
                throw new Error("Empty response from analysis step.");
            }

            const analysis = JSON.parse(cleanJson);

            if (!Array.isArray(analysis)) {
                throw new Error("Analysis output is not an array.");
            }

            const words = await Promise.all(analysis.map(async (item: any) => {
                const lemma = item.lemma?.toLowerCase();
                // Fallback: If lemma is null/empty, use the token itself
                const validLemma = lemma || item.token.toLowerCase();

                const knownWord = await getVocabByLemma(validLemma);

                return {
                    text: item.token,
                    lemma: validLemma,
                    status: knownWord ? knownWord.status : 'untracked',
                    definition: item.translation || '',
                    level: item.level || 'A1'
                };
            }));

            // Filter out any completely malformed items
            const validWords = words.filter((w): w is any => !!w.text);

            return {
                original: text,
                adapted: adaptedText,
                words: validWords
            };
        } catch (e: any) {
            console.error('Failed to parse Analysis response', e);
            console.log('Raw Analysis Output:', analysisResponse.text);

            const rawPreview = analysisResponse.text.slice(0, 200) + (analysisResponse.text.length > 200 ? '...' : '');
            throw new Error(`Analysis Error: ${e.message}. Raw: "${rawPreview}"`);
        }
    }
}
