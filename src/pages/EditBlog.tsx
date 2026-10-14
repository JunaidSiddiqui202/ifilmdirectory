import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateText } from '../services/groqService';
import { uploadFile } from '../services/storageService';
import { blogService } from '../services/blogService';
import { useAuth } from '../context/AuthContext';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';

interface ContentBlock {
    id: string;
    type: 'text' | 'image' | 'heading';
    content: string;
    style?: 'bold' | 'italic' | 'normal';
    imageSize?: 'small' | 'medium' | 'large' | 'full';
    imageAlign?: 'left' | 'center' | 'right';
}

export default function EditBlog() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const toast = useToast();
    const isCreateMode = location.pathname === '/create-blog';

    const [title, setTitle] = useState('');
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
        { id: '1', type: 'text', content: '' }
    ]);
    const [category, setCategory] = useState('Industry News');
    const [language, setLanguage] = useState('English');
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    // Image replace state
    const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
    const replaceImageInputRef = useRef<HTMLInputElement>(null);

    // AI States
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showAIImageModal, setShowAIImageModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiImagePrompt, setAiImagePrompt] = useState('');

    // Upload States
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const categories = [
        'Industry News',
        'Behind the Scenes',
        'Career Tips',
        'Film Reviews',
        'Technology',
        'Interviews',
        'Tutorials'
    ];

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
        { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
        { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
        { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
        { code: 'ur', name: 'اردو (Urdu)', flag: '🇵🇰' },
        { code: 'hinglish', name: 'Hinglish (Hindi-English)', flag: '🔀' },
        { code: 'tinglish', name: 'Tinglish (Telugu-English)', flag: '🔀' },
        { code: 'tanglish', name: 'Tanglish (Tamil-English)', flag: '🔀' },
        { code: 'kanglish', name: 'Kanglish (Kannada-English)', flag: '🔀' },
        { code: 'manglish', name: 'Manglish (Malayalam-English)', flag: '🔀' },
    ];

    // Generate unique AI image using Picsum
    const getRelevantImage = (topic: string): string => {
        // Create a unique seed based on topic and distinct timestamp
        const cleanTopic = topic.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);

        // Return a fresh, royalty-free image from Picsum
        return `https://picsum.photos/seed/${cleanTopic}-${timestamp}-${random}/1200/800`;
    };

    // Regenerate image with AI
    const regenerateImage = async (blockId: string) => {
        const block = contentBlocks.find(b => b.id === blockId);
        if (!block) return;

        // Get a new random image
        const newImage = getRelevantImage(title || 'filmmaking');
        setContentBlocks(prev => prev.map(b =>
            b.id === blockId ? { ...b, content: newImage } : b
        ));
    };

    // Replace image via upload
    const handleReplaceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !replacingImageId) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(file);
            if (result.url) {
                setContentBlocks(prev => prev.map(block =>
                    block.id === replacingImageId ? { ...block, content: result.url! } : block
                ));
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            setReplacingImageId(null);
            if (replaceImageInputRef.current) {
                replaceImageInputRef.current.value = '';
            }
        }
    };

    // Get language instruction
    const getLanguageInstruction = () => {
        const lang = languages.find(l => l.name === language);
        if (!lang) return '';

        switch (lang.code) {
            case 'hi': return 'Write in Hindi (Devanagari script).';
            case 'te': return 'Write in Telugu (Telugu script).';
            case 'ta': return 'Write in Tamil (Tamil script).';
            case 'kn': return 'Write in Kannada (Kannada script).';
            case 'ml': return 'Write in Malayalam (Malayalam script).';
            case 'ur': return 'Write in Urdu (Urdu script).';
            case 'hinglish': return 'Write in Hinglish - a mix of Hindi and English using Roman/Latin script.';
            case 'tinglish': return 'Write in Tinglish - a mix of Telugu and English using Roman/Latin script.';
            case 'tanglish': return 'Write in Tanglish - a mix of Tamil and English using Roman/Latin script.';
            case 'kanglish': return 'Write in Kanglish - a mix of Kannada and English using Roman/Latin script.';
            case 'manglish': return 'Write in Manglish - a mix of Malayalam and English using Roman/Latin script.';
            default: return 'Write in English.';
        }
    };

    // generateId already exists

    // Generate unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // AI Write Blog
    const handleAIWriteBlog = async () => {
        if (!aiTopic.trim() && !title.trim()) {
            alert('Please enter a topic or title first');
            return;
        }

        const topic = aiTopic.trim() || title.trim();
        setIsGenerating(true);

        try {
            const languageInstruction = getLanguageInstruction();

            const response = await generateText(
                `Write a professional, engaging blog post about: "${topic}"

${languageInstruction}

IMPORTANT FORMATTING RULES:
- DO NOT use any markdown formatting like ##, ###, **, *, etc.
- DO NOT include section titles or headings. Write ONLY the paragraph content.
- Separate paragraphs with double line breaks (\\n\\n).
- NO "Introduction:", "Paragraph 1:", or similar labels.

Requirements:
1. Write EXACTLY 6 well-structured paragraphs
2. Each paragraph should be 9-10 sentences long
3. Total length: 1000-1200 words
4. Write for the film/entertainment industry audience
5. Include specific film references (Classic, Modern, Indian, Bollywood)
6. Include practical insights and examples

Structure:
- Paragraph 1: Introduction
- Paragraph 2: Historical Context
- Paragraph 3: Technical Details
- Paragraph 4: Film References
- Paragraph 5: Current Trends
- Paragraph 6: Conclusion

Output ONLY the raw blog content paragraphs separated by blank lines.`,
                'Blog Writing'
            );

            if (response.error) {
                throw new Error(response.error);
            }

            if (response.text) {
                if (!title.trim()) {
                    setTitle(topic);
                }

                // Create content blocks with images
                const headerImage = getRelevantImage(topic);
                const midImage = getRelevantImage(topic);

                // Clean up the text - remove any remaining markdown
                let cleanText = response.text
                    .replace(/^#+\s*/gm, '')
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/^[-•]\s*/gm, '')
                    .trim();

                // Split into paragraphs
                const paragraphs = cleanText.split('\n\n').filter(p => p.trim());

                const newBlocks: ContentBlock[] = [
                    { id: generateId(), type: 'image', content: headerImage }
                ];

                paragraphs.forEach((para, idx) => {
                    newBlocks.push({ id: generateId(), type: 'text', content: para.trim() });

                    // Add image after 2nd paragraph
                    if (idx === 1) {
                        newBlocks.push({ id: generateId(), type: 'image', content: midImage });
                    }
                });

                setContentBlocks(newBlocks);
                setShowAIPanel(false);
                setAiTopic('');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            alert('Failed to generate blog. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // AI Enhance Content
    const handleAIEnhance = async () => {
        const textContent = contentBlocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n');
        if (!textContent.trim()) {
            alert('Please write some content first');
            return;
        }

        setIsEnhancing(true);

        try {
            const languageInstruction = getLanguageInstruction();

            const response = await generateText(
                `Enhance and improve this blog content. Make it more engaging, professional, and polished.
Keep the same topic and structure but improve the writing quality.
${languageInstruction}

IMPORTANT: Write in plain paragraphs only. NO markdown, NO ##, NO **, NO bullets.

Original content:
${textContent}

Output ONLY the enhanced content with paragraphs separated by blank lines.`,
                'Blog Enhancement'
            );

            if (response.error) {
                throw new Error(response.error);
            }

            if (response.text) {
                let cleanText = response.text
                    .replace(/^#+\s*/gm, '')
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/^[-•]\s*/gm, '')
                    .trim();

                const paragraphs = cleanText.split('\n\n').filter(p => p.trim());

                // Keep images, replace text blocks
                const imageBlocks = contentBlocks.filter(b => b.type === 'image');
                const newBlocks: ContentBlock[] = [];

                if (imageBlocks[0]) {
                    newBlocks.push(imageBlocks[0]);
                }

                paragraphs.forEach((para, idx) => {
                    newBlocks.push({ id: generateId(), type: 'text', content: para.trim() });

                    if (idx === 1 && imageBlocks[1]) {
                        newBlocks.push(imageBlocks[1]);
                    }
                });

                setContentBlocks(newBlocks);
            }
        } catch (error) {
            console.error('AI enhance error:', error);
            alert('Failed to enhance content. Please try again.');
        } finally {
            setIsEnhancing(false);
        }
    };

    // AI Generate Image
    const handleAIGenerateImage = async () => {
        if (!aiImagePrompt.trim()) {
            alert('Please describe the image you want');
            return;
        }

        setIsGeneratingImage(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const randomImage = getRelevantImage(aiImagePrompt);

            setContentBlocks(prev => [
                ...prev,
                { id: generateId(), type: 'image', content: randomImage }
            ]);

            setShowAIImageModal(false);
            setAiImagePrompt('');
        } catch (error) {
            console.error('AI image error:', error);
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await uploadFile(file);
            if (result.url) {
                setContentBlocks(prev => [
                    ...prev,
                    { id: generateId(), type: 'image', content: result.url! }
                ]);
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Update text block
    const updateTextBlock = (id: string, content: string) => {
        setContentBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, content } : block
        ));
    };

    // Delete block
    const deleteBlock = (id: string) => {
        setContentBlocks(prev => prev.filter(block => block.id !== id));
    };

    // Add text block
    const addTextBlock = () => {
        setContentBlocks(prev => [
            ...prev,
            { id: generateId(), type: 'text', content: '' }
        ]);
    };

    // Update image size
    const updateImageSize = (id: string, size: 'small' | 'medium' | 'large' | 'full') => {
        setContentBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, imageSize: size } : block
        ));
    };

    // Update image alignment
    const updateImageAlign = (id: string, align: 'left' | 'center' | 'right') => {
        setContentBlocks(prev => prev.map(block =>
            block.id === id ? { ...block, imageAlign: align } : block
        ));
    };

    // Move block up
    const moveBlockUp = (index: number) => {
        if (index === 0) return;
        setContentBlocks(prev => {
            const newBlocks = [...prev];
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
            return newBlocks;
        });
    };

    // Move block down
    const moveBlockDown = (index: number) => {
        setContentBlocks(prev => {
            if (index >= prev.length - 1) return prev;
            const newBlocks = [...prev];
            [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
            return newBlocks;
        });
    };

    // Get image size classes
    const getImageSizeClass = (size?: string) => {
        switch (size) {
            case 'small': return 'max-w-xs';
            case 'medium': return 'max-w-md';
            case 'large': return 'max-w-2xl';
            default: return 'w-full';
        }
    };

    // Get image align classes - using float for text wrapping like Word
    const getImageAlignClass = (align?: string) => {
        switch (align) {
            case 'left': return 'float-left mr-4 mb-4';
            case 'right': return 'float-right ml-4 mb-4';
            default: return 'mx-auto clear-both';
        }
    };

    // Save/Publish
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Please add a title');
            return;
        }
        const hasContent = contentBlocks.some(b => b.type === 'text' && b.content.trim());
        if (!hasContent) {
            toast.error('Please add some content');
            return;
        }

        if (!currentUser) {
            toast.info('Please login to publish your blog');
            return;
        }

        setIsSaving(true);

        try {
            // Prepare content blocks for saving (convert to service format)
            const blocksToSave = contentBlocks.map(block => ({
                id: block.id,
                type: block.type,
                content: block.content,
                ...(block.imageSize && { imageSize: block.imageSize }),
                ...(block.imageAlign && { imageAlign: block.imageAlign })
            }));

            const result = await blogService.createBlog({
                title: title.trim(),
                contentBlocks: blocksToSave,
                category,
                language,
                authorId: currentUser.uid,
                author: currentUser.displayName || 'Anonymous',
                authorPhoto: currentUser.photoURL || undefined
            });

            if (result.success) {
                toast.success('Blog published successfully!');
                navigate('/blogs-events');
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving blog:', error);
            toast.error('Failed to publish blog. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedLang = languages.find(l => l.name === language) || languages[0];

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white font-sans">
            {/* Hidden file input for replacing images */}
            <input
                ref={replaceImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleReplaceImageUpload}
                className="hidden"
            />

            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-black sticky top-0 z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold">{isCreateMode ? 'Create Blog' : 'Edit Blog'}</h1>

                {/* Right side buttons */}
                <div className="flex items-center gap-2">
                    {/* AI Glitter Button */}
                    <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${showAIPanel
                            ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30'
                            : 'hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600'
                            }`}
                    >
                        <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </button>

                    {/* Language Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <span>{selectedLang.flag}</span>
                            <span className="text-xs font-medium">{selectedLang.code.toUpperCase()}</span>
                            <span className="material-symbols-outlined text-sm">expand_more</span>
                        </button>

                        {/* Language Dropdown */}
                        {showLanguageMenu && (
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
                                    <p className="text-xs font-semibold text-zinc-500 px-2">Select Language</p>
                                </div>
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.name);
                                            setShowLanguageMenu(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${language === lang.name ? 'bg-purple-50 dark:bg-purple-900/30' : ''
                                            }`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="text-sm flex-1">{lang.name}</span>
                                        {language === lang.name && (
                                            <span className="material-symbols-outlined text-purple-600 text-sm">check_circle</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* AI Writing Panel */}
            {showAIPanel && (
                <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-b border-purple-200 dark:border-purple-800 p-4 animate-in slide-in-from-top">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <span className="font-bold">AI Blog Writer</span>
                            <span className="ml-auto text-sm bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded-full">
                                {selectedLang.flag} {selectedLang.name}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={aiTopic}
                                onChange={(e) => setAiTopic(e.target.value)}
                                placeholder="Enter a topic (e.g., 'The future of AI in filmmaking')"
                                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleAIWriteBlog}
                                disabled={isGenerating}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Writing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">edit_note</span>
                                        Write Blog
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-sm text-purple-600 dark:text-purple-400">
                            ✨ AI will write your blog with relevant images automatically!
                        </p>
                    </div>
                </div>
            )}

            {/* Author Info */}
            <div className="px-6 pt-4 flex items-center gap-3">
                <img
                    src={currentUser?.photoURL || 'https://ui-avatars.com/api/?name=User&background=random'}
                    alt="Author"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-200 dark:ring-purple-800"
                />
                <div>
                    <p className="font-semibold text-sm">{currentUser?.displayName || 'Anonymous'}</p>
                    <p className="text-xs text-zinc-500">Writing in {selectedLang.name}</p>
                </div>
            </div>

            {/* Category */}
            <div className="px-6 pt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${category === cat
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <main
                ref={editorRef}
                className="flex-1 px-6 pt-4 pb-40"
            >
                {/* Title */}
                <div className="relative group mb-8">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your blog title..."
                        className="w-full text-2xl md:text-3xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 p-0 pr-32"
                    />

                    {title.trim().length > 3 && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
                            <button
                                onClick={handleAIWriteBlog}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                {isGenerating ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                                )}
                                {isGenerating ? 'Writing...' : 'AI Write'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Blocks - using flow layout for text wrapping */}
                <div className="prose prose-lg max-w-none">
                    {contentBlocks.map((block, idx) => (
                        <div key={block.id} className={`group ${block.type === 'image' ? '' : 'mb-4'}`}>
                            {block.type === 'image' ? (
                                <div className={`relative ${getImageAlignClass(block.imageAlign)}`}>
                                    <div className={`relative rounded-xl overflow-hidden ${getImageSizeClass(block.imageSize)}`}>
                                        <PostMedia
                                            src={block.content}
                                            fallbackType="GENERAL"
                                            className="w-full h-auto rounded-xl shadow-lg"
                                        />

                                        {/* Image Controls Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl p-3 space-y-3">
                                                {/* Size Controls */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-zinc-500 mr-2">Size:</span>
                                                    {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                                                        <button
                                                            key={size}
                                                            onClick={() => updateImageSize(block.id, size)}
                                                            className={`px-2 py-1 text-xs rounded-lg transition-all ${(block.imageSize || 'full') === size
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                                                                }`}
                                                        >
                                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Alignment Controls - Text wrapping */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs text-zinc-500 mr-2">Wrap:</span>
                                                    {(['left', 'center', 'right'] as const).map((align) => (
                                                        <button
                                                            key={align}
                                                            onClick={() => updateImageAlign(block.id, align)}
                                                            title={align === 'center' ? 'No wrap (center)' : `Text wraps ${align === 'left' ? 'right of image' : 'left of image'}`}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${(block.imageAlign || 'center') === align
                                                                ? 'bg-purple-600 text-white'
                                                                : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                                                                }`}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">
                                                                {align === 'left' ? 'format_image_left' : align === 'right' ? 'format_image_right' : 'format_align_center'}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Move & Delete Controls */}
                                                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => moveBlockUp(idx)}
                                                            disabled={idx === 0}
                                                            className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move up"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                                        </button>
                                                        <button
                                                            onClick={() => moveBlockDown(idx)}
                                                            disabled={idx === contentBlocks.length - 1}
                                                            className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Move down"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {/* Regenerate button */}
                                                        <button
                                                            onClick={() => regenerateImage(block.id)}
                                                            className="px-2.5 py-1.5 bg-fuchsia-500 text-white rounded-lg text-xs font-medium hover:bg-fuchsia-600 flex items-center gap-1"
                                                            title="Generate a new image"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">autorenew</span>
                                                            Regenerate
                                                        </button>
                                                        {/* Replace button */}
                                                        <button
                                                            onClick={() => {
                                                                setReplacingImageId(block.id);
                                                                replaceImageInputRef.current?.click();
                                                            }}
                                                            className="px-2.5 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 flex items-center gap-1"
                                                            title="Upload replacement image"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">upload</span>
                                                            Replace
                                                        </button>
                                                        {/* Delete button */}
                                                        <button
                                                            onClick={() => deleteBlock(block.id)}
                                                            className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 flex items-center gap-1"
                                                            title="Delete image"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => updateTextBlock(block.id, e.currentTarget.innerHTML)}
                                        dangerouslySetInnerHTML={{ __html: block.content }}
                                        className="w-full min-h-[60px] text-base md:text-lg leading-relaxed focus:outline-none focus:bg-zinc-50 dark:focus:bg-zinc-900 rounded-lg p-2 -ml-2"
                                        data-placeholder="Write a paragraph... (select text to format)"
                                    />
                                    {!block.content && (
                                        <span className="absolute top-2 left-0 text-zinc-400 pointer-events-none">
                                            {idx === 0 ? 'Start writing your story...' : 'Continue writing...'}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Clear floats at the end */}
                    <div className="clear-both" />
                </div>

                {/* Add New Block */}
                <div className="flex items-center gap-2 mt-6 clear-both">
                    <button
                        onClick={addTextBlock}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Add Paragraph
                    </button>
                    <button
                        onClick={() => setShowAIImageModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        Add AI Image
                    </button>
                </div>
            </main>

            {/* AI Image Modal */}
            {showAIImageModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-white">image</span>
                                    </div>
                                    <h3 className="text-lg font-bold">AI Image Generator</h3>
                                </div>
                                <button
                                    onClick={() => setShowAIImageModal(false)}
                                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>

                            <textarea
                                value={aiImagePrompt}
                                onChange={(e) => setAiImagePrompt(e.target.value)}
                                placeholder="Describe the image you want..."
                                className="w-full h-24 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-fuchsia-500 resize-none"
                            />

                            <div className="flex flex-wrap gap-2">
                                {['🎬 Film Set', '🎞️ Editing', '🌟 Premiere', '🤖 AI Tech'].map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => setAiImagePrompt(preset.substring(2))}
                                        className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleAIGenerateImage}
                                disabled={isGeneratingImage || !aiImagePrompt.trim()}
                                className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGeneratingImage ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        Generate Image
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-zinc-100 dark:border-zinc-800 p-4 pb-8 z-10">
                <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex flex-col items-center gap-1 text-zinc-500 hover:text-orange-500 transition-colors px-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                            <span className="material-symbols-outlined text-xl">{isUploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
                        </div>
                        <span className="text-[10px] font-medium">Upload</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                    <button onClick={() => setShowAIImageModal(true)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-fuchsia-500 transition-colors px-2">
                        <div className="w-10 h-10 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 flex items-center justify-center text-fuchsia-500">
                            <span className="material-symbols-outlined text-xl">auto_awesome</span>
                        </div>
                        <span className="text-[10px] font-medium">AI Image</span>
                    </button>

                    <button onClick={() => setShowAIPanel(true)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-purple-500 transition-colors px-2">
                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                            <span className="material-symbols-outlined text-xl">edit_note</span>
                        </div>
                        <span className="text-[10px] font-medium">AI Write</span>
                    </button>

                    <button
                        onClick={handleAIEnhance}
                        disabled={isEnhancing}
                        className="flex flex-col items-center gap-1 text-zinc-500 hover:text-cyan-500 transition-colors disabled:opacity-50 px-2"
                    >
                        <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-500">
                            <span className={`material-symbols-outlined text-xl ${isEnhancing ? 'animate-spin' : ''}`}>
                                {isEnhancing ? 'progress_activity' : 'auto_fix_high'}
                            </span>
                        </div>
                        <span className="text-[10px] font-medium">{isEnhancing ? 'Working...' : 'Enhance'}</span>
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving}
                        className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:scale-95 text-white rounded-full font-bold text-sm shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 ml-2 disabled:opacity-50 disabled:from-zinc-400 disabled:to-zinc-500"
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                Publishing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">publish</span>
                                Publish
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
