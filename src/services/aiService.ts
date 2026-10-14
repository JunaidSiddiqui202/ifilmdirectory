import { generateWithGemini } from './geminiService';
import { generateText } from './groqService';

// Types for AI responses
export interface AIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface EnhancedProfile {
    headline: string;
    bio: {
        short: string;
        standard: string;
        creative: string;
    };
    skills: string[];
    experience: {
        title: string;
        role: string;
        description: string;
    }[];
    keywords: string[];
}

export interface ExtractedProfileData {
    displayName?: string;
    role?: string;
    bio?: string;
    location?: string;
    experience?: {
        title: string;
        role: string;
        year: string;
        type: 'movie' | 'tv' | 'theater';
    }[];
    skills?: string[];
    pastProjects?: {
        title: string;
        role: string;
        year: string;
        description?: string;
    }[];
    underProductionProjects?: {
        title: string;
        role: string;
        status: string;
        description?: string;
    }[];
}

export interface ScriptBreakdown {
    scenes: SceneBreakdown[];
    characters: CharacterInfo[];
    locations: LocationInfo[];
    shotList: Shot[];
    estimatedBudget?: BudgetEstimate;
    crewRequirements?: CrewRequirement[];
}

export interface SceneBreakdown {
    sceneNumber: number;
    heading: string;
    location: string;
    timeOfDay: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
    description: string;
    characters: string[];
    props: string[];
    estimatedDuration: string;
    complexity: 'Simple' | 'Medium' | 'Complex';
}

export interface CharacterInfo {
    name: string;
    age?: string;
    gender?: string;
    description: string;
    role: 'Lead' | 'Supporting' | 'Cameo';
    sceneCount: number;
}

export interface LocationInfo {
    name: string;
    type: 'Interior' | 'Exterior';
    sceneCount: number;
    requirements: string[];
}

export interface Shot {
    sceneNumber: number;
    shotNumber: string;
    shotType: string;
    description: string;
    equipment: string[];
    estimatedTime: string;
}

export interface BudgetEstimate {
    total: string;
    breakdown: {
        category: string;
        amount: string;
        notes: string;
    }[];
}

export interface CrewRequirement {
    role: string;
    count: number;
    skills: string[];
    priority: 'Essential' | 'Important' | 'Optional';
}

export interface CastingMatch {
    userId: string;
    userName: string;
    userPhoto?: string;
    matchScore: number;
    reasons: string[];
    portfolio: {
        showreelUrl?: string;
        previousRoles: string[];
        physicalAttributes?: PhysicalProfile;
    };
}

export interface PhysicalProfile {
    age?: string;
    gender?: string;
    height?: string;
    build?: string;
    ethnicity?: string;
}

export interface CharacterDescription {
    name: string;
    age: string;
    gender: string;
    physicalDescription: string;
    personality: string;
    role: 'Lead' | 'Supporting' | 'Cameo';
}

export interface PortfolioAnalysis {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    technicalQuality: {
        videoQuality: number;
        audioQuality: number;
        editing: number;
        cinematography: number;
    };
    contentAnalysis: {
        variety: number;
        professionalism: number;
        storytelling: number;
    };
    recommendations: Recommendation[];
    comparisons: {
        industryAverage: number;
        topPerformers: number;
    };
}

export interface Recommendation {
    type: 'improvement' | 'strength' | 'suggestion';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface JobMatch {
    jobId: string;
    matchScore: number;
    reasons: string[];
    missingSkills?: string[];
    applicationTips: string[];
}

export interface ProfileOptimization {
    completeness: number;
    visibility: number;
    suggestions: ProfileSuggestion[];
    missingFields: string[];
    competitorComparison: {
        averageCompleteness: number;
        topProfiles: number;
    };
}

export interface ProfileSuggestion {
    field: string;
    current: string;
    suggested: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
}

export interface EnhancementOptions {
    tone: 'professional' | 'creative' | 'technical' | 'street' | 'guild';
    languageMix?: string; // Supports: english, hi, te, ta, kn, ml, ur, hinglish, tinglish, tanglish, kanglish, manglish
    purpose: 'post' | 'comment' | 'guideline' | 'pitch';
}

export interface TranslationResult {
    translatedText: string;
    detectedLanguage: string;
    explanation?: string; // For cultural context if Hinglish/etc
}

export interface ImagePrompt {
    query: string;
    keywords: string[];
    description: string;
}

/**
 * Unified AI Service
 * Handles all AI operations with caching and fallback
 */
class AIService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

    /**
     * Get cached result if available and not expired
     */
    private getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data as T;
        }
        return null;
    }

    /**
     * Set cache
     */
    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Core AI call with Groq (primary) and Gemini (fallback)
     */
    private async callAI(prompt: string, context: string, jsonMode: boolean = false): Promise<string> {
        try {
            // Try Groq first (primary)
            console.log(`[AI Service] Calling Groq for: ${context}`);
            const response = await generateText(prompt, context);
            if (response.error) {
                throw new Error(response.error);
            }
            return response.text;
        } catch (groqError) {
            console.warn(`[AI Service] Groq failed for ${context}, trying Gemini fallback:`, groqError);

            // Fallback to Gemini
            try {
                const response = await generateWithGemini({
                    prompt,
                    temperature: 0.7,
                    maxTokens: 2048,
                    jsonMode
                });
                return response;
            } catch (geminiError) {
                console.error('[AI Service] Both Groq and Gemini failed:', { groqError, geminiError });
                throw new Error(`AI service unavailable: ${groqError instanceof Error ? groqError.message : 'Unknown error'}`);
            }
        }
    }

    /**
     * Parse JSON response from AI
     */
    private parseAIResponse<T>(text: string): T {
        try {
            let jsonText = text;

            // Try to find the JSON object by looking for the outermost braces
            const firstOpen = text.indexOf('{');
            const lastClose = text.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                jsonText = text.substring(firstOpen, lastClose + 1);
            }

            // Cleanup potential JSON issues: remove markdown code blocks, control characters, and trailing commas
            jsonText = jsonText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim()
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
                .replace(/,\s*([}\]])/g, "$1"); // Remove trailing commas

            console.log('[AI Service] Attempting to parse JSON:', jsonText.substring(0, 100) + '...');
            return JSON.parse(jsonText);
        } catch (error) {
            console.error('[AI Service] Failed to parse AI response. Raw text:', text);
            console.error('[AI Service] Parse error details:', error);
            throw new Error('Failed to parse AI response');
        }
    }

    /**
     * Analyze script and generate breakdown
     */
    async analyzeScript(scriptText: string): Promise<AIResponse<ScriptBreakdown>> {
        const cacheKey = `script_${scriptText.substring(0, 100)}`;
        const cached = this.getCached<ScriptBreakdown>(cacheKey);
        if (cached) {
            return { success: true, data: cached };
        }

        try {
            const prompt = `Analyze this screenplay and provide a detailed breakdown in JSON format.

Script:
${scriptText}

Provide the following in valid JSON format:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "heading": "INT. COFFEE SHOP - DAY",
      "location": "Coffee Shop",
      "timeOfDay": "DAY",
      "description": "Brief scene description",
      "characters": ["Character names"],
      "props": ["Required props"],
      "estimatedDuration": "2-3 minutes",
      "complexity": "Simple|Medium|Complex"
    }
  ],
  "characters": [
    {
      "name": "Character Name",
      "age": "25-30",
      "gender": "Male/Female/Other",
      "description": "Character description",
      "role": "Lead|Supporting|Cameo",
      "sceneCount": 5
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "type": "Interior|Exterior",
      "sceneCount": 3,
      "requirements": ["Specific needs"]
    }
  ],
  "shotList": [
    {
      "sceneNumber": 1,
      "shotNumber": "1A",
      "shotType": "Wide/Medium/Close-up",
      "description": "Shot description",
      "equipment": ["Camera", "Lights"],
      "estimatedTime": "30 minutes"
    }
  ],
  "crewRequirements": [
    {
      "role": "Cinematographer",
      "count": 1,
      "skills": ["Required skills"],
      "priority": "Essential|Important|Optional"
    }
  ]
}

IMPORTANT: Output ONLY valid JSON. It must start with { and end with }. Do not include any conversational text like "Unfortunately" or "Here is the JSON".`;

            const response = await this.callAI(prompt, 'Script Analysis', true);
            const breakdown = this.parseAIResponse<ScriptBreakdown>(response);

            this.setCache(cacheKey, breakdown);
            return { success: true, data: breakdown };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze script'
            };
        }
    }

    /**
     * Match actors to character description
     */
    async matchCasting(
        character: CharacterDescription,
        actors: any[]
    ): Promise<AIResponse<CastingMatch[]>> {
        try {
            const actorsData = actors.map(actor => ({
                userId: actor.uid,
                userName: actor.displayName || 'Unknown',
                userPhoto: actor.photoURL,
                age: actor.age,
                gender: actor.gender,
                bio: actor.bio,
                role: actor.role,
                skills: actor.skills || [],
                previousWork: actor.previousWork || []
            }));

            const prompt = `Match actors to this character description and return matches in JSON format.

Character:
Name: ${character.name}
Age: ${character.age}
Gender: ${character.gender}
Physical: ${character.physicalDescription}
Personality: ${character.personality}
Role: ${character.role}

Available Actors:
${JSON.stringify(actorsData, null, 2)}

Return top 10 matches in this JSON format:
{
  "matches": [
    {
      "userId": "actor_id",
      "userName": "Actor Name",
      "userPhoto": "photo_url",
      "matchScore": 85,
      "reasons": ["Reason 1", "Reason 2"],
      "portfolio": {
        "previousRoles": ["Role 1", "Role 2"],
        "physicalAttributes": {
          "age": "25-30",
          "gender": "Male",
          "build": "Athletic"
        }
      }
    }
  ]
}

Sort by matchScore descending. Only include actors with score > 50.
IMPORTANT: Output ONLY valid JSON. It must start with { and end with }. Do not include any conversational text.`;

            const response = await this.callAI(prompt, 'Casting Match', true);
            const result = this.parseAIResponse<{ matches: CastingMatch[] }>(response);

            return { success: true, data: result.matches };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to match casting'
            };
        }
    }

    /**
     * Analyze portfolio/showreel
     */
    async analyzePortfolio(
        showreelData: {
            title: string;
            description: string;
            duration?: string;
            category?: string;
            userRole?: string;
        }
    ): Promise<AIResponse<PortfolioAnalysis>> {
        const cacheKey = `portfolio_${showreelData.title}_${showreelData.description}`;
        const cached = this.getCached<PortfolioAnalysis>(cacheKey);
        if (cached) {
            return { success: true, data: cached };
        }

        try {
            const prompt = `Analyze this portfolio/showreel and provide detailed feedback in JSON format.

Portfolio Details:
Title: ${showreelData.title}
Description: ${showreelData.description}
Duration: ${showreelData.duration || 'Unknown'}
Category: ${showreelData.category || 'General'}
User Role: ${showreelData.userRole || 'Unknown'}

Provide analysis in this JSON format:
{
  "overallScore": 75,
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "technicalQuality": {
    "videoQuality": 80,
    "audioQuality": 70,
    "editing": 85,
    "cinematography": 75
  },
  "contentAnalysis": {
    "variety": 70,
    "professionalism": 85,
    "storytelling": 75
  },
  "recommendations": [
    {
      "type": "improvement",
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "high|medium|low"
    }
  ],
  "comparisons": {
    "industryAverage": 65,
    "topPerformers": 90
  }
}

Be constructive and specific. Scores are 0-100.`;

            const response = await this.callAI(prompt, 'Portfolio Analysis', true);
            const analysis = this.parseAIResponse<PortfolioAnalysis>(response);

            this.setCache(cacheKey, analysis);
            return { success: true, data: analysis };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze portfolio'
            };
        }
    }

    /**
     * Match jobs to user profile
     */
    async matchJobs(
        userProfile: any,
        jobs: any[]
    ): Promise<AIResponse<JobMatch[]>> {
        try {
            const prompt = `Match these jobs to the user's profile and return matches in JSON format.

User Profile:
Role: ${userProfile.role}
Skills: ${userProfile.skills?.join(', ') || 'None listed'}
Experience: ${userProfile.experience || 'Not specified'}
Location: ${userProfile.location || 'Not specified'}
Bio: ${userProfile.bio || 'No bio'}

Available Jobs:
${JSON.stringify(jobs.map(job => ({
                jobId: job.id,
                title: job.title,
                description: job.description,
                requirements: job.requirements,
                location: job.location
            })), null, 2)}

Return matches in this JSON format:
{
  "matches": [
    {
      "jobId": "job_id",
      "matchScore": 85,
      "reasons": ["Reason 1", "Reason 2"],
      "missingSkills": ["Skill 1"],
      "applicationTips": ["Tip 1", "Tip 2"]
    }
  ]
}

Sort by matchScore descending. Only include jobs with score > 60.`;

            const response = await this.callAI(prompt, 'Job Matching', true);
            const result = this.parseAIResponse<{ matches: JobMatch[] }>(response);

            return { success: true, data: result.matches };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to match jobs'
            };
        }
    }

    /**
     * Optimize user profile
     */
    async optimizeProfile(userProfile: any): Promise<AIResponse<ProfileOptimization>> {
        try {
            const prompt = `Analyze this user profile and suggest optimizations in JSON format.

Current Profile:
${JSON.stringify(userProfile, null, 2)}

Provide optimization suggestions in this JSON format:
{
  "completeness": 65,
  "visibility": 70,
  "suggestions": [
    {
      "field": "bio",
      "current": "Current value",
      "suggested": "Improved value",
      "reason": "Why this is better",
      "impact": "high|medium|low"
    }
  ],
  "missingFields": ["Field 1", "Field 2"],
  "competitorComparison": {
    "averageCompleteness": 75,
    "topProfiles": 95
  }
}

Focus on: bio, skills, experience, portfolio quality. Scores are 0-100.`;

            const response = await this.callAI(prompt, 'Profile Optimization', true);
            const optimization = this.parseAIResponse<ProfileOptimization>(response);

            return { success: true, data: optimization };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to optimize profile'
            };
        }
    }

    /**
     * Generate cover letter for job application
     */
    async generateCoverLetter(
        userProfile: any,
        jobDetails: any
    ): Promise<AIResponse<string>> {
        try {
            const prompt = `Generate a professional cover letter for this job application.

User Profile:
Name: ${userProfile.displayName}
Role: ${userProfile.role}
Skills: ${userProfile.skills?.join(', ') || 'Various'}
Experience: ${userProfile.experience || 'Experienced professional'}
Bio: ${userProfile.bio || ''}

Job Details:
Title: ${jobDetails.title}
Company: ${jobDetails.company}
Description: ${jobDetails.description}
Requirements: ${jobDetails.requirements}

Write a compelling, professional cover letter (200-300 words) that:
1. Shows enthusiasm for the role
2. Highlights relevant experience
3. Addresses key requirements
4. Maintains professional tone
5. Includes a strong closing

Return just the cover letter text, no JSON.`;

            const coverLetter = await this.callAI(prompt, 'Cover Letter Generation');
            return { success: true, data: coverLetter };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate cover letter'
            };
        }
    }

    async enhanceProfile(currentProfile: any): Promise<AIResponse<EnhancedProfile>> {
        const cacheKey = `profile_enhance_${JSON.stringify(currentProfile)}`;
        const cached = this.getCached<EnhancedProfile>(cacheKey);
        if (cached) return { success: true, data: cached };

        const prompt = `
        Act as a Hollywood Talent Agent and Professional Resume Writer.
        Enhance this user profile to meet industry standards (IMDbPro, Spotlight).

        Current Profile:
        ${JSON.stringify(currentProfile, null, 2)}

        Tasks:
        1. Create a catchy, professional Headline (Tagline).
        2. Write 3 versions of the Bio:
           - Short (Twitter/Instagram style, < 160 chars)
           - Standard (Professional, 1-2 paragraphs)
           - Creative (Engaging, storytelling style)
        3. Extract and refine Skills (add missing relevant industry skills).
        4. Polish Experience descriptions (make them sound prestigious).
        5. Generate SEO Keywords for casting searches.

        Output JSON format:
        {
            "headline": "...",
            "bio": { "short": "...", "standard": "...", "creative": "..." },
            "skills": ["..."],
            "experience": [{ "title": "...", "role": "...", "description": "..." }],
            "keywords": ["..."]
        }
        `;

        try {
            const response = await this.callAI(prompt, 'Profile Enhancement', true);
            const enhanced = this.parseAIResponse<EnhancedProfile>(response);
            this.setCache(cacheKey, enhanced);
            return { success: true, data: enhanced };
        } catch (error) {
            console.error('Profile enhancement failed:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Failed to enhance profile' };
        }
    }

    /**
     * AI Glitter: Enhance text for posts/comments
     * Supports multi-language mixes (Hinglish, Tinglish, etc)
     */
    async enhanceText(text: string, options: EnhancementOptions): Promise<AIResponse<string>> {
        // Language mapping for better AI understanding
        const languageInstructions: Record<string, string> = {
            'hi': 'Generate the enhanced text ENTIRELY in Hindi (Devanagari script: हिंदी). Use professional Hindi terminology.',
            'te': 'Generate the enhanced text ENTIRELY in Telugu (Telugu script: తెలుగు). Use professional Telugu terminology.',
            'ta': 'Generate the enhanced text ENTIRELY in Tamil (Tamil script: தமிழ்). Use professional Tamil terminology.',
            'kn': 'Generate the enhanced text ENTIRELY in Kannada (Kannada script: ಕನ್ನಡ). Use professional Kannada terminology.',
            'ml': 'Generate the enhanced text ENTIRELY in Malayalam (Malayalam script: മലയാളം). Use professional Malayalam terminology.',
            'ur': 'Generate the enhanced text ENTIRELY in Urdu (Urdu script: اردو). Use professional Urdu terminology.',
            'hinglish': 'Generate the enhanced text in Hinglish (Hindi-English mix). Example: "Yeh shot bahut accha hai, lighting perfect hai!"',
            'tinglish': 'Generate the enhanced text in Tinglish (Telugu-English mix). Example: "Ee scene chala bagundi, camera angles perfect!"',
            'tanglish': 'Generate the enhanced text in Tanglish (Tamil-English mix). Example: "Idhu romba nalla scene, lighting perfect-a irukku!"',
            'kanglish': 'Generate the enhanced text in Kanglish (Kannada-English mix). Example: "Ee shot thumba chennagide, lighting perfect aagide!"',
            'manglish': 'Generate the enhanced text in Manglish (Malayalam-English mix). Example: "Ee scene valare nannayittund, lighting perfect aanu!"',
            'english': 'Generate the enhanced text in professional English.'
        };

        const langInstruction = languageInstructions[options.languageMix || 'english'] || languageInstructions['english'];

        const prompt = `Act as a Veteran Film Industry Professional with 20+ years of experience.
Enhance the following text into a well-structured, professional post.

Original Text: "${text}"
Tone: ${options.tone}
Purpose: ${options.purpose}

CRITICAL LANGUAGE INSTRUCTION:
${langInstruction}

STRUCTURE REQUIREMENTS (MANDATORY):
You MUST write EXACTLY 4 paragraphs with the following structure:

Paragraph 1: Introduction
- Start with a compelling hook or statement
- Introduce the main topic
- Set the context for the discussion

Paragraph 2: Technical Details & Industry Standards
- Explain the technical aspects
- Reference specific equipment, techniques, or workflows
- Use industry-standard terminology

Paragraph 3: Film References & Real-World Examples
- Cite specific films (Indian or Hollywood)
- Mention cinematographers, directors, or other professionals
- Examples: "Like Roger Deakins' work in Blade Runner 2049" or "Similar to Santosh Sivan's cinematography in Dil Se"
- Explain how these examples relate to the topic

Paragraph 4: Conclusion & Call to Action
- Summarize the key takeaway
- Encourage discussion or sharing experiences
- End with a professional sign-off

FORMATTING:
- Separate each paragraph with a blank line (\n\n)
- Each paragraph should be 3-5 sentences
- Total length: 250-400 words
- IMPORTANT: The output MUST be in the specified language/style above

Return ONLY the 4-paragraph enhanced text in the specified language. No conversational text, no explanations, no English translation.`;

        try {
            const response = await this.callAI(prompt, 'Text Enhancement');
            return { success: true, data: response.trim() };
        } catch (error) {
            return { success: false, error: 'Glitter failed to apply' };
        }
    }

    /**
     * Translate community content
     * Similar to YouTube/Reddit translation
     */
    async translateContent(text: string, targetLanguage: string = 'English'): Promise<AIResponse<TranslationResult>> {
        const prompt = `
        Translate the following film industry community content to ${targetLanguage}.
        Content: "${text}"

        Guidelines:
        1. Context matters: If they use industry slang, translate it to the equivalent slang in ${targetLanguage}.
        2. Format: Return a JSON with the keys "translatedText", "detectedLanguage", and "explanation" (only if it's a very specific cultural/local slang).

        Example Output:
        {
            "translatedText": "The shoot was delayed due to rain",
            "detectedLanguage": "Hinglish",
            "explanation": "Used local slang for heavy monsoon"
        }
        `;

        try {
            const response = await this.callAI(prompt, 'Translation', true);
            const result = this.parseAIResponse<TranslationResult>(response);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: 'Translation failed' };
        }
    }

    /**
     * Generate a context-aware visual query
     */
    async generateVisual(title: string, content: string): Promise<AIResponse<string>> {
        const prompt = `Analyze this film industry post and generate a SINGLE, SPECIFIC search term for finding a relevant professional image.

Title: "${title}"
Content: "${content}"

Task:
1. Identify the core topic (e.g., color grading, cinematography, lighting, editing, directing, etc.)
2. Return ONLY ONE specific search term (2-3 words max)
3. Make it visual and concrete (e.g., "color grading" not just "grading")

Examples:
- For color grading post → "color grading"
- For lighting post → "film lighting"
- For camera post → "cinema camera"
- For editing post → "video editing"
- For directing post → "film director"

Return ONLY the search term, nothing else.`;

        try {
            const searchTerm = await this.callAI(prompt, 'Visual Generation');
            const cleanTerm = searchTerm.replace(/[^a-zA-Z ]/g, '').trim().toLowerCase();

            // Use multiple free image sources with random selection
            const randomSource = Math.random();

            if (randomSource < 0.5) {
                // Pexels - Free, high-quality stock photos
                const randomPage = Math.floor(Math.random() * 20) + 1;
                const randomPhoto = Math.floor(Math.random() * 15) + 1;
                const pexelsQuery = encodeURIComponent(`${cleanTerm} cinema film`);
                return {
                    success: true,
                    data: `https://images.pexels.com/photos/${7991579 + randomPhoto}/pexels-photo-${7991579 + randomPhoto}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop&q=${pexelsQuery}&page=${randomPage}`
                };
            } else {
                // Picsum with specific categories - Random photos
                return {
                    success: true,
                    data: `https://picsum.photos/seed/${cleanTerm}-${Date.now()}/800/600`
                };
            }
        } catch (error) {
            // Fallback to random cinema image
            const randomId = Math.floor(Math.random() * 1000);
            return {
                success: true,
                data: `https://picsum.photos/seed/cinema-${randomId}/800/600`
            };
        }
    }
    /**
     * Extract structured profile data from a URL (IMDb/Wikipedia)
     */
    async extractFromLink(url: string, pageContent: string): Promise<AIResponse<ExtractedProfileData>> {
        // Pre-process content: Strip HTML tags to maximize useful text for AI
        const cleanContent = pageContent
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")   // Remove styles
            .replace(/<[^>]+>/g, " ")                             // Remove all tags
            .replace(/\s+/g, " ")                                  // Collapse whitespace
            .trim();

        const prompt = `
        You are a precision data extraction specialist for the film industry. 
        Extract professional profile data from the following text (scraped from ${url}).

        Text:
        ${cleanContent.substring(0, 15000)}

        STRICT INSTRUCTIONS:
        1. If you cannot find a clear full name, do NOT guess. Use the URL part to help but prioritize the text.
        2. If there is no biography in the text, leave the "bio" field empty or use a very brief summary of their top 3 credits. DO NOT make up a life story.
        3. Match the role to one of these: actor, director, crew, writer, service, studio.
        4. Experience items MUST have a title, role, and year. If the year is missing, use "N/A".
        5. If the scrape content looks like a "Access Denied" or "Redirect" page (e.g. contains "enable javascript", "403 forbidden", "just a moment"), return an empty JSON object.

        Output EXCLUSIVELY in valid JSON format:
        {
            "displayName": "Full Name",
            "role": "professional role",
            "bio": "Extracted bio or short credit summary",
            "location": "City, Country",
            "skills": ["skill1", "skill2"],
            "experience": [
                { "title": "Film Name", "role": "Their Position", "year": "2023", "type": "movie" }
            ],
            "pastProjects": [
                { "title": "Past Film", "role": "Director", "year": "2020", "description": "Short description", "link": "IMDb URL" }
            ],
            "underProductionProjects": [
                { "title": "Future Film", "role": "Actor", "status": "In Development", "description": "Future project", "expectedRelease": "Late 2025" }
            ]
        }
        `;

        try {
            const response = await this.callAI(prompt, 'Link Data Extraction', true);
            const data = this.parseAIResponse<ExtractedProfileData>(response);
            return { success: true, data };
        } catch (error) {
            console.error('Extraction failed:', error);
            return { success: false, error: 'Failed to extract data from link' };
        }
    }


    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

export const aiService = new AIService();
