import { useState } from 'react';

interface AIImageGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (imageUrl: string) => void;
}

export default function AIImageGeneratorModal({ isOpen, onClose, onGenerate }: AIImageGeneratorModalProps) {
    const [provider, setProvider] = useState('Google Imagen');
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('Realistic');
    const [aspectRatio, setAspectRatio] = useState('16:9 Landscape');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = () => {
        setLoading(true);
        // Generate unique image using Picsum Photos with timestamp-based seed
        setTimeout(() => {
            setLoading(false);
            // Create unique seed from prompt and timestamp
            const seed = prompt
                ? `${prompt.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`
                : `blog-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

            // Use Picsum Photos for varied, royalty-free images
            const imageUrl = `https://picsum.photos/seed/${seed}/800/600`;

            console.log('[AI Image] Generated:', imageUrl);
            onGenerate(imageUrl);
            onClose();
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 border-t sm:border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">AI Image Generator</h3>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Icon */}
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-16 h-16 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 mb-2">
                            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">AI Image Generator</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">Create custom images for your blog using AI</p>
                    </div>

                    {/* AI Provider */}
                    <div className="space-y-3">
                        <label className="text-lg font-bold text-zinc-900 dark:text-white">AI Provider</label>
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                            {['Google Imagen', 'DALL-E', 'Stable Diffusion'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setProvider(p)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${provider === p
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Prompt */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-lg font-bold text-zinc-900 dark:text-white">Image Prompt</label>
                            <button className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600">
                                <span className="material-symbols-outlined text-base">lightbulb</span>
                                Suggest
                            </button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-32 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-none focus:ring-2 focus:ring-fuchsia-500 resize-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
                            placeholder="Describe the image you want to create..."
                        />
                        <p className="text-sm text-zinc-500">Describe the image you want to create for your blog</p>
                    </div>

                    {/* Style */}
                    <div className="space-y-3">
                        <label className="text-lg font-bold text-zinc-900 dark:text-white">Style</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { name: 'Realistic', icon: 'image' },
                                { name: 'Cinematic', icon: 'movie' },
                                { name: 'Artistic', icon: 'palette' }
                            ].map((s) => (
                                <button
                                    key={s.name}
                                    onClick={() => setStyle(s.name)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${style === s.name
                                        ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300'
                                        : 'border-transparent bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                    <span className="text-sm font-medium">{s.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-3 pb-20">
                        <label className="text-lg font-bold text-zinc-900 dark:text-white">Aspect Ratio</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {['16:9 Landscape', '4:3 Standard', '1:1 Square', '9:16 Portrait'].map((ratio) => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full border transition-all ${aspectRatio === ratio
                                        ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                                        }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="sticky bottom-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className="w-full py-4 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-lg shadow-lg shadow-fuchsia-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
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
    );
}
