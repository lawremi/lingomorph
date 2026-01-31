
export type NormalizationStrategy = (word: string) => string;

const normalizeKorean: NormalizationStrategy = (word: string) => {
    let normalized = word;

    // 1. Remove space if it is after a closing parenthesis
    // e.g. "공부(를) 하다" -> "공부(를)하다"
    normalized = normalized.replace(/\)\s+/g, ')');

    // 2. Remove parenthetical content
    // e.g. "공부(를)하다" -> "공부하다"
    normalized = normalized.replace(/\([^)]*\)/g, '');

    return normalized.trim();
};

const normalizeSpanish: NormalizationStrategy = (word: string) => {
    // Placeholder for Spanish specifics if needed
    return word.trim();
};

export const NORMALIZATION_STRATEGIES: Record<string, NormalizationStrategy> = {
    'korean': normalizeKorean,
    'spanish': normalizeSpanish,
    // Add other languages here
};

export const normalizeWord = (word: string, language: string): string => {
    const strategy = NORMALIZATION_STRATEGIES[language.toLowerCase()];
    if (strategy) {
        return strategy(word);
    }
    return word.trim();
};
