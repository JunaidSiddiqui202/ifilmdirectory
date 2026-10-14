const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found. AI features will be limited.');
}

export interface GeminiGenerateOptions {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}

/**
 * Generate content using Gemini API via direct REST calls
 * Uses v1 stable API which is confirmed to work
 */
export async function generateWithGemini(options: GeminiGenerateOptions): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    console.log('[Gemini] API Key loaded:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 20)}...` : 'NOT FOUND');

    // Try both v1 and v1beta endpoints with multiple models
    const endpoints = [
        // v1 API (might work better with free tier)
        { api: 'v1', model: 'gemini-pro' },
        { api: 'v1', model: 'gemini-1.5-flash' },
        // v1beta API
        { api: 'v1beta', model: 'gemini-1.5-flash-latest' },
        { api: 'v1beta', model: 'gemini-1.5-flash' },
        { api: 'v1beta', model: 'gemini-1.5-pro-latest' },
        { api: 'v1beta', model: 'gemini-1.5-pro' },
        { api: 'v1beta', model: 'gemini-pro' },
    ];

    for (const endpoint of endpoints) {
        try {
            const url = `https://generativelanguage.googleapis.com/${endpoint.api}/models/${endpoint.model}:generateContent?key=${GEMINI_API_KEY}`;

            console.log(`[Gemini] Trying ${endpoint.api}/${endpoint.model}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: options.prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxTokens || 2048,
                    }
                })
            });

            const data = await response.json();

            console.log(`[Gemini] Response status: ${response.status}`, response.ok ? '✅' : '❌');

            if (response.ok && data.candidates && data.candidates[0]) {
                const text = data.candidates[0].content.parts[0].text;
                console.log(`[Gemini] ✅ Success with ${endpoint.api}/${endpoint.model}`);
                return text;
            } else {
                console.warn(`[Gemini] ❌ Failed with ${endpoint.api}/${endpoint.model}:`, data.error?.message || 'Unknown error');
                // Try next endpoint
                continue;
            }
        } catch (error: any) {
            console.warn(`[Gemini] ❌ Network error with ${endpoint.api}/${endpoint.model}:`, error.message);
            // Try next endpoint
            continue;
        }
    }

    // All models failed
    throw new Error('Gemini API unavailable: All models failed. Please check your API key and quota.');
}

export default {
    generate: generateWithGemini
};
