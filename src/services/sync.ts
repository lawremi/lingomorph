import { AnkiConnect } from './anki';
import { saveVocab, type VocabItem } from './db';
import { LLMFactory } from './llm/factory';
import { normalizeWord } from './normalization';
import type { UserSettings } from '../types';

export class VocabularySyncService {
    private anki: AnkiConnect;
    private settings: UserSettings;

    constructor(settings: UserSettings) {
        this.anki = new AnkiConnect(settings.ankiConnectUrl);
        this.settings = settings;
    }

    async sync(onProgress?: (msg: string) => void): Promise<{ added: number, total: number, errors: string[] }> {
        const errors: string[] = [];
        // 1. Get all decks
        onProgress?.('Fetching decks...');
        const decks = await this.anki.getDeckNames();

        // Filter decks based on target language
        const targetDeck = decks.find(d => d.toLowerCase().includes(this.settings.targetLanguage.toLowerCase()));

        if (!targetDeck) {
            console.warn(`No deck found for ${this.settings.targetLanguage}`);
            return { added: 0, total: 0, errors: [] };
        }

        // 2. Find all notes
        onProgress?.(`Found deck: ${targetDeck}. Fetching notes...`);
        const noteIds = await this.anki.findNotes(`deck:"${targetDeck}"`);

        if (noteIds.length === 0) {
            return { added: 0, total: 0, errors: [] };
        }

        // 3. Get note info
        // We might want to chunk this if there are thousands of notes, but AnkiConnect usually handles reasonable batches
        // Let's cap at latest 500 for now to be safe and fast if not paginating
        // Actually user might want deep sync. Let's do all, but maybe limit if huge.
        onProgress?.(`Fetching details for ${noteIds.length} cards...`);
        const notes = await this.anki.notesInfo(noteIds);

        // 4. Transform to VocabItems (initial pass)
        const rawVocabItems: VocabItem[] = notes.map(note => {
            const fields = note.fields;
            const fieldNames = Object.keys(fields);
            let word = '';
            let definition = '';

            const wordField = fieldNames.find(f => ['word', 'front', 'vocab', 'expression'].includes(f.toLowerCase()));
            const defField = fieldNames.find(f => ['definition', 'back', 'meaning', 'translation'].includes(f.toLowerCase()));

            if (wordField) word = fields[wordField].value;
            else word = fields[fieldNames[0]].value;

            if (defField) definition = fields[defField].value;
            else if (fieldNames.length > 1) definition = fields[fieldNames[1]].value;

            word = this.stripHtml(word);
            definition = this.stripHtml(definition);

            return {
                id: note.noteId,
                word: word.toLowerCase().trim(),
                lemma: word.toLowerCase().trim(), // Fallback
                status: 'known',
                definition: definition,
                lastSynced: Date.now()
            };
        });

        // 5. Heuristic Normalization (Fast)
        onProgress?.('Applying heuristic normalization...');
        const heuristicallyNormalized = rawVocabItems.map(item => {
            const normalized = this.normalizeWithHeuristics(item.word, this.settings.targetLanguage);
            if (normalized !== item.word) {
                return { ...item, lemma: normalized };
            }
            return item;
        });

        let finalItems = heuristicallyNormalized;

        // 6. LLM Normalization (Optional, Expensive)
        if (this.settings.enableLLMNormalization) {
            onProgress?.(`Normalizing ${finalItems.length} words with AI...`);

            // chunk into batches of 50
            const batchSize = 50;
            const normalizedItems: VocabItem[] = [];

            for (let i = 0; i < finalItems.length; i += batchSize) {
                const batch = finalItems.slice(i, i + batchSize);
                const batchWords = batch.map(item => item.word);

                onProgress?.(`AI Normalizing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(finalItems.length / batchSize)}...`);

                try {
                    const mapping = await this.normalizeBatch(batchWords);

                    for (const item of batch) {
                        const lemma = mapping[item.word];
                        if (lemma) {
                            item.lemma = lemma.toLowerCase();
                        }
                        normalizedItems.push(item);
                    }
                } catch (err: any) {
                    const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${err.message || err}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                    onProgress?.(`Warning: ${errorMsg}. Falling back to heuristically normalized.`);
                    normalizedItems.push(...batch);
                }
            }
            finalItems = normalizedItems;
        } else {
            onProgress?.('Skipping AI normalization (disabled in settings).');
        }

        // 7. Save to DB
        onProgress?.('Saving to database...');
        await saveVocab(finalItems);

        // Save stats
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({
                syncStats: {
                    lastSynced: Date.now(),
                    loadedDecks: [targetDeck],
                    totalWords: finalItems.length
                }
            });
        }

        return {
            added: finalItems.length,
            total: finalItems.length,
            errors
        };
    }

    private normalizeWithHeuristics(word: string, language: string): string {
        return normalizeWord(word, language);
    }

    private async normalizeBatch(words: string[], retries = 3): Promise<Record<string, string>> {
        if (words.length === 0) return {};

        let lastError;
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const llm = LLMFactory.createProvider(this.settings);

                const prompt = `
                You are a linguistic expert. 
                I will provide a list of vocabulary items from a flashcard deck. 
                Your task is to identify the canonical dictionary form (lemma) for each item.
                
                Rules:
                1. Remove any parenthetical grammar markers like "(을/를)", "(이/가)", "(하다)" if they are not part of the dictionary form.
                2. Convert conjugated forms to their dictionary form (e.g., "정리하거나" -> "정리하다").
                3. If the word is already in dictionary form, keep it as is.
                4. Return ONLY a JSON object mapping the input word to the dictionary form.
                
                Input Words:
                ${JSON.stringify(words)}
                
                Output format:
                { "input_word": "lemma", ... }
                `;

                const response = await llm.complete(prompt);
                const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonStr);
            } catch (error) {
                console.warn(`LLM Normalization attempt ${attempt} failed:`, error);
                lastError = error;
                // Wait with exponential backoff: 1s, 2s, 4s
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                }
            }
        }
        throw lastError;
    }

    private stripHtml(html: string): string {
        try {
            const tmp = document.createElement('DIV');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        } catch (e) {
            return html.replace(/<[^>]*>?/gm, '');
        }
    }
}
