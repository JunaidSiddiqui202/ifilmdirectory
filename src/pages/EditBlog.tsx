import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateText } from '../services/groqService';
import { uploadFile } from '../services/storageService';
import { blogService, type ContentBlock } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';
import FilmPhotoSearchModal from '../components/FilmPhotoSearchModal';
import { detectFilmsInText, type FilmImageResult } from '../services/filmImageService';
import DOMPurify from 'dompurify';

interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
    { code: 'hinglish', name: 'Hinglish (Hindi-English)', nativeName: 'Hinglish', flag: '🔀' },
    { code: 'tinglish', name: 'Tinglish (Telugu-English)', nativeName: 'Tinglish', flag: '🔀' },
    { code: 'tanglish', name: 'Tanglish (Tamil-English)', nativeName: 'Tanglish', flag: '🔀' },
    { code: 'kanglish', name: 'Kanglish (Kannada-English)', nativeName: 'Kanglish', flag: '🔀' },
    { code: 'manglish', name: 'Manglish (Malayalam-English)', nativeName: 'Manglish', flag: '🔀' },
];

const CATEGORIES = [
    'Behind the Scenes',
    'Film Reviews',
    'Industry News',
    'Direction & Script',
    'Cinematography & Gear',
    'Career & Auditions',
    'Interviews',
    'Tutorials & Tech',
];

const AI_CINEMA_PRESETS = [
    {
        icon: 'movie',
        label: 'Film Review & Analysis',
        topic: 'A deep-dive critical analysis of storytelling, pacing, and visual grammar in contemporary Indian cinema',
    },
    {
        icon: 'video_camera_back',
        label: 'Behind the Scenes Diary',
        topic: 'Inside the production chaos: 5 real-world lessons from a 20-day indie feature film shoot',
    },
    {
        icon: 'edit_note',
        label: 'Screenwriting Blueprint',
        topic: 'Crafting non-linear screenplays: How to write character arcs that hook directors and producers',
    },
    {
        icon: 'camera',
        label: 'Cinematography Masterclass',
        topic: 'Mastering natural lighting and lens choices on a constrained indie film budget',
    },
    {
        icon: 'theater_comedy',
        label: 'Actor Audition Strategy',
        topic: 'What top casting directors actually look for in self-tape auditions: 7 actionable rules',
    },
    {
        icon: 'trending_up',
        label: 'Industry Box Office & OTT',
        topic: 'How Pan-India theatrical releases and OTT acquisition deals are reshaping Indian entertainment',
    },
];

const AI_IMAGE_PRESETS = [
    { label: '🎬 Film Set & Arri Alexa', prompt: 'Cinematic wide angle film set with professional crew, Arri Alexa camera, boom microphone, film lights and director chair' },
    { label: '🎞️ 35mm Vintage Movie', prompt: 'Moody 35mm film still with warm vintage film grain, high dynamic range, cinematic anamorphic bokeh' },
    { label: '🌟 Red Carpet Premiere', prompt: 'Glamorous movie premiere red carpet at night with flash photography, cinema velvet rope, spotlights' },
    { label: '🎥 Golden Hour Drone Shot', prompt: 'Spectacular aerial golden hour cinema drone shot over rugged terrain with dramatic light and shadow' },
    { label: '💡 Dramatic Film Noir', prompt: 'Dramatic noir studio lighting with deep shadows, smoke haze, silhouette of a filmmaker and camera rig' },
    { label: '🎙️ Soundstage & Foley', prompt: 'Modern sound recording studio with acoustic treatment, professional microphones and film audio workstation' },
];

export default function EditBlog() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const toast = useToast();
    const isCreateMode = location.pathname === '/create-blog';
    const editingBlog = (location.state as any)?.blog;

    // Core Post States
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [language, setLanguage] = useState('English');
    const [coverImage, setCoverImage] = useState('');
    const [coverImageCaption, setCoverImageCaption] = useState('');
    const [coverImageCourtesy, setCoverImageCourtesy] = useState('');

    // Film Photo & Still Search Modal States
    const [showFilmSearchModal, setShowFilmSearchModal] = useState(false);
    const [filmSearchQuery, setFilmSearchQuery] = useState('');
    const [filmSearchTargetBlockId, setFilmSearchTargetBlockId] = useState<string | null>(null);
    const [filmSearchMode, setFilmSearchMode] = useState<'cover' | 'block' | 'replace'>('block');

    // Structured Blocks
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
        { id: 'block-1', type: 'text', content: '' }
    ]);

    // Auto-detected films mentioned in the draft writing (e.g. Baahubali, Jailer 2, RRR, Kalki)
    const detectedFilms = useMemo(() => {
        const fullDraftText = `${title} ${subtitle} ${contentBlocks.filter(b => b.type === 'text' || b.type === 'heading').map(b => b.content).join(' ')}`;
        return detectFilmsInText(fullDraftText);
    }, [title, subtitle, contentBlocks]);

    const openFilmSearch = (defaultQuery?: string, targetId: string | null = null, mode: 'cover' | 'block' | 'replace' = 'block') => {
        setFilmSearchQuery(defaultQuery || detectedFilms[0] || title || 'Baahubali');
        setFilmSearchTargetBlockId(targetId);
        setFilmSearchMode(mode);
        setShowFilmSearchModal(true);
    };

    const handleSelectFilmImage = (image: FilmImageResult, action: 'cover' | 'block' | 'replace') => {
        if (action === 'cover') {
            setCoverImage(image.imageUrl);
            setCoverImageCaption(image.title);
            setCoverImageCourtesy(image.courtesy);
            toast.success('Cover image set with photo courtesy!');
        } else if (action === 'replace' && filmSearchTargetBlockId) {
            setContentBlocks(prev => prev.map(b => b.id === filmSearchTargetBlockId ? {
                ...b,
                content: image.imageUrl,
                caption: image.title,
                courtesy: image.courtesy
            } : b));
            toast.success('Film picture replaced with photo courtesy!');
        } else {
            setContentBlocks(prev => [
                ...prev,
                {
                    id: generateId(),
                    type: 'image',
                    content: image.imageUrl,
                    caption: image.title,
                    courtesy: image.courtesy,
                    imageSize: 'large',
                    imageAlign: 'center'
                }
            ]);
            toast.success('Film picture added to story with photo courtesy!');
        }
    };

    // View & UI States
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showAIImageModal, setShowAIImageModal] = useState(false);
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // AI States
    const [aiTopic, setAiTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGeneratingHeadlines, setIsGeneratingHeadlines] = useState(false);
    const [headlineSuggestions, setHeadlineSuggestions] = useState<string[]>([]);
    const [aiImagePrompt, setAiImagePrompt] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    // Inline Block AI States (Wand directly on paragraph)
    const [activeAIBlockId, setActiveAIBlockId] = useState<string | null>(null);
    const [inlineAIPrompt, setInlineAIPrompt] = useState('');
    const [isBlockAILoading, setIsBlockAILoading] = useState<string | null>(null);

    // Live preview inline comments & share states
    const [previewInlineComments, setPreviewInlineComments] = useState<{ [blockId: string]: Array<{ author: string; text: string; time: string }> }>({});
    const [activePreviewCommentBlockId, setActivePreviewCommentBlockId] = useState<string | null>(null);
    const [previewCommentInput, setPreviewCommentInput] = useState('');

    // Upload & File Refs
    const [isUploading, setIsUploading] = useState(false);
    const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);
    const replaceImageInputRef = useRef<HTMLInputElement>(null);

    // Utility: unique ID
    const generateId = () => `b_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

    // Get language prompt instruction
    const getLanguageInstruction = () => {
        const lang = LANGUAGES.find(l => l.name === language);
        if (!lang) return 'Write in English.';

        switch (lang.code) {
            case 'hi': return 'Write completely in Hindi using natural Devanagari script.';
            case 'te': return 'Write completely in Telugu using authentic Telugu script.';
            case 'ta': return 'Write completely in Tamil using authentic Tamil script.';
            case 'kn': return 'Write completely in Kannada using authentic Kannada script.';
            case 'ml': return 'Write completely in Malayalam using authentic Malayalam script.';
            case 'ur': return 'Write completely in Urdu using authentic Urdu script.';
            case 'hinglish': return 'Write in Hinglish - an engaging blend of Hindi and English using Latin/English alphabet.';
            case 'tinglish': return 'Write in Tinglish - a conversational blend of Telugu and English using Latin/English alphabet.';
            case 'tanglish': return 'Write in Tanglish - a conversational blend of Tamil and English using Latin/English alphabet.';
            case 'kanglish': return 'Write in Kanglish - a conversational blend of Kannada and English using Latin/English alphabet.';
            case 'manglish': return 'Write in Manglish - a conversational blend of Malayalam and English using Latin/English alphabet.';
            default: return 'Write in fluent, polished English suitable for film industry professionals.';
        }
    };

    // Helper: generate high-resolution themed image
    const getRelevantImage = (topic: string): string => {
        const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `https://picsum.photos/seed/${cleanTopic}-${timestamp}-${random}/1200/800`;
    };

    // Initial load: Draft restoration or Edit mode population
    useEffect(() => {
        if (!isCreateMode && editingBlog) {
            setTitle(editingBlog.title || '');
            setCategory(editingBlog.category || CATEGORIES[0]);
            if (editingBlog.language) setLanguage(editingBlog.language);
            if (editingBlog.image) setCoverImage(editingBlog.image);
            if (editingBlog.coverImageCaption) setCoverImageCaption(editingBlog.coverImageCaption);
            if (editingBlog.coverImageCourtesy) setCoverImageCourtesy(editingBlog.coverImageCourtesy);
            if (editingBlog.contentBlocks?.length) {
                // If first block was used as coverImage, separate it out if needed
                setContentBlocks(editingBlog.contentBlocks);
            } else if (editingBlog.content) {
                setContentBlocks([{ id: generateId(), type: 'text', content: editingBlog.content }]);
            }
        } else if (isCreateMode) {
            try {
                const saved = localStorage.getItem('ifilm_blog_draft');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.title || parsed.contentBlocks?.some((b: any) => b.content?.trim()) || parsed.coverImage) {
                        setTitle(parsed.title || '');
                        if (parsed.subtitle) setSubtitle(parsed.subtitle);
                        if (parsed.category) setCategory(parsed.category);
                        if (parsed.language) setLanguage(parsed.language);
                        if (parsed.coverImage) setCoverImage(parsed.coverImage);
                        if (parsed.coverImageCaption) setCoverImageCaption(parsed.coverImageCaption);
                        if (parsed.coverImageCourtesy) setCoverImageCourtesy(parsed.coverImageCourtesy);
                        if (parsed.contentBlocks?.length) setContentBlocks(parsed.contentBlocks);
                        setHasRestoredDraft(true);
                    }
                }
            } catch (err) {
                console.warn('Could not load draft from localStorage', err);
            }
        }
    }, [isCreateMode, editingBlog]);

    // Autosave draft to localStorage
    useEffect(() => {
        if (!isCreateMode) return;
        const hasWork = title.trim() || coverImage || contentBlocks.some(b => b.content.trim());
        if (!hasWork) return;

        const timer = setTimeout(() => {
            try {
                localStorage.setItem('ifilm_blog_draft', JSON.stringify({
                    title,
                    subtitle,
                    category,
                    language,
                    coverImage,
                    coverImageCaption,
                    coverImageCourtesy,
                    contentBlocks,
                    savedAt: Date.now()
                }));
            } catch (err) {
                // Ignore quota errors
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [title, subtitle, category, language, coverImage, coverImageCaption, coverImageCourtesy, contentBlocks, isCreateMode]);

    // Discard draft
    const handleDiscardDraft = () => {
        if (window.confirm('Discard this draft and start a fresh article?')) {
            localStorage.removeItem('ifilm_blog_draft');
            setTitle('');
            setSubtitle('');
            setCoverImage('');
            setCoverImageCaption('');
            setCoverImageCourtesy('');
            setContentBlocks([{ id: generateId(), type: 'text', content: '' }]);
            setHasRestoredDraft(false);
            toast.info('Draft discarded. Started fresh canvas.');
        }
    };

    // Calculate live word count & reading time
    const totalWords = [
        title,
        subtitle,
        ...contentBlocks.filter(b => b.type === 'text' || b.type === 'heading').map(b => b.content.replace(/<[^>]*>/g, ''))
    ].join(' ').split(/\s+/).filter(Boolean).length;
    const readingTimeMins = Math.max(1, Math.ceil(totalWords / 200));

    // Block manipulations
    const updateBlockContent = (id: string, content: string) => {
        setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    };

    const deleteBlock = (id: string) => {
        if (contentBlocks.length <= 1) {
            setContentBlocks([{ id: generateId(), type: 'text', content: '' }]);
            return;
        }
        setContentBlocks(prev => prev.filter(b => b.id !== id));
    };

    const addTextBlock = (afterId?: string) => {
        const newBlock: ContentBlock = { id: generateId(), type: 'text', content: '' };
        if (!afterId) {
            setContentBlocks(prev => [...prev, newBlock]);
            return;
        }
        const index = contentBlocks.findIndex(b => b.id === afterId);
        if (index === -1) {
            setContentBlocks(prev => [...prev, newBlock]);
        } else {
            const next = [...contentBlocks];
            next.splice(index + 1, 0, newBlock);
            setContentBlocks(next);
        }
    };

    const addHeadingBlock = (afterId?: string) => {
        const newBlock: ContentBlock = {
            id: generateId(),
            type: 'heading',
            content: 'Section Heading'
        };
        insertBlockAfter(newBlock, afterId);
    };

    const addQuoteBlock = (afterId?: string) => {
        const newBlock: ContentBlock = {
            id: generateId(),
            type: 'text',
            style: 'italic',
            content: '<blockquote>"Cinema is a matter of what\'s in the frame and what\'s out." — Martin Scorsese</blockquote>'
        };
        insertBlockAfter(newBlock, afterId);
    };

    const insertBlockAfter = (newBlock: ContentBlock, afterId?: string) => {
        if (!afterId) {
            setContentBlocks(prev => [...prev, newBlock]);
            return;
        }
        const index = contentBlocks.findIndex(b => b.id === afterId);
        if (index === -1) {
            setContentBlocks(prev => [...prev, newBlock]);
        } else {
            const next = [...contentBlocks];
            next.splice(index + 1, 0, newBlock);
            setContentBlocks(next);
        }
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= contentBlocks.length) return;
        setContentBlocks(prev => {
            const next = [...prev];
            [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
            return next;
        });
    };

    const updateImageSettings = (id: string, updates: Partial<ContentBlock>) => {
        setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    // Block AI Assist Handler (Right on the active paragraph/block)
    const handleBlockAIAssist = async (
        blockId: string,
        actionType: 'continue' | 'cinematic' | 'polish' | 'punchy' | 'custom',
        customPrompt?: string
    ) => {
        const block = contentBlocks.find(b => b.id === blockId);
        if (!block) return;
        const currentText = block.content.replace(/<[^>]*>/g, '').trim();

        setIsBlockAILoading(blockId);
        try {
            const langInstruction = getLanguageInstruction();
            let prompt = '';
            if (actionType === 'continue') {
                prompt = `You are an elite cinema writer. Here is the current text of a film story titled "${title || 'Cinema Story'}":
"${currentText}"
Write the next 2-3 engaging, descriptive, and insightful sentences continuing this exact thought.
${langInstruction}
Output ONLY the continuation text, without quotes or conversational filler.`;
            } else if (actionType === 'cinematic') {
                prompt = `Rewrite and elevate this text with evocative cinematic vocabulary, visual flair, atmosphere, and filmmaking depth:
"${currentText}"
${langInstruction}
Output ONLY the rewritten text, without quotes or conversational filler.`;
            } else if (actionType === 'polish') {
                prompt = `Proofread, polish grammar, refine rhythm and fix flow for this text while keeping its core message intact:
"${currentText}"
${langInstruction}
Output ONLY the polished text, without quotes or conversational filler.`;
            } else if (actionType === 'punchy') {
                prompt = `Condense this text into a sharp, impactful, memorable 1-2 sentence cinema takeaway or quote:
"${currentText}"
${langInstruction}
Output ONLY the punchy takeaway text, without quotes or conversational filler.`;
            } else if (actionType === 'custom') {
                prompt = `You are a cinema writing assistant.
Current text: "${currentText}"
Task: ${customPrompt}
${langInstruction}
Output ONLY the resulting revised text, without quotes or conversational filler.`;
            }

            const res = await generateText(prompt, 'Block AI Assist');
            if (res.error) throw new Error(res.error);
            if (res.text) {
                const resultText = res.text.trim().replace(/^["']|["']$/g, '');
                if (actionType === 'continue') {
                    updateBlockContent(blockId, currentText ? `${currentText} ${resultText}` : resultText);
                } else {
                    updateBlockContent(blockId, resultText);
                }
                toast.success('AI updated this paragraph!');
                setActiveAIBlockId(null);
                setInlineAIPrompt('');
            }
        } catch (err) {
            console.error('Block AI error:', err);
            toast.error('AI assistance failed. Please try again.');
        } finally {
            setIsBlockAILoading(null);
        }
    };

    // Upload handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetBlockId?: string | null, isCover = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(file);
            if (result.url) {
                if (isCover) {
                    setCoverImage(result.url);
                    toast.success('Cover image uploaded!');
                } else if (targetBlockId) {
                    setContentBlocks(prev => prev.map(b => b.id === targetBlockId ? { ...b, content: result.url! } : b));
                    toast.success('Image replaced successfully!');
                } else {
                    setContentBlocks(prev => [
                        ...prev,
                        { id: generateId(), type: 'image', content: result.url!, imageSize: 'full', imageAlign: 'center' }
                    ]);
                    toast.success('Image added to article!');
                }
            } else {
                toast.error(`Upload failed: ${result.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('File upload error:', err);
            toast.error('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            setReplacingImageId(null);
            if (coverImageInputRef.current) coverImageInputRef.current.value = '';
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (replaceImageInputRef.current) replaceImageInputRef.current.value = '';
        }
    };

    // AI Generation Handlers
    const handleAIWriteBlog = async (presetTopic?: string) => {
        const topic = presetTopic || aiTopic.trim() || title.trim();
        if (!topic) {
            toast.error('Please enter or select a topic for your story.');
            return;
        }

        setIsGenerating(true);
        try {
            const langInstruction = getLanguageInstruction();
            const prompt = `You are an elite cinema journalist and filmmaker writing for iFilmDirectory, India's premier film directory and community.
Write a captivating, informative, and beautifully paced article on: "${topic}".
Category: ${category}.
${langInstruction}

GUIDELINES:
1. Provide a powerful headline in the first line prefixed with "TITLE: ".
2. Write 5 to 6 richly detailed, immersive paragraphs.
3. Include real-world film references (Indian cinema, Telugu, Tamil, Hindi, Malayalam, Hollywood, or World Cinema as relevant).
4. Include practical craft insights (camerawork, screenwriting, performance, or industry realities).
5. Output plain text paragraphs separated by two newlines (NO markdown hashtags like ##, NO asterisks like **).
6. Ensure genuine depth and engaging storytelling.`;

            const res = await generateText(prompt, 'Cinema Article Creation');
            if (res.error) throw new Error(res.error);

            if (res.text) {
                let lines = res.text.split('\n').map(l => l.trim()).filter(Boolean);
                let generatedTitle = '';

                // Extract TITLE if present
                const titleLine = lines.find(l => l.startsWith('TITLE:'));
                if (titleLine) {
                    generatedTitle = titleLine.replace(/^TITLE:\s*/i, '').trim();
                    lines = lines.filter(l => !l.startsWith('TITLE:'));
                }

                if (!title.trim() && generatedTitle) {
                    setTitle(generatedTitle);
                } else if (!title.trim()) {
                    setTitle(topic);
                }

                // Clean and split into paragraphs
                const cleanParagraphs = lines
                    .map(l => l.replace(/^[#*\-•\s]+/g, '').trim())
                    .filter(l => l.length > 25);

                const headerImg = getRelevantImage(topic);
                const midImg = getRelevantImage(`${topic} cinema craft`);

                if (!coverImage) {
                    setCoverImage(headerImg);
                }

                const newBlocks: ContentBlock[] = [];
                cleanParagraphs.forEach((para, idx) => {
                    newBlocks.push({
                        id: generateId(),
                        type: 'text',
                        content: para
                    });

                    // Add an image after paragraph 2
                    if (idx === 1) {
                        newBlocks.push({
                            id: generateId(),
                            type: 'image',
                            content: midImg,
                            imageSize: 'large',
                            imageAlign: 'center'
                        });
                    }
                });

                if (newBlocks.length > 0) {
                    setContentBlocks(newBlocks);
                    setShowAIPanel(false);
                    setAiTopic('');
                    toast.success('Cinema article generated with live visuals!');
                }
            }
        } catch (err) {
            console.error('AI Generation error:', err);
            toast.error('AI generation was unable to complete. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // AI Polish & Enhance
    const handleAIEnhance = async () => {
        const textParts = contentBlocks
            .filter(b => b.type === 'text')
            .map(b => b.content.replace(/<[^>]*>/g, ''))
            .filter(Boolean);

        if (textParts.length === 0) {
            toast.error('Please write some content first to enhance.');
            return;
        }

        setIsEnhancing(true);
        try {
            const langInstruction = getLanguageInstruction();
            const prompt = `You are a chief film editor at an elite entertainment journal.
Polish and elevate the following article draft. Maintain the author's authentic perspective and topic, but enhance flow, cinematic vocabulary, paragraph transitions, and readability.
${langInstruction}
Do NOT output markdown headers (no ##), no asterisks (no **). Output ONLY the revised paragraphs separated by blank lines.

ORIGINAL DRAFT:
${textParts.join('\n\n')}`;

            const res = await generateText(prompt, 'Article Polish');
            if (res.error) throw new Error(res.error);

            if (res.text) {
                const cleanParagraphs = res.text
                    .split('\n\n')
                    .map(p => p.replace(/^[#*\-•\s]+/g, '').trim())
                    .filter(Boolean);

                const imageBlocks = contentBlocks.filter(b => b.type === 'image');
                const nextBlocks: ContentBlock[] = [];

                cleanParagraphs.forEach((para, idx) => {
                    nextBlocks.push({ id: generateId(), type: 'text', content: para });
                    if (idx === 1 && imageBlocks[0]) {
                        nextBlocks.push(imageBlocks[0]);
                    } else if (idx === 3 && imageBlocks[1]) {
                        nextBlocks.push(imageBlocks[1]);
                    }
                });

                setContentBlocks(nextBlocks);
                toast.success('Article polished with enhanced cinematic flow!');
            }
        } catch (err) {
            console.error('AI enhance error:', err);
            toast.error('Failed to enhance article. Please try again.');
        } finally {
            setIsEnhancing(false);
        }
    };

    // AI Headline Generator
    const handleGenerateHeadlines = async () => {
        const textSample = contentBlocks.filter(b => b.type === 'text').map(b => b.content).join(' ').slice(0, 500);
        const queryTopic = title || textSample || category;

        setIsGeneratingHeadlines(true);
        try {
            const prompt = `Generate 4 punchy, high-engagement headlines for a film article about: "${queryTopic}".
Format as a simple numbered list from 1 to 4 without extra commentary.
Make them dramatic, insightful, and appealing to film professionals and movie buffs.`;

            const res = await generateText(prompt, 'Headline Ideation');
            if (res.text) {
                const headlines = res.text
                    .split('\n')
                    .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/["']/g, '').trim())
                    .filter(l => l.length > 5);
                setHeadlineSuggestions(headlines.slice(0, 4));
            }
        } catch (err) {
            console.error('Headlines error:', err);
        } finally {
            setIsGeneratingHeadlines(false);
        }
    };

    // AI Image Generation
    const handleAIGenerateImage = async (customPrompt?: string) => {
        const promptToUse = customPrompt || aiImagePrompt.trim();
        if (!promptToUse) {
            toast.error('Please enter a description for the image.');
            return;
        }

        setIsGeneratingImage(true);
        try {
            // Emulate high-precision synthesis and seed a dedicated Picsum photography render
            await new Promise(r => setTimeout(r, 600));
            const generatedUrl = getRelevantImage(promptToUse);

            if (!coverImage) {
                setCoverImage(generatedUrl);
                setCoverImageCaption(promptToUse);
                toast.success('Cover image generated from your prompt!');
            } else {
                setContentBlocks(prev => [
                    ...prev,
                    {
                        id: generateId(),
                        type: 'image',
                        content: generatedUrl,
                        imageSize: 'large',
                        imageAlign: 'center'
                    }
                ]);
                toast.success('AI cinematic visual added to article!');
            }
            setShowAIImageModal(false);
            setAiImagePrompt('');
        } catch (err) {
            toast.error('Failed to generate image. Please try again.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Save & Publish
    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title for your article.');
            return;
        }

        const validTextBlocks = contentBlocks.filter(b => b.type === 'text' && b.content.trim().length > 0);
        if (validTextBlocks.length === 0) {
            toast.error('Please write some content before publishing.');
            return;
        }

        if (!currentUser) {
            toast.info('Please sign in to publish your story.');
            return;
        }

        setIsSaving(true);
        try {
            // Compile blocks for storage: include cover image if set as the first image block
            const compiledBlocks: ContentBlock[] = [];
            if (coverImage) {
                compiledBlocks.push({
                    id: generateId(),
                    type: 'image',
                    content: coverImage,
                    caption: coverImageCaption,
                    courtesy: coverImageCourtesy,
                    imageSize: 'full',
                    imageAlign: 'center'
                });
            }

            contentBlocks.forEach(b => {
                // If cover image is already identical to block 0, don't duplicate
                if (b.type === 'image' && b.content === coverImage) return;
                compiledBlocks.push(b);
            });

            if (!isCreateMode && editingBlog?.id) {
                await blogService.updateBlog(editingBlog.id, {
                    title: title.trim(),
                    contentBlocks: compiledBlocks,
                    category,
                    language,
                    coverImage,
                    coverImageCaption,
                    coverImageCourtesy
                });
                toast.success('Article updated successfully!');
            } else {
                const res = await blogService.createBlog({
                    title: title.trim(),
                    contentBlocks: compiledBlocks,
                    category,
                    language,
                    authorId: currentUser.uid,
                    author: currentUser.displayName || 'Film Professional',
                    authorPhoto: currentUser.photoURL || undefined,
                    coverImage,
                    coverImageCaption,
                    coverImageCourtesy
                });

                if (!res.success) throw new Error('Creation failed');

                // Clear draft from localStorage upon successful publication
                localStorage.removeItem('ifilm_blog_draft');
                toast.success('Your article has been published to the Cinema Feed & Blogs!');
            }

            navigate('/blogs-events');
        } catch (err) {
            console.error('Publish error:', err);
            toast.error('Failed to publish article. Please verify your connection.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedLang = LANGUAGES.find(l => l.name === language) || LANGUAGES[0];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 font-display selection:bg-amber-500/20 selection:text-amber-500 transition-colors">
            {/* Hidden File Inputs */}
            <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, null, true)}
                className="hidden"
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, null, false)}
                className="hidden"
            />
            <input
                ref={replaceImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, replacingImageId, false)}
                className="hidden"
            />

            {/* TOP STUDIO APP BAR */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/10 px-4 sm:px-6 py-2.5 transition-colors">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    {/* Left: Back & Studio Identity */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            onClick={() => navigate(-1)}
                            className="size-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
                            title="Go Back"
                            aria-label="Back"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                    {isCreateMode ? 'Cinema Story Studio' : 'Edit Article'}
                                </h1>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Draft
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                ⏱️ {readingTimeMins} min read • {totalWords} words
                            </p>
                        </div>
                    </div>

                    {/* Right Controls: AI Copilot, Preview Mode, Language */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Draft Restored Pill */}
                        {hasRestoredDraft && isCreateMode && (
                            <button
                                onClick={handleDiscardDraft}
                                className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-red-500 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Discard saved draft"
                            >
                                <span className="material-symbols-outlined text-sm">delete_outline</span>
                                Reset
                            </button>
                        )}

                        {/* Language Selector Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
                                title="Change Article Language"
                            >
                                <span>{selectedLang.flag}</span>
                                <span className="hidden sm:inline text-xs">{selectedLang.name}</span>
                                <span className="material-symbols-outlined text-sm text-zinc-400">expand_more</span>
                            </button>

                            {showLanguageMenu && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1e1f24] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-2 z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-white/5 mb-1">
                                        Select Writing Language
                                    </div>
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.name);
                                                setShowLanguageMenu(false);
                                                toast.info(`Language set to ${lang.name}`);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                                                language === lang.name
                                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-base">{lang.flag}</span>
                                                <span>{lang.name}</span>
                                            </span>
                                            {language === lang.name && (
                                                <span className="material-symbols-outlined text-sm text-amber-500">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Copilot Trigger */}
                        <button
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
                            title="Open Cinema AI Copilot"
                        >
                            <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                            <span className="hidden sm:inline">AI Copilot</span>
                        </button>

                        {/* Preview / Edit Toggle */}
                        <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isPreviewMode
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-white/10'
                            }`}
                            title={isPreviewMode ? 'Switch to Edit Canvas' : 'Preview Reader View'}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {isPreviewMode ? 'edit' : 'visibility'}
                            </span>
                            <span className="hidden sm:inline">{isPreviewMode ? 'Edit' : 'Preview'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* AI COPILOT DRAWER / MODAL */}
            {showAIPanel && (
                <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border-b border-amber-500/20 p-4 sm:p-6 transition-all animate-in slide-in-from-top duration-200">
                    <div className="max-w-5xl mx-auto space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500 text-xl">auto_awesome</span>
                                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                    Cinema AI Copilot
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    Writing in {selectedLang.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowAIPanel(false)}
                                className="size-7 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        {/* Input with Quick Write */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="Enter a topic (e.g., 'Evolution of VFX in Indian Cinema', 'Directing Actors on Low Budgets')..."
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                            <button
                                onClick={() => handleAIWriteBlog()}
                                disabled={isGenerating || (!aiTopic.trim() && !title.trim())}
                                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        <span>Writing Story...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">auto_stories</span>
                                        <span>Generate Article</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Cinema Story Templates */}
                        <div>
                            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                                Or pick a Cinema Theme to generate instantly:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {AI_CINEMA_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => {
                                            setAiTopic(preset.topic);
                                            handleAIWriteBlog(preset.topic);
                                        }}
                                        disabled={isGenerating}
                                        className="text-left p-2.5 rounded-xl bg-white/80 dark:bg-[#1e1f24] hover:bg-white dark:hover:bg-[#26272e] border border-zinc-200/80 dark:border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group flex items-start gap-2.5"
                                    >
                                        <span className="material-symbols-outlined text-amber-500 text-base mt-0.5 group-hover:scale-110 transition-transform">
                                            {preset.icon}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {preset.label}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                {preset.topic}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CANVAS AREA */}
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 pb-44">
                {isPreviewMode ? (
                    /* ================= PREVIEW MODE ================= */
                    <article className="bg-white dark:bg-[#1e1f24] rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm p-5 sm:p-10 transition-colors animate-in fade-in">
                        {/* Cover Image */}
                        {coverImage && (
                            <div className="mb-6 rounded-2xl overflow-hidden aspect-video relative bg-black/40 border border-zinc-200 dark:border-white/10">
                                <PostMedia
                                    src={coverImage}
                                    fallbackType="FILM_SET"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold border border-amber-400/30">
                                        {category}
                                    </span>
                                </div>
                                {(coverImageCaption || coverImageCourtesy) && (
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 flex flex-col items-center justify-center gap-0.5 text-center">
                                        {coverImageCaption && (
                                            <p className="text-[11px] text-zinc-200 font-medium">
                                                {coverImageCaption}
                                            </p>
                                        )}
                                        {coverImageCourtesy && (
                                            <p className="text-[10px] text-zinc-400 italic tracking-wide">
                                                {coverImageCourtesy.startsWith('Photo courtesy:') ? coverImageCourtesy : `Photo courtesy: ${coverImageCourtesy}`}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Article Header */}
                        <div className="space-y-3 mb-6 pb-6 border-b border-zinc-200/80 dark:border-white/10">
                            {!coverImage && (
                                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
                                    {category}
                                </span>
                            )}
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                                {title || 'Untitled Cinema Story'}
                            </h1>
                            {subtitle && (
                                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-medium">
                                    {subtitle}
                                </p>
                            )}

                            {/* Author Row */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className="size-10 rounded-full overflow-hidden border border-zinc-200 dark:border-white/10 shrink-0">
                                    <PostMedia
                                        src={currentUser?.photoURL || ''}
                                        fallbackType="USER_MALE"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                        {currentUser?.displayName || 'Film Professional'}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                        Published in {selectedLang.name} • {readingTimeMins} min read
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Render Content Blocks */}
                        <div className="space-y-4">
                            {contentBlocks.map((block, idx) => {
                                if (block.type === 'image') {
                                    return (
                                        <figure
                                            key={idx}
                                            className={`${
                                                block.imageAlign === 'left' ? 'float-left mr-4 mb-4' :
                                                block.imageAlign === 'right' ? 'float-right ml-4 mb-4' :
                                                'mx-auto clear-both'
                                            } ${
                                                block.imageSize === 'small' ? 'max-w-xs' :
                                                block.imageSize === 'medium' ? 'max-w-md' :
                                                block.imageSize === 'large' ? 'max-w-2xl' :
                                                'w-full'
                                            } space-y-1.5`}
                                        >
                                            <PostMedia
                                                src={block.content}
                                                fallbackType="FILM_SET"
                                                className="w-full h-auto rounded-xl shadow-md border border-zinc-200 dark:border-white/10"
                                            />
                                            {(block.caption || block.courtesy) && (
                                                <figcaption className="text-center px-2 space-y-0.5">
                                                    {block.caption && (
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                                                            {block.caption}
                                                        </p>
                                                    )}
                                                    {block.courtesy && (
                                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 italic tracking-wide">
                                                            {block.courtesy.startsWith('Photo courtesy:') ? block.courtesy : `Photo courtesy: ${block.courtesy}`}
                                                        </p>
                                                    )}
                                                </figcaption>
                                            )}
                                        </figure>
                                    );
                                }
                                return (
                                    <div key={idx} className="group/para relative space-y-2">
                                        <div
                                            className="text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-200"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }}
                                        />

                                        {/* Inline Paragraph Action Bar */}
                                        <div className="flex items-center gap-2 pt-1 opacity-90 sm:opacity-0 group-hover/para:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setActivePreviewCommentBlockId(activePreviewCommentBlockId === block.id ? null : block.id)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                                    (previewInlineComments[block.id]?.length || 0) > 0
                                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                                        : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-xs">chat_bubble</span>
                                                <span>
                                                    {(previewInlineComments[block.id]?.length || 0) > 0
                                                        ? `${previewInlineComments[block.id].length} Comments`
                                                        : 'Inline Comment'}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const rawText = block.content.replace(/<[^>]*>/g, '').trim();
                                                    navigator.clipboard.writeText(`"${rawText}" — Read on iFilmDirectory`);
                                                    toast.success('Quote & link copied to clipboard!');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer"
                                                title="Share quote"
                                            >
                                                <span className="material-symbols-outlined text-xs">share</span>
                                                <span>Share Quote</span>
                                            </button>
                                        </div>

                                        {/* Inline Comment Thread */}
                                        {activePreviewCommentBlockId === block.id && (
                                            <div className="p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-[#18191d] border border-zinc-200/80 dark:border-white/10 space-y-2.5 animate-in fade-in">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs">chat_bubble</span>
                                                        Inline Discussion on this paragraph
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePreviewCommentBlockId(null)}
                                                        className="text-zinc-400 hover:text-zinc-600 text-xs"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>

                                                {/* Existing Inline Comments */}
                                                {(previewInlineComments[block.id] || []).length > 0 && (
                                                    <div className="space-y-2">
                                                        {previewInlineComments[block.id].map((c, cIdx) => (
                                                            <div key={cIdx} className="p-2.5 rounded-xl bg-white dark:bg-[#1e1f24] border border-zinc-200/60 dark:border-white/5 text-xs">
                                                                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-white">
                                                                    <span>{c.author}</span>
                                                                    <span className="text-[10px] text-zinc-400 font-normal">{c.time}</span>
                                                                </div>
                                                                <p className="text-zinc-700 dark:text-zinc-300 mt-1">{c.text}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* New Inline Comment Input */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={previewCommentInput}
                                                        onChange={(e) => setPreviewCommentInput(e.target.value)}
                                                        placeholder="Add an inline thought on this quote..."
                                                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f24] border border-zinc-200/80 dark:border-white/10 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && previewCommentInput.trim()) {
                                                                const authorName = currentUser?.displayName || 'Film Reader';
                                                                setPreviewInlineComments(prev => ({
                                                                    ...prev,
                                                                    [block.id]: [...(prev[block.id] || []), { author: authorName, text: previewCommentInput.trim(), time: 'Just now' }]
                                                                }));
                                                                setPreviewCommentInput('');
                                                                toast.success('Inline comment added in preview!');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!previewCommentInput.trim()) return;
                                                            const authorName = currentUser?.displayName || 'Film Reader';
                                                            setPreviewInlineComments(prev => ({
                                                                ...prev,
                                                                [block.id]: [...(prev[block.id] || []), { author: authorName, text: previewCommentInput.trim(), time: 'Just now' }]
                                                            }));
                                                            setPreviewCommentInput('');
                                                            toast.success('Inline comment added in preview!');
                                                        }}
                                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                                                    >
                                                        Post
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div className="clear-both" />
                        </div>
                    </article>
                ) : (
                    /* ================= EDIT MODE ================= */
                    <div className="bg-white dark:bg-[#1e1f24] rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm p-4 sm:p-8 space-y-6 transition-colors">
                        {/* COVER IMAGE AREA */}
                        {coverImage ? (
                            <div className="relative rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-zinc-200 dark:border-white/10 group">
                                <PostMedia
                                    src={coverImage}
                                    fallbackType="FILM_SET"
                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap p-2">
                                    <button
                                        onClick={() => openFilmSearch(title || 'Baahubali', null, 'cover')}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-1.5 shadow-lg cursor-pointer"
                                        title="Search authentic movie still or poster"
                                    >
                                        <span className="material-symbols-outlined text-sm">movie</span>
                                        Film Still
                                    </button>
                                    <button
                                        onClick={() => coverImageInputRef.current?.click()}
                                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-bold hover:bg-zinc-100 flex items-center gap-1.5 shadow-lg cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">upload</span>
                                        Replace
                                    </button>
                                    <button
                                        onClick={() => handleAIGenerateImage(title || 'cinematic film still')}
                                        className="px-3 py-1.5 rounded-xl bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-700 flex items-center gap-1.5 shadow-lg cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">autorenew</span>
                                        AI Render
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCoverImage('');
                                            setCoverImageCaption('');
                                            setCoverImageCourtesy('');
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-lg cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                        Remove
                                    </button>
                                </div>
                                <div className="absolute top-3 left-3">
                                    <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-xs font-bold border border-amber-400/20">
                                        Cover Visual
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 hover:border-amber-500/50 p-6 sm:p-8 text-center transition-colors bg-zinc-50/50 dark:bg-white/[0.02]">
                                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-2xl">movie</span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                    Add a Cinematic Cover Still or Poster
                                </h4>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                                    Search authentic movie pictures for Baahubali, Jailer 2, RRR, Kalki or any film, or upload your own.
                                </p>
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => openFilmSearch(detectedFilms[0] || title || 'Baahubali', null, 'cover')}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">search</span>
                                        Search Film Stills
                                    </button>
                                    <button
                                        onClick={() => coverImageInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">upload</span>
                                        Upload
                                    </button>
                                    <button
                                        onClick={() => setShowAIImageModal(true)}
                                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        AI Generate
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Caption & Courtesy for cover image */}
                        {coverImage && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                        Cover Caption (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={coverImageCaption}
                                        onChange={(e) => setCoverImageCaption(e.target.value)}
                                        placeholder="e.g., Epic confrontation sequence..."
                                        className="w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 flex items-center justify-between">
                                        <span>Photo Courtesy (very small font)</span>
                                        <span className="text-[9px] text-amber-500 font-normal">Auto-credited</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={coverImageCourtesy}
                                        onChange={(e) => setCoverImageCourtesy(e.target.value)}
                                        placeholder="e.g., Photo courtesy: Arka Media Works / S.S. Rajamouli"
                                        className="w-full text-xs text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* SMART FILM MENTION DETECTOR / SEARCH BANNER */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/5 border border-amber-500/25 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="size-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-lg">movie_filter</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                                            {detectedFilms.length > 0 ? 'Films Detected in Your Story:' : 'Film Stills & Posters:'}
                                        </span>
                                        {detectedFilms.length > 0 ? (
                                            detectedFilms.map(film => (
                                                <button
                                                    key={film}
                                                    type="button"
                                                    onClick={() => openFilmSearch(film, null, 'cover')}
                                                    className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white text-[11px] font-bold hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                                    title={`Search pictures for ${film}`}
                                                >
                                                    <span>🎬 {film}</span>
                                                    <span className="material-symbols-outlined text-xs">search</span>
                                                </button>
                                            ))
                                        ) : (
                                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                Search authentic stills for Baahubali, Jailer 2, RRR, Kalki or any movie with photo courtesy.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => openFilmSearch(detectedFilms[0] || title || 'Baahubali', null, 'cover')}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">search</span>
                                <span>Search Film Stills</span>
                            </button>
                        </div>

                        {/* CATEGORY SELECTOR CAROUSEL */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                Select Film Category
                            </label>
                            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                            category === cat
                                                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm'
                                                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/10'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TITLE & HEADLINE GENERATOR */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Headline
                                </label>
                                <button
                                    type="button"
                                    onClick={handleGenerateHeadlines}
                                    disabled={isGeneratingHeadlines}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 transition-all cursor-pointer"
                                    title="Generate headline ideas with AI"
                                >
                                    <span className={`material-symbols-outlined text-xs ${isGeneratingHeadlines ? 'animate-spin' : ''}`}>
                                        auto_awesome
                                    </span>
                                    <span>{isGeneratingHeadlines ? 'Generating Ideas...' : 'AI Headline Ideas'}</span>
                                </button>
                            </div>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter an evocative headline..."
                                className="w-full text-xl sm:text-3xl font-black text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 bg-transparent border-none focus:outline-none p-0"
                            />

                            {/* Headline Suggestions */}
                            {headlineSuggestions.length > 0 && (
                                <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 animate-in fade-in">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                        Click to use any headline:
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        {headlineSuggestions.map((h, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    setTitle(h);
                                                    setHeadlineSuggestions([]);
                                                    toast.success('Headline applied!');
                                                }}
                                                className="text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-amber-500 dark:hover:text-amber-400 py-1 transition-colors"
                                            >
                                                • {h}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subtitle / Hook */}
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="Add a short teaser or secondary hook (optional)..."
                                className="w-full text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 bg-transparent border-none focus:outline-none p-0"
                            />
                        </div>

                        {/* CONTENT BLOCKS */}
                        <div className="space-y-4 pt-4 border-t border-zinc-200/80 dark:border-white/10">
                            {contentBlocks.map((block, idx) => (
                                <div key={block.id} className="group relative">
                                    {block.type === 'image' ? (
                                        /* In-Article Image Block */
                                        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#18191d] p-3 space-y-2">
                                            <div className="relative rounded-xl overflow-hidden max-h-96 flex items-center justify-center bg-black/40">
                                                <PostMedia
                                                    src={block.content}
                                                    fallbackType="FILM_SET"
                                                    className="w-full h-auto object-cover max-h-96 rounded-lg"
                                                />
                                            </div>

                                            {/* Block Controls Bar */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/80 dark:border-white/10">
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                                    <span>Size:</span>
                                                    {(['small', 'medium', 'large', 'full'] as const).map(sz => (
                                                        <button
                                                            key={sz}
                                                            onClick={() => updateImageSettings(block.id, { imageSize: sz })}
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                (block.imageSize || 'full') === sz
                                                                    ? 'bg-amber-500 text-white'
                                                                    : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                                                            }`}
                                                        >
                                                            {sz.charAt(0).toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openFilmSearch(block.caption || title || '', block.id, 'replace')}
                                                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                                        title="Search & replace with authentic film still"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">movie</span>
                                                        <span>Film Still</span>
                                                    </button>
                                                    <button
                                                        onClick={() => moveBlock(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="size-7 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                                                        title="Move block up"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                                    </button>
                                                    <button
                                                        onClick={() => moveBlock(idx, 'down')}
                                                        disabled={idx === contentBlocks.length - 1}
                                                        className="size-7 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-30 cursor-pointer"
                                                        title="Move block down"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setReplacingImageId(block.id);
                                                            replaceImageInputRef.current?.click();
                                                        }}
                                                        className="size-7 rounded-lg bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 flex items-center justify-center text-zinc-600 dark:text-zinc-300 cursor-pointer"
                                                        title="Replace with file"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">upload</span>
                                                    </button>
                                                    <button
                                                        onClick={() => deleteBlock(block.id)}
                                                        className="size-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center cursor-pointer"
                                                        title="Delete image"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* In-article Image Caption & Courtesy */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-white/5">
                                                <input
                                                    type="text"
                                                    value={block.caption || ''}
                                                    onChange={(e) => updateImageSettings(block.id, { caption: e.target.value })}
                                                    placeholder="Caption (e.g., Iconic duel scene)..."
                                                    className="w-full text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={block.courtesy || ''}
                                                        onChange={(e) => updateImageSettings(block.id, { courtesy: e.target.value })}
                                                        placeholder="Photo courtesy (e.g., Sun Pictures, Arka Media Works)..."
                                                        className="w-full text-xs text-zinc-500 dark:text-zinc-400 italic bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 pr-16"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-amber-500 font-bold uppercase pointer-events-none">
                                                        courtesy
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Text / Heading Block with Direct AI Wand */
                                        <div className="relative rounded-2xl p-3 sm:p-4 transition-all bg-zinc-50/60 dark:bg-[#18191d]/60 hover:bg-zinc-50 dark:hover:bg-[#18191d] focus-within:bg-zinc-50 dark:focus-within:bg-[#18191d] border border-zinc-200/70 dark:border-white/5 focus-within:border-amber-500/50 space-y-2.5">
                                            {/* Block Header Toolbar: Type Selector on Left, AI Wand & Movement on Right */}
                                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200/60 dark:border-white/5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                        {block.type === 'heading' ? 'Section Heading' : 'Paragraph'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateImageSettings(block.id, {
                                                            type: block.type === 'heading' ? 'text' : 'heading'
                                                        })}
                                                        className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                                                    >
                                                        Switch to {block.type === 'heading' ? 'Paragraph' : 'H2'}
                                                    </button>
                                                </div>

                                                {/* AI Wand & Block Actions RIGHT ON THE BLOCK */}
                                                <div className="flex items-center gap-1.5">
                                                    {/* AI MAGIC WAND BUTTON DIRECTLY ON PARAGRAPH */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveAIBlockId(activeAIBlockId === block.id ? null : block.id)}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                                            activeAIBlockId === block.id
                                                                ? 'bg-amber-500 text-white shadow-sm'
                                                                : 'bg-gradient-to-r from-red-600/10 to-amber-500/10 hover:from-red-600/20 hover:to-amber-500/20 text-red-600 dark:text-amber-400 border border-amber-500/25'
                                                        }`}
                                                        title="AI Magic Wand for this paragraph"
                                                    >
                                                        <span className={`material-symbols-outlined text-sm ${isBlockAILoading === block.id ? 'animate-spin' : ''}`}>
                                                            {isBlockAILoading === block.id ? 'progress_activity' : 'auto_awesome'}
                                                        </span>
                                                        <span>AI Wand</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="size-7 rounded-lg bg-zinc-200/60 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-20 cursor-pointer"
                                                        title="Move up"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveBlock(idx, 'down')}
                                                        disabled={idx === contentBlocks.length - 1}
                                                        className="size-7 rounded-lg bg-zinc-200/60 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 disabled:opacity-20 cursor-pointer"
                                                        title="Move down"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteBlock(block.id)}
                                                        className="size-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center cursor-pointer"
                                                        title="Delete block"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* INLINE AI WAND ACTIONS POPOVER/PANEL */}
                                            {activeAIBlockId === block.id && (
                                                <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-2 animate-in fade-in slide-in-from-top-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                            Paragraph AI Assistant
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveAIBlockId(null)}
                                                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    {/* Quick 1-click Actions */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={isBlockAILoading === block.id}
                                                            onClick={() => handleBlockAIAssist(block.id, 'continue')}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1e1f24] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>✨</span> Continue Writing
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isBlockAILoading === block.id || !block.content.trim()}
                                                            onClick={() => handleBlockAIAssist(block.id, 'cinematic')}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1e1f24] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>🎬</span> Make Cinematic
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isBlockAILoading === block.id || !block.content.trim()}
                                                            onClick={() => handleBlockAIAssist(block.id, 'polish')}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1e1f24] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>🪄</span> Polish Flow
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isBlockAILoading === block.id || !block.content.trim()}
                                                            onClick={() => handleBlockAIAssist(block.id, 'punchy')}
                                                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-[#1e1f24] hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>⚡</span> Make Punchy
                                                        </button>
                                                    </div>

                                                    {/* Custom Prompt Input */}
                                                    <div className="flex gap-1.5 pt-1">
                                                        <input
                                                            type="text"
                                                            value={inlineAIPrompt}
                                                            onChange={(e) => setInlineAIPrompt(e.target.value)}
                                                            placeholder="Or type prompt: 'describe the camera movement'..."
                                                            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && inlineAIPrompt.trim()) {
                                                                    handleBlockAIAssist(block.id, 'custom', inlineAIPrompt.trim());
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isBlockAILoading === block.id || !inlineAIPrompt.trim()}
                                                            onClick={() => handleBlockAIAssist(block.id, 'custom', inlineAIPrompt.trim())}
                                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            Apply
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Textarea with generous, comfortable writing space */}
                                            <textarea
                                                rows={block.type === 'heading' ? 1 : Math.max(5, Math.min(15, Math.ceil((block.content.length || 1) / 90)))}
                                                value={block.content.replace(/<[^>]*>/g, '')}
                                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                placeholder={
                                                    block.type === 'heading'
                                                        ? 'Section Heading...'
                                                        : idx === 0
                                                        ? 'Start your opening paragraph here...'
                                                        : 'Continue writing your thoughts, scene descriptions, or insights...'
                                                }
                                                className={`w-full bg-transparent border-none focus:outline-none resize-none leading-relaxed p-0 ${
                                                    block.type === 'heading'
                                                        ? 'text-lg sm:text-2xl font-black text-zinc-900 dark:text-white min-h-[44px]'
                                                        : 'text-sm sm:text-base text-zinc-800 dark:text-zinc-200 min-h-[140px]'
                                                }`}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* QUICK INSERT TOOLBAR */}
                        <div className="flex items-center gap-1.5 pt-3 border-t border-dashed border-zinc-200 dark:border-white/10 flex-wrap">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                                Insert:
                            </span>
                            <button
                                type="button"
                                onClick={() => addTextBlock()}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Paragraph
                            </button>
                            <button
                                type="button"
                                onClick={() => addHeadingBlock()}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">title</span>
                                Heading
                            </button>
                            <button
                                type="button"
                                onClick={() => addQuoteBlock()}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">format_quote</span>
                                Quote
                            </button>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">image</span>
                                Photo
                            </button>
                            <button
                                type="button"
                                onClick={() => openFilmSearch(detectedFilms[0] || title || 'Baahubali', null, 'block')}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600/10 to-amber-500/10 hover:from-red-600/20 hover:to-amber-500/20 text-red-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Search authentic film stills (Baahubali, Jailer 2, RRR...)"
                            >
                                <span className="material-symbols-outlined text-sm">movie</span>
                                Film Still
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAIImageModal(true)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                AI Visual
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* AI IMAGE GENERATOR MODAL */}
            {showAIImageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="w-full max-w-lg bg-white dark:bg-[#1e1f24] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="size-10 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md">
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                                        Cinema Visual Generator
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Generate royalty-free, high-resolution cinema stills
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAIImageModal(false)}
                                className="size-8 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <textarea
                            value={aiImagePrompt}
                            onChange={(e) => setAiImagePrompt(e.target.value)}
                            placeholder="Describe your desired cinema visual (e.g., 'Anamorphic lens flare, director looking at monitor on a neon-lit cyber set')..."
                            className="w-full h-24 p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        />

                        {/* Cinema Visual Presets */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                                Cinema Style Presets:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {AI_IMAGE_PRESETS.map((p) => (
                                    <button
                                        key={p.label}
                                        onClick={() => setAiImagePrompt(p.prompt)}
                                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/5 transition-all cursor-pointer"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => handleAIGenerateImage()}
                            disabled={isGeneratingImage || !aiImagePrompt.trim()}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-lg shadow-red-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isGeneratingImage ? (
                                <>
                                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                    <span>Rendering Cinematic Visual...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                                    <span>Generate & Insert Visual</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* STICKY BOTTOM ACTION DOCK (FLOATING & CENTERED) */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-3xl bg-white/95 dark:bg-[#1e1f24]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 rounded-2xl px-4 sm:px-6 py-3 shadow-2xl shadow-black/25 transition-all">
                <div className="flex items-center justify-between gap-2">
                    {/* Secondary Quick Action Tools */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                            title="Upload local photo"
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">
                                {isUploading ? 'progress_activity' : 'add_photo_alternate'}
                            </span>
                            <span className="hidden sm:inline">Photo</span>
                        </button>

                        <button
                            onClick={() => openFilmSearch(detectedFilms[0] || title || 'Baahubali', null, 'block')}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-red-600/10 to-amber-500/10 hover:from-red-600/20 hover:to-amber-500/20 text-red-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold transition-all cursor-pointer"
                            title="Search authentic film pictures (Baahubali, Jailer 2, RRR...)"
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">movie</span>
                            <span className="hidden sm:inline">Film Still</span>
                        </button>

                        <button
                            onClick={() => setShowAIImageModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                            title="Generate image with AI"
                        >
                            <span className="material-symbols-outlined text-base text-amber-500">photo_library</span>
                            <span className="hidden sm:inline">AI Visual</span>
                        </button>

                        <button
                            onClick={handleAIEnhance}
                            disabled={isEnhancing}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Enhance & polish current draft with AI"
                        >
                            <span className={`material-symbols-outlined text-base text-cyan-500 ${isEnhancing ? 'animate-spin' : ''}`}>
                                {isEnhancing ? 'progress_activity' : 'auto_fix_high'}
                            </span>
                            <span className="hidden sm:inline">{isEnhancing ? 'Polishing...' : 'Polish'}</span>
                        </button>

                        <button
                            onClick={() => setIsPreviewMode(!isPreviewMode)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                            title="Toggle preview"
                        >
                            <span className="material-symbols-outlined text-base text-zinc-500">
                                {isPreviewMode ? 'edit' : 'visibility'}
                            </span>
                            <span className="hidden md:inline">{isPreviewMode ? 'Edit' : 'Preview'}</span>
                        </button>
                    </div>

                    {/* Primary Publish Button */}
                    <button
                        onClick={handlePublish}
                        disabled={!title.trim() || isSaving}
                        className="h-11 px-6 sm:px-8 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-red-600/25 active:scale-95 disabled:opacity-50 disabled:from-zinc-400 disabled:to-zinc-500 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                <span>Publishing...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">send</span>
                                <span>{isCreateMode ? 'Publish Story' : 'Save Changes'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* FILM PHOTO SEARCH & FIT MODAL */}
            <FilmPhotoSearchModal
                isOpen={showFilmSearchModal}
                onClose={() => setShowFilmSearchModal(false)}
                onSelectImage={handleSelectFilmImage}
                initialQuery={filmSearchQuery}
                targetBlockId={filmSearchTargetBlockId}
                defaultAction={filmSearchMode}
            />
        </div>
    );
}
