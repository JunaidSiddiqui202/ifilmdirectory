import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/storageService';
import PortfolioAnalysisModal from '../components/PortfolioAnalysisModal';
import AIButton from '../components/AIButton';
import AIEnhancedTextarea from '../components/AIEnhancedTextarea';
import { createPost } from '../services/postService';
import { showreelService } from '../services/showreelService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUserProfile } from '../services/userService';
import { Timestamp } from 'firebase/firestore';
import PostMedia from '../components/PostMedia';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';

import SuccessModal from '../components/SuccessModal';
import { useToast } from '../context/ToastContext';

type PrivacyOption = 'public' | 'network' | 'private';

export default function UploadShowreel() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const toast = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>(['Actor', 'Commercial']);
    const [newTag, setNewTag] = useState('');
    const [privacy, setPrivacy] = useState<PrivacyOption>('network');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadType, setUploadType] = useState<'file' | 'embed'>('embed');
    const [embedUrl, setEmbedUrl] = useState('');
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [videoOrientation, setVideoOrientation] = useState<'vertical' | 'horizontal' | null>(null);

    // Professional Links for Enhanced AI Analysis
    const [imdbUrl, setImdbUrl] = useState('');
    const [wikipediaUrl, setWikipediaUrl] = useState('');
    const [cvFile, setCvFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setSelectedFile(file);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!tags.includes(newTag.trim())) {
                setTags([...tags, newTag.trim()]);
            }
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleUpload = async () => {
        if (uploadType === 'file' && (!selectedFile || !title.trim())) {
            toast.error('Please select a video and enter a title');
            return;
        }

        if (uploadType === 'embed' && (!embedUrl.trim() || !title.trim())) {
            toast.error('Please enter a video URL and a title');
            return;
        }

        if (!currentUser) {
            toast.info('Please login to upload your work');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10); // Start progress

        try {
            let finalUrl = embedUrl;

            if (uploadType === 'file' && selectedFile) {
                // Upload to Cloudinary
                setUploadProgress(30);
                const response = await uploadFile(selectedFile);

                if (response.error || !response.url) {
                    toast.error(response.error || 'Upload failed');
                    setIsUploading(false);
                    return;
                }

                finalUrl = response.url;
                setUploadProgress(70);
            }

            // Get user profile for author info
            const userProfile = await getUserProfile(currentUser.uid);
            setUploadProgress(80);

            // Create post content with video embed
            const postContent = description.trim()
                ? `${description}\n\n🎬 ${title}${tags.length > 0 ? '\n\n#' + tags.join(' #') : ''}`
                : `🎬 ${title}${tags.length > 0 ? '\n\n#' + tags.join(' #') : ''}`;

            // 1. Save as a post to the main Showcase feed
            await createPost({
                author: userProfile?.displayName || currentUser.displayName || 'Anonymous',
                authorId: currentUser.uid,
                authorImage: userProfile?.photoURL || currentUser.photoURL || '',
                role: userProfile?.role || 'Professional',
                authorVerified: userProfile?.verification?.status === 'verified' || userProfile?.verification_tier === 'gold' || userProfile?.verification_tier === 'blue',
                content: postContent,
                images: [finalUrl],
                likes: 0,
                comments: 0,
                createdAt: Timestamp.now()
            });

            // 2. Save to Showreels collection for the Reel feed
            let thumbnail = 'https://images.unsplash.com/photo-1485846234645-a62644ef7467?w=800'; // Default movie placeholder

            // Try to get YouTube thumbnail if applicable
            if (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) {
                const videoIdMatch = finalUrl.match(/(?:v=|\/shorts\/|youtu\.be\/)([^&?\/]+)/);
                if (videoIdMatch && videoIdMatch[1]) {
                    thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
                }
            }

            await showreelService.createShowreel({
                title: title,
                creator: userProfile?.displayName || currentUser.displayName || 'Anonymous',
                creatorId: currentUser.uid,
                creatorPhoto: userProfile?.photoURL || currentUser.photoURL || '',
                videoUrl: finalUrl,
                type: uploadType === 'file' ? 'video' : 'embed',
                thumbnail: thumbnail,
                category: tags[0] || 'Showreel'
            });

            setUploadProgress(100);

            // Success!
            setIsUploading(false);
            setShowSuccessModal(true);

        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed. Please try again.');
            setIsUploading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white transition-colors pb-32">
            {/* Unified Responsive Cinema Header */}
            <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#090A0C]/85 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 sm:px-6 py-3 transition-colors">
                <div className="max-w-2xl lg:max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex size-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                            title="Go Back"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>
                        <HamburgerMenu />
                        <Logo />
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold tracking-wide">
                            <span className="material-symbols-outlined text-xs">video_call</span>
                            Upload Work
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle Button (Mobile only) */}
                        <button
                            onClick={toggleDarkMode}
                            className="flex md:hidden size-9 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 transition-all"
                            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="text-xs sm:text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-36 space-y-6">
                {/* Hero / Intro Card */}
                <div className="text-center max-w-lg mx-auto space-y-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">video_library</span>
                        <span>Creator & Talent Showreel Hub</span>
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        Upload Your Showreel
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Share your best performance, cinematography reel, or craft breakdown with casting directors and producers.
                    </p>
                </div>

                {/* Section 1: Video Media Source */}
                <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">movie</span>
                            <span>Video Source</span>
                        </h2>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Step 1 of 3</span>
                    </div>

                    {/* Segmented Control */}
                    <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/[0.04] p-1.5 border border-zinc-200 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => {
                                setUploadType('embed');
                                setSelectedFile(null);
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 h-full rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                uploadType === 'embed'
                                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">link</span>
                            <span>Embed Video (YouTube / Vimeo)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUploadType('file');
                                setEmbedUrl('');
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 h-full rounded-xl text-xs sm:text-sm font-bold transition-all ${
                                uploadType === 'file'
                                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">cloud_upload</span>
                            <span>Upload Video File</span>
                        </button>
                    </div>

                    {/* Embed Link Input */}
                    {uploadType === 'embed' && (
                        <div className="space-y-3">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Video URL *
                                </span>
                                <div className="relative">
                                    <input
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="https://www.youtube.com/watch?v=... or Vimeo"
                                        value={embedUrl}
                                        onChange={(e) => setEmbedUrl(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                                        smart_display
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    Supports YouTube Videos, YouTube Shorts, and Vimeo public streams.
                                </p>
                            </label>

                            {/* Embed Preview */}
                            {embedUrl && (
                                <div className="rounded-2xl overflow-hidden bg-black/5 dark:bg-black/40 border border-zinc-200 dark:border-white/10 shadow-inner">
                                    <PostMedia src={embedUrl} alt="Video preview" className="w-full" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Video Upload Area */}
                    {uploadType === 'file' && !selectedFile && !isUploading && (
                        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/10 px-6 py-10 hover:border-amber-500/50 bg-zinc-50/50 dark:bg-black/20 transition-colors text-center">
                            <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">upload_file</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-bold text-zinc-900 dark:text-white">
                                    Drag & drop or tap to select a video
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                                    MP4, MOV, or WebM format recommended. Max file size: 35MB.
                                </p>
                            </div>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95">
                                <span className="material-symbols-outlined text-base">folder_open</span>
                                <span>Browse Files</span>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    )}

                    {/* Video Preview & Progress (File) */}
                    {uploadType === 'file' && (selectedFile || isUploading) && (
                        <div className="relative w-full overflow-hidden rounded-2xl">
                            {selectedFile && !isUploading ? (
                                <>
                                    <div className="relative w-full aspect-[9/16] max-h-[460px] mx-auto bg-black rounded-2xl overflow-hidden shadow-lg">
                                        <video
                                            src={URL.createObjectURL(selectedFile)}
                                            className="w-full h-full object-contain"
                                            controls
                                            playsInline
                                            onLoadedMetadata={(e) => {
                                                const video = e.currentTarget;
                                                const isVertical = video.videoHeight > video.videoWidth;
                                                setVideoOrientation(isVertical ? 'vertical' : 'horizontal');
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setVideoOrientation(null);
                                            }}
                                            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-red-500 transition-colors z-10 border border-white/20"
                                            title="Remove Video"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                        <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-white text-xs font-bold truncate">{selectedFile.name}</p>
                                                <p className="text-white/70 text-[11px] mt-0.5">
                                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white shrink-0 uppercase tracking-wider">
                                                {videoOrientation || 'Video'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Orientation Warning */}
                                    {videoOrientation === 'horizontal' && (
                                        <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5">warning</span>
                                            <div className="flex-1 text-xs">
                                                <p className="font-bold text-amber-900 dark:text-amber-300">
                                                    Horizontal Video Detected
                                                </p>
                                                <p className="text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
                                                    For the best mobile showreel viewer experience, vertical 9:16 reels are recommended. Landscape videos will be centered with cinematic framing.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-44 w-full bg-zinc-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
                                    <div className="flex flex-col items-center gap-3 w-full max-w-xs px-4">
                                        <span className="material-symbols-outlined text-4xl text-amber-500 animate-pulse">cloud_upload</span>
                                        <div className="w-full">
                                            <div className="flex justify-between text-xs font-bold text-white mb-1.5">
                                                <span>Uploading Media...</span>
                                                <span className="text-amber-400">{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-white/60 text-[11px]">Please keep this page open</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Section 2: Showreel Details */}
                <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">edit_note</span>
                            <span>Showreel Details</span>
                        </h2>
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Step 2 of 3</span>
                    </div>

                    {/* Title */}
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            Showreel Title *
                        </span>
                        <input
                            className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="e.g. Lead Dramatic Monologue Reel 2025 or DOP Action Showreel"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    {/* Description */}
                    <div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                            Description & Film Credits
                        </span>
                        <AIEnhancedTextarea
                            label=""
                            context="Showreel Description"
                            value={description}
                            onValueChange={setDescription}
                            placeholder="Detail your roles, directors worked with, film projects, gear used, or standout scenes..."
                            rows={4}
                        />
                    </div>

                    {/* Tags */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Craft & Role Tags
                            </span>
                            <span className="text-[11px] text-zinc-400">Press Enter to add</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/30 p-2.5 focus-within:border-amber-500 transition-colors">
                            {tags.map((tag) => (
                                <div key={tag} className="flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                                    <span>#{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-amber-600 dark:text-amber-400/80 hover:text-amber-800 dark:hover:text-amber-200 transition-colors ml-0.5"
                                    >
                                        <span className="material-symbols-outlined !text-sm leading-none">close</span>
                                    </button>
                                </div>
                            ))}
                            <input
                                className="flex-1 min-w-[120px] bg-transparent px-2 py-1 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
                                placeholder="Add role tag (e.g., DOP, Editor, Fight Choreographer)..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: Professional Profiles & AI Analysis */}
                <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">verified</span>
                            <span>Industry Proof & AI Audit</span>
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                            Enhanced
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Link your verified IMDb, Wikipedia, or CV to unlock intelligent portfolio benchmarking.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        {/* IMDb Profile */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-amber-500 text-sm">movie</span>
                                <span>IMDb Profile</span>
                            </span>
                            <input
                                className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="https://www.imdb.com/name/nm..."
                                value={imdbUrl}
                                onChange={(e) => setImdbUrl(e.target.value)}
                            />
                        </label>

                        {/* Wikipedia Profile */}
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sky-500 text-sm">article</span>
                                <span>Wikipedia / Press</span>
                            </span>
                            <input
                                className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                placeholder="https://en.wikipedia.org/wiki/..."
                                value={wikipediaUrl}
                                onChange={(e) => setWikipediaUrl(e.target.value)}
                            />
                        </label>
                    </div>

                    {/* CV/Resume Upload */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-emerald-500 text-sm">description</span>
                            <span>Resume / Portfolio Document</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-between h-11 px-3.5 border border-dashed border-zinc-300 dark:border-white/15 rounded-xl text-zinc-500 dark:text-zinc-400 hover:border-amber-500 hover:text-amber-500 transition-colors cursor-pointer bg-zinc-50 dark:bg-black/30">
                                <span className="flex items-center gap-2 text-xs truncate">
                                    <span className="material-symbols-outlined text-base">upload_file</span>
                                    <span className="font-medium truncate">{cvFile ? cvFile.name : 'Upload CV / Bio (PDF, DOC)'}</span>
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/10 uppercase tracking-wider text-zinc-700 dark:text-zinc-300 shrink-0">
                                    {cvFile ? 'Change' : 'Choose'}
                                </span>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) setCvFile(file);
                                    }}
                                    className="hidden"
                                />
                            </label>
                            {cvFile && (
                                <button
                                    type="button"
                                    onClick={() => setCvFile(null)}
                                    className="size-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                                    title="Remove document"
                                >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* AI Analysis Card */}
                    {(title.trim() || description.trim()) && (
                        <div className="rounded-2xl p-4 bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                            <div className="flex items-start gap-2.5">
                                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl shrink-0 mt-0.5">auto_awesome</span>
                                <div>
                                    <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                                        AI Showreel Feedback
                                    </h4>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Analyze credits, pacing, and keywords for casting director search engines.
                                    </p>
                                </div>
                            </div>
                            <AIButton
                                onClick={() => setShowAnalysisModal(true)}
                                label="Audit My Reel"
                                variant="primary"
                                className="shrink-0"
                            />
                        </div>
                    )}
                </section>

                {/* Section 4: Privacy Settings */}
                <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">lock</span>
                            <span>Audience & Privacy</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] p-1.5 border border-zinc-200 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => setPrivacy('public')}
                            className={`rounded-xl py-2.5 text-center text-xs font-bold transition-all ${
                                privacy === 'public'
                                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Public
                        </button>
                        <button
                            type="button"
                            onClick={() => setPrivacy('network')}
                            className={`rounded-xl py-2.5 text-center text-xs font-bold transition-all ${
                                privacy === 'network'
                                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Industry Only
                        </button>
                        <button
                            type="button"
                            onClick={() => setPrivacy('private')}
                            className={`rounded-xl py-2.5 text-center text-xs font-bold transition-all ${
                                privacy === 'private'
                                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            Private Link
                        </button>
                    </div>
                </section>
            </main>

            {/* Sticky Footer Button */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#090A0C]/90 p-4 pb-6 backdrop-blur-xl z-30 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="max-w-2xl lg:max-w-3xl mx-auto">
                    <button
                        onClick={handleUpload}
                        disabled={
                            (uploadType === 'file' && !selectedFile) ||
                            (uploadType === 'embed' && !embedUrl) ||
                            !title.trim() ||
                            isUploading
                        }
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-amber-500 py-3.5 text-base font-black text-black disabled:cursor-not-allowed disabled:opacity-40 hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
                    >
                        <span className="truncate">{isUploading ? 'Uploading Work...' : 'Publish Showreel'}</span>
                    </button>
                </div>
            </div>

            {/* Portfolio Analysis Modal */}
            <PortfolioAnalysisModal
                isOpen={showAnalysisModal}
                onClose={() => setShowAnalysisModal(false)}
                showreelData={{
                    title,
                    description,
                    duration: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : undefined,
                    category: tags[0],
                    userRole: tags.includes('Actor') ? 'Actor' : tags.includes('Director') ? 'Director' : 'Professional',
                    // Professional Links for Enhanced Analysis
                    imdbUrl: imdbUrl || undefined,
                    wikipediaUrl: wikipediaUrl || undefined,
                    cvFileName: cvFile?.name
                }}
                onApplySuggestions={(suggestions) => {
                    // Apply AI suggestions to description
                    const improvedDescription = description + '\n\nAI Suggestions:\n' + suggestions.join('\n');
                    setDescription(improvedDescription);
                }}
            />

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    navigate('/showcase');
                }}
                title="Showreel Live!"
                message="Your work has been uploaded and is now visible in the Showcase feed for everyone to see."
                actionLabel="Go to Showcase"
            />
        </div>
    );
}
