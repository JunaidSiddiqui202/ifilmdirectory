import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/storageService';
import PortfolioAnalysisModal from '../components/PortfolioAnalysisModal';
import AIButton from '../components/AIButton';
import AIEnhancedTextarea from '../components/AIEnhancedTextarea';
import { createPost } from '../services/postService';
import { showreelService } from '../services/showreelService';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import { Timestamp } from 'firebase/firestore';
import PostMedia from '../components/PostMedia';

import SuccessModal from '../components/SuccessModal';
import { useToast } from '../context/ToastContext';

type PrivacyOption = 'public' | 'network' | 'private';

export default function UploadShowreel() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
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
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                <div className="flex items-center p-4">
                    <div className="flex size-12 items-center justify-start">
                        <button
                            onClick={() => navigate(-1)}
                            className="hover:opacity-70 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-zinc-900 dark:text-white">arrow_back_ios_new</span>
                        </button>
                    </div>
                    <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">
                        Upload Work
                    </h2>
                    <div className="flex w-12 items-center justify-end">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-base font-bold leading-normal tracking-[0.015em] text-primary hover:opacity-80 transition-opacity"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                {/* Upload Type Toggle */}
                <div className="flex w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 p-1 mb-6">
                    <button
                        onClick={() => {
                            setUploadType('embed');
                            setSelectedFile(null);
                        }}
                        className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${uploadType === 'embed'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                    >
                        Embed Link (Recommended)
                    </button>
                    <button
                        onClick={() => {
                            setUploadType('file');
                            setEmbedUrl('');
                        }}
                        className={`flex-1 rounded-md py-2 text-sm font-bold transition-all ${uploadType === 'file'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                    >
                        Upload File
                    </button>
                </div>

                {/* Embed Link Input */}
                {uploadType === 'embed' && (
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-base font-medium leading-normal text-zinc-900 dark:text-white">Video Link</label>
                            <input
                                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-base font-normal leading-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:outline-0 focus:ring-0"
                                placeholder="Paste video link (YouTube, YouTube Shorts, Vimeo)..."
                                value={embedUrl}
                                onChange={(e) => setEmbedUrl(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Supports YouTube, YouTube Shorts, and Vimeo. Upload file for other video types.
                            </p>
                        </div>

                        {/* Embed Preview - Using PostMedia for proper rendering */}
                        {embedUrl && (
                            <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                                <PostMedia src={embedUrl} alt="Video preview" className="w-full" />
                            </div>
                        )}
                    </div>
                )}

                {/* Video Upload Area */}
                {uploadType === 'file' && !selectedFile && !isUploading && (
                    <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-14">
                        <div className="flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-4xl text-primary">upload_file</span>
                            <p className="text-center text-lg font-bold leading-tight tracking-[-0.015em] text-zinc-900 dark:text-white">
                                Tap to select a video
                            </p>
                            <p className="max-w-[480px] text-center text-sm font-normal leading-normal text-zinc-500 dark:text-zinc-400">
                                Select a video file to upload as your showreel.
                            </p>
                            <p className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-400/10 px-2 py-1 rounded">
                                Max size: 35MB
                            </p>
                        </div>
                        <label className="flex h-10 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-zinc-900 dark:bg-white px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white dark:text-black hover:opacity-90 transition-opacity">
                            <span className="truncate">Select Video</span>
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
                    <div className="relative mb-4 w-full overflow-hidden rounded-xl">
                        {selectedFile && !isUploading ? (
                            <>
                                <div className="relative w-full aspect-[9/16] max-h-[500px] mx-auto bg-black rounded-xl overflow-hidden">
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
                                        className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors z-10 border border-white/20"
                                    >
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                                        <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-white/70 text-xs mt-1">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                {/* Orientation Warning */}
                                {videoOrientation === 'horizontal' && (
                                    <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl shrink-0">warning</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-1">
                                                Horizontal Video Detected
                                            </p>
                                            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                                This video is in landscape (16:9) format. For the best viewing experience in the showreel viewer,
                                                we recommend using vertical (9:16) videos like TikTok or Instagram Reels.
                                                Horizontal videos will display with black bars on the sides.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-48 w-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-xl relative overflow-hidden">
                                <span className="material-symbols-outlined text-6xl text-white/50">videocam</span>
                                <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <p className="text-white text-base font-medium leading-normal">Uploading...</p>
                                            <p className="text-white text-sm font-normal leading-normal">{uploadProgress}%</p>
                                        </div>
                                        <div className="rounded-full bg-white/30">
                                            <div
                                                className="h-2 rounded-full bg-primary transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-white/80 text-sm font-normal leading-normal">Do not close the app</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Fields */}
                <div className="flex flex-col gap-6 pt-6">
                    {/* Title */}
                    <label className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-zinc-900 dark:text-white">Title</p>
                        <input
                            className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-base font-normal leading-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:outline-0 focus:ring-0"
                            placeholder="Enter showreel title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </label>

                    {/* Description */}
                    <AIEnhancedTextarea
                        label="Description"
                        context="Showreel Description"
                        value={description}
                        onValueChange={setDescription}
                        placeholder="Add a brief summary of your work"
                        rows={4}
                    />

                    {/* Professional Links Section - NEW! */}
                    <div className="flex flex-col gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                            <div>
                                <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Professional Links</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Add your profiles for more accurate AI analysis</p>
                            </div>
                        </div>

                        {/* IMDb Profile */}
                        <label className="flex flex-col">
                            <div className="flex items-center gap-2 pb-2">
                                <span className="material-symbols-outlined text-yellow-500 text-lg">movie</span>
                                <p className="text-base font-medium leading-normal text-zinc-900 dark:text-white">IMDb Profile (Optional)</p>
                            </div>
                            <input
                                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-base font-normal leading-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:outline-0 focus:ring-0"
                                placeholder="https://www.imdb.com/name/nm..."
                                value={imdbUrl}
                                onChange={(e) => setImdbUrl(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">AI will analyze your filmography, ratings, and roles</p>
                        </label>

                        {/* Wikipedia Profile */}
                        <label className="flex flex-col">
                            <div className="flex items-center gap-2 pb-2">
                                <span className="material-symbols-outlined text-blue-400 text-lg">article</span>
                                <p className="text-base font-medium leading-normal text-zinc-900 dark:text-white">Wikipedia Page (Optional)</p>
                            </div>
                            <input
                                className="form-input flex h-14 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 text-base font-normal leading-normal text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-primary focus:outline-0 focus:ring-0"
                                placeholder="https://en.wikipedia.org/wiki/..."
                                value={wikipediaUrl}
                                onChange={(e) => setWikipediaUrl(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">AI will analyze your career highlights and awards</p>
                        </label>

                        {/* CV/Resume Upload */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 pb-2">
                                <span className="material-symbols-outlined text-green-400 text-lg">description</span>
                                <p className="text-base font-medium leading-normal text-zinc-900 dark:text-white">CV/Resume (Optional)</p>
                            </div>
                            <div className="flex gap-2">
                                <label className="flex-1 flex items-center justify-center h-14 px-4 py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 dark:text-zinc-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-white dark:bg-zinc-900">
                                    <span className="material-symbols-outlined mr-2">upload_file</span>
                                    <span className="text-sm font-medium">
                                        {cvFile ? cvFile.name : 'Upload CV (PDF, DOC)'}
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
                                        onClick={() => setCvFile(null)}
                                        className="flex items-center justify-center w-14 h-14 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">AI will extract your experience, skills, and education</p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
                            <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-lg mt-0.5">info</span>
                            <div className="flex-1">
                                <p className="text-blue-700 dark:text-blue-300 text-sm font-bold mb-1">Why add these?</p>
                                <p className="text-blue-600 dark:text-blue-200 text-xs">
                                    AI will analyze your complete professional profile for more accurate insights,
                                    industry comparisons, and personalized recommendations based on your actual credits and experience.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Button */}
                    {(title.trim() || description.trim()) && (
                        <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 dark:from-primary/20 dark:to-purple-600/20 rounded-xl p-4 border border-primary/30">
                            <div className="flex items-start gap-3 mb-3">
                                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                                <div className="flex-1">
                                    <h4 className="text-zinc-900 dark:text-white font-bold mb-1">Get AI Feedback</h4>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Let AI analyze your portfolio and provide professional insights
                                    </p>
                                </div>
                            </div>
                            <AIButton
                                onClick={() => setShowAnalysisModal(true)}
                                label="Analyze My Portfolio"
                                variant="primary"
                                className="w-full justify-center"
                            />
                        </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-col">
                        <p className="pb-2 text-base font-medium leading-normal text-zinc-900 dark:text-white">Tags</p>
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 focus-within:border-primary">
                            {tags.map((tag) => (
                                <div key={tag} className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1">
                                    <span className="text-sm font-medium text-primary">{tag}</span>
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="text-primary/70 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined !text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                            <input
                                className="form-input flex-1 bg-transparent p-2 text-base text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-0 border-none"
                                placeholder="Add tags..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                            />
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="flex flex-col gap-3">
                        <p className="text-base font-medium leading-normal text-zinc-900 dark:text-white">Privacy</p>
                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1">
                            <button
                                onClick={() => setPrivacy('public')}
                                className={`rounded-lg py-2 text-center text-sm font-semibold transition-colors ${privacy === 'public'
                                    ? 'bg-primary text-background-dark'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                Public
                            </button>
                            <button
                                onClick={() => setPrivacy('network')}
                                className={`rounded-lg py-2 text-center text-sm font-semibold transition-colors ${privacy === 'network'
                                    ? 'bg-primary text-background-dark'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                Network Only
                            </button>
                            <button
                                onClick={() => setPrivacy('private')}
                                className={`rounded-lg py-2 text-center text-sm font-semibold transition-colors ${privacy === 'private'
                                    ? 'bg-primary text-background-dark'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                Private
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer Button */}
            <div className="fixed bottom-0 left-0 w-full bg-background-light/80 p-4 pb-8 dark:bg-background-dark/80 backdrop-blur-md z-30 border-t border-zinc-200/50 dark:border-white/5">
                <button
                    onClick={handleUpload}
                    disabled={
                        (uploadType === 'file' && !selectedFile) ||
                        (uploadType === 'embed' && !embedUrl) ||
                        !title.trim() ||
                        isUploading
                    }
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-primary py-4 text-base font-bold text-background-dark disabled:cursor-not-allowed disabled:bg-primary/50 disabled:text-background-dark/50 hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                    <span className="truncate">{isUploading ? 'Uploading...' : 'Upload Work'}</span>
                </button>
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
