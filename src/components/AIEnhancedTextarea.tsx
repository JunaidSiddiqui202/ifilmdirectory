import { useState } from 'react';
import { generateText } from '../services/groqService';

interface AIEnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    context: string; // e.g., "Job Description", "Bio", "Blog Post"
    onValueChange: (value: string) => void;
}

export default function AIEnhancedTextarea({ label, context, onValueChange, className, value, ...props }: AIEnhancedTextareaProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const languages = [
        'English',
        'Hindi',
        'Telugu',
        'Tamil',
        'Kannada',
        'Malayalam',
        'Urdu',
        'Hinglish (Hindi-English)',
        'Tinglish (Telugu-English)',
        'Tanglish (Tamil-English)',
        'Kanglish (Kannada-English)',
        'Manglish (Malayalam-English)'
    ];

    const handleGenerate = async () => {
        setIsGenerating(true);

        // Create a smart prompt based on context and existing content
        const existingText = String(value || '').trim();
        let prompt = '';

        if (context.toLowerCase().includes('blog')) {
            // Special handling for blog posts - generate comprehensive content
            if (existingText) {
                prompt = `You are a veteran film industry professional and expert writer with 20+ years of experience.

Expand and enhance this blog post topic: "${existingText}"

Requirements:
1. Write EXACTLY 6 well-structured paragraphs
2. Each paragraph should be 9-10 sentences long
3. Total length: 1000-1200 words

Paragraph Structure:
- Paragraph 1: Compelling introduction that hooks the reader
- Paragraph 2: Historical context and evolution of the topic
- Paragraph 3: Technical details and industry standards
- Paragraph 4: Reference specific films (both classic and recent) with examples
- Paragraph 5: Current trends and modern applications
- Paragraph 6: Conclusion with actionable insights and future outlook

Film References to Consider:
- Classic Films: The Godfather, Citizen Kane, Lawrence of Arabia, 2001: A Space Odyssey
- Modern Films: Dune, Everything Everywhere All at Once, The Batman, Top Gun: Maverick
- Indian Cinema: RRR, KGF, Baahubali, 3 Idiots, Dangal
- Bollywood: Pathaan, Jawan, Rocky Aur Rani

IMPORTANT FORMATTING RULES:
- DO NOT include paragraph headings (e.g., "Introduction:", "Paragraph 1:", "Technical Details:").
- Just write the raw paragraph content directly.
- Separate paragraphs with double line breaks (\\n\\n).

Return ONLY the blog content, no conversational text.`;
            } else {
                prompt = `You are a veteran film industry professional and expert writer with 20+ years of experience.

Write a comprehensive blog post about an interesting topic in filmmaking.

Requirements:
1. Write EXACTLY 6 well-structured paragraphs
2. Each paragraph should be 9-10 sentences long
3. Total length: 1000-1200 words
4. Include specific film references (both classic and recent cinema)
5. Mention directors, cinematographers, or other professionals
6. Use professional film industry terminology

Paragraph Structure:
- Paragraph 1: Compelling introduction
- Paragraph 2: Historical context
- Paragraph 3: Technical details
- Paragraph 4: Film examples and references
- Paragraph 5: Current trends
- Paragraph 6: Conclusion with insights

IMPORTANT FORMATTING RULES:
- DO NOT include paragraph headings (e.g., "Introduction:", "Paragraph 1:", "Technical Details:").
- Just write the raw paragraph content directly.
- Separate paragraphs with double line breaks (\\n\\n).

Return ONLY the blog content, no conversational text.`;
            }
        } else if (existingText) {
            // If there's existing text, enhance it
            prompt = `Enhance and improve this ${context}: "${existingText}". Make it more professional and detailed.`;
        } else {
            // If empty, generate from scratch
            prompt = `Write a professional ${context} for a film industry job posting. Include key responsibilities and expectations.`;
        }

        const response = await generateText(prompt, context, selectedLanguage);
        setIsGenerating(false);

        if (response.error) {
            alert('Error generating text: ' + response.error);
        } else if (response.text) {
            // Clean any remaining markdown formatting from the response
            let cleanText = response.text
                .replace(/\*\*/g, '')  // Remove **
                .replace(/\*/g, '')    // Remove *
                .replace(/^#+\s*/gm, '') // Remove # headings
                .replace(/^[-•]\s*/gm, '') // Remove bullet points
                .trim();
            onValueChange(cleanText);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Label and Language Selector Row */}
            <div className="flex items-center justify-between gap-4">
                <p className="text-black dark:text-white text-base font-medium leading-normal">
                    {label}
                </p>

                {/* Language Selector */}
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400 text-sm">language</span>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                        {languages.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Textarea with AI Button Inside */}
            <div className="relative">
                <textarea
                    {...props}
                    value={value}
                    className={`form-input flex w-full min-w-0 flex-1 resize-y overflow-y-auto rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary min-h-36 max-h-64 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] pb-12 text-base font-normal leading-normal ${className}`}
                    onChange={(e) => onValueChange(e.target.value)}
                />

                {/* AI Glitter Button - Inside Textarea */}
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`absolute bottom-3 right-3 group flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${isGenerating
                        ? 'bg-primary text-white shadow-lg animate-pulse'
                        : 'bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary border border-primary/20 hover:border-primary/40'
                        }`}
                    title={value ? "Enhance with AI" : "Generate with AI"}
                >
                    <span className={`material-symbols-outlined text-lg ${isGenerating ? 'animate-spin' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isGenerating ? 'sync' : 'auto_awesome'}
                    </span>
                    <span className="text-xs font-semibold">{isGenerating ? '...' : 'AI'}</span>
                </button>

                {/* Generating Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                        <div className="flex flex-col items-center gap-2 bg-gradient-to-r from-primary to-purple-500 text-white p-4 rounded-xl shadow-xl">
                            <span className="material-symbols-outlined animate-spin text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            <span className="text-sm font-bold">Writing with AI...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
