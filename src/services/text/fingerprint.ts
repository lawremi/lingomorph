
import type { UserSettings } from '../../types';
import { getAllVocab } from '../db';
import { LLMFactory } from '../llm/factory';

const FINGERPRINT_PROMPT = `
You are an expert linguist and language teacher.
Your goal is to create a "vocabulary fingerprint" for a language learner based on their known vocabulary.
This fingerprint will be used to adapt future texts to their level.

Input:
- Target Language: {targetLang}
- Native Language: {nativeLang}
- Total Words Known: {totalWords}
- Vocabulary List (grouped by status):
{vocabList}

Instructions:
1. Analyze the provided vocabulary to estimate the user's proficiency level (CEFR A1-C2, or ACTFL).
2. Identify key semantic fields or topics where the user has strong vocabulary.
3. Identify gaps or areas where the user might struggle.
4. Synthesize this into a concise "fingerprint" or "learner profile" (max 100 words).
   - This profile should be descriptive enough for an LLM to adapt text effectively.
   - Example: "User is a high A2 learner. Strong in daily routine and travel vocabulary. Weak in abstract concepts and business terminology. Familiar with past tense but struggles with conditionals."

Output:
Return ONLY the fingerprint string. Do not include any introductory text or formatting like "Here is the fingerprint:".
`;

export const generateFingerprint = async (settings: UserSettings): Promise<string> => {
    try {
        const allVocab = await getAllVocab();

        // Filter out suspended and buried. 'known' is not used for Anki sync but might exist internally?
        // User says "known status is even a real thing from the Anki perspective".
        // We stick to new, learning, review.
        const activeVocab = allVocab.filter(item =>
            ['new', 'learning', 'review'].includes(item.status)
        );

        if (activeVocab.length === 0) {
            return "Beginner (No vocabulary data available)";
        }

        // Group by status
        const byStatus: Record<string, string[]> = {
            learning: [],
            new: [],
            review: []
        };

        activeVocab.forEach(v => {
            if (byStatus[v.status]) {
                byStatus[v.status].push(v.lemma);
            }
        });

        // Prioritize: Learning (top 150) > New (top 150) > Review (top 200)
        // Taking latest added (highest ID) for each category
        const learning = byStatus.learning.sort().reverse().slice(0, 150);
        const newWords = byStatus.new.sort().reverse().slice(0, 150);
        const review = byStatus.review.sort().reverse().slice(0, 200);

        const vocabList = `
Learning: ${learning.join(', ')}
New: ${newWords.join(', ')}
Review: ${review.join(', ')}
        `.trim();

        const provider = LLMFactory.createProvider(settings);

        const prompt = FINGERPRINT_PROMPT
            .replace('{targetLang}', settings.targetLanguage)
            .replace('{nativeLang}', settings.nativeLanguage)
            .replace('{totalWords}', activeVocab.length.toString())
            .replace('{vocabList}', vocabList);

        const response = await provider.complete(prompt);
        return response.text.trim();

    } catch (e) {
        console.error("Failed to generate vocabulary fingerprint", e);
        return "Error generating fingerprint. Assuming Intermediate level.";
    }
};
