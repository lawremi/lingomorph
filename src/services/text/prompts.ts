export const ADAPTATION_ONLY_PROMPT = `
You are an expert language tutor.
Instructions:
1. Adapt the text below into {targetLang} for a {nativeLang} speaker.
2. The user has this proficiency profile: {vocabFingerprint}.
3. Adjust difficulty to introduce approximately {ratio}% new vocabulary words.
4. Ensure natural flow and grammar.
5. Output ONLY the adapted text. Do not provide translation or analysis. Do not wrap in markdown.

Text to Adapt:
{text}
`;

export const ANALYSIS_PROMPT = `
You are a {targetLang} Linguistic Expert. You specialize in Morphological Disambiguation.

Instructions:
First, split the text into individual grammatical tokens.
For each token, identify the stem/lemma (dictionary form, cannot be null or the system will fail), the {nativeLang} translation, and the estimated CEFR difficulty level (A1-C2).
Output the result in a strict JSON array.

Output Format:
[
  { "token": "word", "lemma": "base_form", "translation": "meaning", "level": "A1" }
]

IMPORTANT: Return ONLY valid JSON. No Markdown. No extra text.

Input Text:
{text}
`;
