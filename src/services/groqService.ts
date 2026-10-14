export interface AIResponse {
    text: string;
    error?: string;
}

export const generateText = async (prompt: string, context: string = '', language: string = 'English'): Promise<AIResponse> => {
    // In a real implementation, this would call the Groq API
    // Since we don't have the API key yet, we'll simulate a response
    // or use a placeholder if the user provides a key later.

    // Check for API key in environment variables (Vite uses import.meta.env)
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        // Mock response for demo purposes
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    text: `[AI Generated Content based on: "${prompt}"]\n\nHere is a professionally written draft for your ${context}. \n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. \n\n(Note: To get real AI generation, please add your VITE_GROQ_API_KEY to the .env file)`
                });
            }, 1500);
        });
    }

    try {
        // Try current Groq models in order of preference
        const models = [
            'llama-3.3-70b-versatile',  // Latest, most capable
            'llama-3.1-70b-versatile',  // Fast and capable
            'llama-3.1-8b-instant',     // Fastest
            'mixtral-8x7b-32768'        // Old model (will fail, but keep as fallback)
        ];

        let lastError: any = null;

        for (const model of models) {
            try {
                console.log(`[Groq] Trying model: ${model}`);

                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: 'system',
                                content: `You are a professional writing assistant for the film industry. Help the user write a ${context}. 

IMPORTANT RULES:
1. Keep it professional, engaging, and detailed.
2. DO NOT use any markdown formatting like ** for bold, # for headings, or bullet points.
3. Write in plain text only - no special formatting characters.
4. Output ONLY the content, no introductory phrases like "Here is..." or "Here's a..."
5. Write in ${language} language.
6. For blog posts, write comprehensive, in-depth content (1000-1500 words).
7. For other content, provide detailed and professional text (300-500 words).`
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        model: model,
                        temperature: 0.7,
                        max_tokens: 2048,
                    })
                });

                const data = await response.json();

                if (response.ok && data.choices && data.choices[0]) {
                    console.log(`[Groq] ✅ Success with model: ${model}`);
                    return {
                        text: data.choices[0].message.content
                    };
                } else {
                    console.warn(`[Groq] ❌ Failed with ${model}:`, data.error?.message || 'Unknown error');
                    lastError = data.error;
                    continue;
                }
            } catch (error: any) {
                console.warn(`[Groq] ❌ Network error with ${model}:`, error.message);
                lastError = error;
                continue;
            }
        }

        // All models failed
        return {
            text: '',
            error: `Groq API error: ${lastError?.message || 'All models failed'}`
        };
    } catch (error) {
        console.error('Groq API Error:', error);
        return {
            text: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
