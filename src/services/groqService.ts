export interface AIResponse {
    text: string;
    error?: string;
    provider?: string;
}

interface AIProviderConfig {
    name: string;
    endpoint: string;
    apiKey: string;
    models: string[];
    extraHeaders?: Record<string, string>;
}

// In-memory cache for recent AI responses to prevent duplicate calls and save rate limits
const responseCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Multi-Cloud Free AI Engine
 * Pools multiple free-tier providers (Groq Primary, Groq Backup, Cerebras, SambaNova, OpenRouter)
 * with automatic zero-downtime rate-limit failover.
 */
export const generateText = async (prompt: string, context: string = '', language: string = 'English'): Promise<AIResponse> => {
    const cacheKey = `${prompt.trim()}_${context}_${language}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return { text: cached.text, provider: 'cache' };
    }

    // 1. Gather all active cloud providers from environment
    const providers: AIProviderConfig[] = [];

    // Groq Primary
    const groqKey1 = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey1) {
        providers.push({
            name: 'Groq (Primary)',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: groqKey1,
            models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
        });
    }

    // Groq Secondary / Backup Key (if user adds a second free Groq account key)
    const groqKey2 = import.meta.env.VITE_GROQ_API_KEY_2;
    if (groqKey2) {
        providers.push({
            name: 'Groq (Secondary)',
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            apiKey: groqKey2,
            models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
        });
    }

    // Cerebras Cloud (100% Free Tier, 30 RPM, 1M tokens/day)
    const cerebrasKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    if (cerebrasKey) {
        providers.push({
            name: 'Cerebras Cloud',
            endpoint: 'https://api.cerebras.ai/v1/chat/completions',
            apiKey: cerebrasKey,
            models: ['llama3.1-70b', 'llama3.1-8b']
        });
    }

    // SambaNova Cloud (100% Free Tier)
    const sambanovaKey = import.meta.env.VITE_SAMBANOVA_API_KEY;
    if (sambanovaKey) {
        providers.push({
            name: 'SambaNova Cloud',
            endpoint: 'https://api.sambanova.ai/v1/chat/completions',
            apiKey: sambanovaKey,
            models: ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-V3.2']
        });
    }

    // OpenRouter Free Tier
    const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (openrouterKey) {
        providers.push({
            name: 'OpenRouter (Free)',
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: openrouterKey,
            models: ['openrouter/free', 'google/gemma-4-31b-it:free'],
            extraHeaders: {
                'HTTP-Referer': 'https://ifilmdirectory.com',
                'X-Title': 'iFilmDirectory'
            }
        });
    }

    if (providers.length === 0) {
        return {
            text: `[AI Generated Draft for ${context}]\n\nHere is a professional draft based on: "${prompt}".\n\n(To enable live generation, add your free VITE_GROQ_API_KEY to your environment settings).`
        };
    }

    const systemPrompt = `You are a professional writing assistant for the film industry. Help the user write a ${context}.

IMPORTANT RULES:
1. Keep it professional, engaging, and detailed.
2. DO NOT use any markdown formatting like ** for bold, # for headings, or bullet points.
3. Write in plain text only - no special formatting characters.
4. Output ONLY the content, no introductory phrases like "Here is..." or "Here's a..."
5. Write in ${language} language.
6. For blog posts, write comprehensive, in-depth content (800-1200 words).
7. For other content, provide detailed and professional text (200-400 words).`;

    let lastErrorMessage = '';

    // 2. Iterate through providers; if one hits rate limits (429) or fails, seamlessly failover
    for (const provider of providers) {
        for (const model of provider.models) {
            try {
                const response = await fetch(provider.endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${provider.apiKey}`,
                        'Content-Type': 'application/json',
                        ...(provider.extraHeaders || {})
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        model: model,
                        temperature: 0.7,
                        max_tokens: 2048
                    })
                });

                if (response.status === 429) {
                    console.warn(`[AI Engine] Provider ${provider.name} model ${model} reached rate limit (429). Switching to next provider...`);
                    lastErrorMessage = `${provider.name} rate limit reached`;
                    break; // Move to next provider
                }

                const data = await response.json();

                if (response.ok && data.choices && data.choices[0]?.message?.content) {
                    const generatedText = data.choices[0].message.content.trim();
                    // Cache the successful response
                    responseCache.set(cacheKey, { text: generatedText, timestamp: Date.now() });
                    return {
                        text: generatedText,
                        provider: provider.name
                    };
                } else {
                    const errMsg = data.error?.message || 'Unknown response';
                    console.warn(`[AI Engine] ${provider.name} (${model}) failed: ${errMsg}`);
                    lastErrorMessage = errMsg;
                }
            } catch (networkErr: any) {
                console.warn(`[AI Engine] Network issue with ${provider.name}: ${networkErr?.message || networkErr}`);
                lastErrorMessage = networkErr?.message || 'Network error';
            }
        }
    }

    return {
        text: '',
        error: `All AI providers were busy or unavailable: ${lastErrorMessage}`
    };
};
