const BAD_WORDS = [
    'abuse', 'idiot', 'stupid', 'hate', 'kill', 'murder', 'sex', 'porn', 'xxx',
    'damn', 'hell', 'ass', 'bastard', 'bitch', 'shit', 'fuck'
];

export interface ModerationResult {
    isSafe: boolean;
    flaggedWords: string[];
    cleanedText: string;
}

export const moderateContent = (text: string): ModerationResult => {
    if (!text) return { isSafe: true, flaggedWords: [], cleanedText: '' };

    let cleanedText = text;
    const flaggedWords: string[] = [];

    BAD_WORDS.forEach(word => {
        // Use word boundaries (\b) to ensure we only match whole words
        // e.g., match "kill" but not "skill", "ass" but not "class"
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(text)) {
            flaggedWords.push(word);
            cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
        }
    });

    return {
        isSafe: flaggedWords.length === 0,
        flaggedWords,
        cleanedText
    };
};

export const validateInput = (text: string): string | null => {
    const result = moderateContent(text);
    if (!result.isSafe) {
        return `Your content contains inappropriate language: ${result.flaggedWords.join(', ')}. Please remove it.`;
    }
    return null;
};
