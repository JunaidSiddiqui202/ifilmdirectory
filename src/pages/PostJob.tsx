import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AIEnhancedTextarea from '../components/AIEnhancedTextarea';
import CastingSuggestionsModal from '../components/CastingSuggestionsModal';
import AIButton from '../components/AIButton';
import { validateInput } from '../services/moderationService';
import { jobService } from '../services/jobService';
import { createPost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { getUserProfile } from '../services/userService';
import { useTheme } from '../context/ThemeContext';

import { uploadFile } from '../services/storageService';

export default function PostJob() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

    // Modes: 'select' | 'job' | 'post'
    const [creationMode, setCreationMode] = useState<'select' | 'job' | 'post'>('select');

    // --- Job State ---
    const [postType, setPostType] = useState<'Job' | 'Audition'>('Job');
    const [showCastingModal, setShowCastingModal] = useState(false);
    const [invitedActors, setInvitedActors] = useState<string[]>([]);
    const [jobFormData, setJobFormData] = useState({
        title: '',
        company: '',
        description: '',
        requirements: '',
        location: '',
        salary: '',
        deadline: '',
        email: '',
        gender: 'Any',
        ageRange: '',
        shootDate: '',
        daysRequired: '',
        imdb: '',
        wiki: '',
        videoUrl: ''
    });

    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // --- Post State ---
    const [postContent, setPostContent] = useState('');
    const [postImages, setPostImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // --- Job Attachment State ---
    const [jobAttachments, setJobAttachments] = useState<{ name: string; url: string }[]>([]);
    const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // --- Job Handlers ---
    const handleJobInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setJobFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleJobSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!jobFormData.title.trim() || !jobFormData.company.trim() || !jobFormData.location.trim() || !jobFormData.deadline) {
            setSuccessMessage("Please fill in all required fields (Title, Company, Location, Deadline).");
            setShowSuccessModal(true);
            return;
        }

        if (jobFormData.email && !validateEmail(jobFormData.email)) {
            setSuccessMessage("Please enter a valid email address.");
            setShowSuccessModal(true);
            return;
        }

        const descriptionError = validateInput(jobFormData.description);
        if (descriptionError) {
            setSuccessMessage(descriptionError);
            setShowSuccessModal(true);
            return;
        }

        if (!currentUser) {
            setSuccessMessage('You must be logged in to post a job.');
            setShowSuccessModal(true);
            return;
        }

        setLoading(true);

        try {
            const jobData: any = {
                title: jobFormData.title,
                company: jobFormData.company,
                description: jobFormData.description,
                requirements: jobFormData.requirements,
                location: jobFormData.location,
                salary: jobFormData.salary,
                deadline: jobFormData.deadline,
                type: postType,
                postedBy: currentUser.uid,
                applicationEmail: jobFormData.email,
                logo: currentUser.photoURL || 'https://via.placeholder.com/100',
                videoUrl: jobFormData.videoUrl || '',
                externalLinks: {
                    imdb: jobFormData.imdb || '',
                    wiki: jobFormData.wiki || ''
                }
            };

            // Only add audition-specific fields if it's an audition
            if (postType === 'Audition') {
                jobData.gender = jobFormData.gender || 'Any';
                jobData.ageRange = jobFormData.ageRange || '';
                jobData.shootDate = jobFormData.shootDate || '';
                jobData.daysRequired = jobFormData.daysRequired || '';
            }

            const result = await jobService.createJob(jobData);

            if (result.success) {
                setSuccessMessage('Job posted successfully!');
                setShowSuccessModal(true);
            } else {
                setSuccessMessage('Failed to post job. Please try again.');
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error posting job:', error);
            setSuccessMessage('An error occurred. Please try again.');
            setShowSuccessModal(true);
        } finally {
            setLoading(false);
        }
    };


    // --- Post Handlers ---
    const handlePostSubmit = async () => {
        if (!postContent.trim()) {
            alert("Please write something to post.");
            return;
        }

        if (!currentUser) {
            alert("You must be logged in.");
            return;
        }

        setLoading(true);
        try {
            const userProfile = await getUserProfile(currentUser.uid);

            await createPost({
                author: userProfile?.displayName || currentUser.displayName || 'Anonymous',
                authorId: currentUser.uid,
                authorImage: userProfile?.photoURL || currentUser.photoURL || '',
                role: userProfile?.role || 'Professional', // Fallback role
                authorVerified: userProfile?.verification?.status === 'verified' || userProfile?.verification_tier === 'gold' || userProfile?.verification_tier === 'blue',
                content: postContent,
                // Use the first image as 'image' for backward compatibility, and full array for 'images'
                image: postImages.length > 0 ? postImages[0] : undefined,
                images: postImages,
                likes: 0,
                comments: 0,
                createdAt: Timestamp.now()
            });

            alert("Posted to Showcase!");
            navigate('/showcase');
        } catch (error) {
            console.error("Error creating post:", error);
            alert("Failed to post.");
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---

    // 1. Selection Screen
    if (creationMode === 'select') {
        return (
            <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-24 transition-colors font-display">
                {/* Header */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#090A0C]/90 px-4 md:px-8 backdrop-blur-md">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all"
                        title="Back to Home"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="text-center">
                        <h1 className="text-base font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                            Create & Publish
                        </h1>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                            Choose what to broadcast across the industry
                        </p>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all active:scale-95"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                </header>

                <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                    <div className="text-center max-w-lg mx-auto mb-8 space-y-1.5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">hub</span>
                            <span>Creator & Industry Studio Hub</span>
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                            What would you like to share?
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                            Broadcast to over thousands of verified filmmakers, cast, and technicians.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Post Job / Audition Call */}
                        <button
                            onClick={() => setCreationMode('job')}
                            className="flex flex-col text-left p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121316] border border-amber-500/30 hover:border-amber-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                            <div className="size-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">work</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Recruiter & Casting Call</span>
                            </span>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1.5">
                                Post Job / Audition Call
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                Recruit verified cast, technicians, directors, DOPs, editors, and production crew for your next film.
                            </p>
                            <div className="mt-auto flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                                <span>Start Casting Wizard</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </button>

                        {/* Option 2: Share Update */}
                        <button
                            onClick={() => setCreationMode('post')}
                            className="flex flex-col text-left p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-sky-500/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all" />
                            <div className="size-14 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">edit_note</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
                                Community Broadcast
                            </span>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1.5">
                                Share Showcase Update
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                Post behind-the-scenes thoughts, stills, production updates, or milestones to the Showcase feed.
                            </p>
                            <div className="mt-auto flex items-center gap-1 text-xs font-black text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
                                <span>Create Post</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </button>

                        {/* Option 3: Upload Showreel / Work */}
                        <button
                            onClick={() => navigate('/showreel/upload')}
                            className="flex flex-col text-left p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-purple-500/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all" />
                            <div className="size-14 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">video_library</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                                Portfolio & Media
                            </span>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1.5">
                                Upload Showreel / Portfolio
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                Upload acting clips, DOP showreels, VFX breakdowns, or music tracks to gain direct bookings.
                            </p>
                            <div className="mt-auto flex items-center gap-1 text-xs font-black text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                                <span>Upload Media</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </button>

                        {/* Option 4: Write Article / Blog */}
                        <button
                            onClick={() => navigate('/create-blog')}
                            className="flex flex-col text-left p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-fuchsia-500/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl group-hover:bg-fuchsia-500/15 transition-all" />
                            <div className="size-14 rounded-2xl bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">article</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 mb-1">
                                Editorial & Insights
                            </span>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1.5">
                                Write Film Article / Blog
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                                Share cinema reviews, filmmaking breakdown techniques, and industry perspectives.
                            </p>
                            <div className="mt-auto flex items-center gap-1 text-xs font-black text-fuchsia-600 dark:text-fuchsia-400 group-hover:translate-x-1 transition-transform">
                                <span>Write Article</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </div>
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // 2. Post Creation Mode
    if (creationMode === 'post') {
        // Validate if URL points to an image
        const isValidImageUrl = (url: string): boolean => {
            const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
            const cloudinaryImageUrl = /res\.cloudinary\.com.*\/(image|video)\/upload/i;
            const unsplashUrl = /images\.unsplash\.com/i;
            const imgurUrl = /(i\.)?imgur\.com/i;

            return imageExtensions.test(url) ||
                cloudinaryImageUrl.test(url) ||
                unsplashUrl.test(url) ||
                imgurUrl.test(url) ||
                url.includes('/image/') ||
                url.includes('image%2F');
        };

        const handleAddImage = () => {
            const trimmedUrl = newImageUrl.trim();
            if (trimmedUrl) {
                if (postImages.length >= 10) {
                    alert("You can only add up to 10 images.");
                    return;
                }

                // Validate URL format
                try {
                    new URL(trimmedUrl);
                } catch {
                    alert("Please enter a valid URL.");
                    return;
                }

                // Check if it looks like an image URL
                if (!isValidImageUrl(trimmedUrl)) {
                    const confirmAdd = window.confirm(
                        "This URL doesn't appear to be a direct image link. Image URLs typically end with .jpg, .png, .gif, etc.\n\nIf you want to share a link to a webpage, include it in your post text instead.\n\nDo you still want to add this as an image?"
                    );
                    if (!confirmAdd) {
                        return;
                    }
                }

                setPostImages([...postImages, trimmedUrl]);
                setNewImageUrl('');
            }
        };

        const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            if (postImages.length + files.length > 10) {
                alert("You can only add up to 10 images.");
                return;
            }

            setIsUploadingImages(true);
            try {
                const remainingSlots = 10 - postImages.length;
                const filesToUpload = Array.from(files).slice(0, remainingSlots);

                const uploadedUrls: string[] = [];
                for (const file of filesToUpload) {
                    console.log('Uploading file:', file.name);
                    const result = await uploadFile(file);
                    if (result.url) {
                        uploadedUrls.push(result.url);
                    } else if (result.error) {
                        console.error('Upload error for file:', file.name, result.error);
                    }
                }

                if (uploadedUrls.length > 0) {
                    setPostImages(prev => [...prev, ...uploadedUrls]);
                } else {
                    alert("No images were uploaded. Please try again.");
                }
            } catch (error) {
                console.error("Image upload failed:", error);
                alert("Failed to upload images. Check console for details.");
            } finally {
                setIsUploadingImages(false);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };

        const handleRemoveImage = (index: number) => {
            setPostImages(postImages.filter((_, i) => i !== index));
        };

        const triggerFileSelect = () => {
            fileInputRef.current?.click();
        }

        return (
            <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-24">
                <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 p-4 backdrop-blur-sm dark:bg-background-dark/80 border-b border-zinc-200 dark:border-zinc-800">
                    <button onClick={() => setCreationMode('select')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Share Update</h1>
                    <button
                        onClick={handlePostSubmit}
                        disabled={loading || !postContent.trim()}
                        className="px-4 py-1.5 bg-primary text-background-dark font-bold rounded-full disabled:opacity-50"
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </header>

                <main className="p-4 flex flex-col gap-4 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 bg-cover bg-center shrink-0"
                            style={{ backgroundImage: `url(${currentUser?.photoURL || ''})` }}
                        />
                        <div className="flex-1">
                            <AIEnhancedTextarea
                                label=""
                                context="Social Media Post"
                                value={postContent}
                                onValueChange={setPostContent}
                                placeholder="What's happening in your professional world?"
                                rows={6}
                                className="text-lg"
                            />
                        </div>
                    </div>

                    {/* Image Carousel & Input */}
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-4">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">Attach Images (Max 10)</label>

                        {/* Input Row */}
                        <div className="flex flex-col gap-3">
                            {/* File Upload Button */}
                            <button
                                onClick={triggerFileSelect}
                                disabled={isUploadingImages || postImages.length >= 10}
                                className="flex items-center justify-center w-full h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <span className="material-symbols-outlined mr-2 text-zinc-500">add_photo_alternate</span>
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {isUploadingImages ? 'Uploading...' : 'Pick from Gallery'}
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {/* URL Input (Optional) */}
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-none text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 text-sm"
                                    placeholder="Or paste direct image URL (.jpg, .png, etc.)"
                                    value={newImageUrl}
                                    onChange={(e) => setNewImageUrl(e.target.value)}
                                // onKeyDown={(e) => e.key === 'Enter' && handleAddImage()} // Removed to avoid submitting form accidentally
                                />
                                <button
                                    onClick={handleAddImage}
                                    disabled={!newImageUrl.trim() || postImages.length >= 10}
                                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 text-sm"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Carousel / List */}
                        {postImages.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-hide">
                                {postImages.map((img, idx) => (
                                    <div key={idx} className="relative w-32 h-32 shrink-0 snap-start rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden group border border-zinc-200 dark:border-zinc-800">
                                        <img src={img} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute top-1 right-1 flex gap-1">
                                            <div className="bg-black/60 text-white text-[10px] px-1 rounded backdrop-blur-sm">
                                                {idx + 1}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveImage(idx)}
                                                className="p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[10px] block">close</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // 3. Job Creation Mode (Original UI)
    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-28 overflow-x-hidden font-display transition-colors">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#090A0C]/90 px-4 md:px-8 backdrop-blur-md">
                <button
                    onClick={() => setCreationMode('select')}
                    className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all"
                    title="Back to Selection"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>
                <div className="text-center px-2">
                    <h1 className="text-base font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                        Post Job / Audition Call
                    </h1>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold hidden sm:block">
                        Broadcast casting or crew requirements to verified filmmakers
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleDarkMode}
                        className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 transition-all active:scale-95"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleJobSubmit()}
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-black text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>{loading ? 'Posting...' : 'Publish'}</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow pb-24 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6">
                <div className="mb-6">
                    {/* Segmented Control */}
                    <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/[0.04] p-1.5 border border-zinc-200 dark:border-white/[0.06]">
                        <button
                            type="button"
                            onClick={() => setPostType('Job')}
                            className={`flex flex-1 items-center justify-center gap-2 h-full rounded-xl text-xs font-black transition-all ${
                                postType === 'Job'
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">work</span>
                            <span>Crew & Technician Job</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPostType('Audition')}
                            className={`flex flex-1 items-center justify-center gap-2 h-full rounded-xl text-xs font-black transition-all ${
                                postType === 'Audition'
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base">theater_comedy</span>
                            <span>Casting & Actor Audition</span>
                        </button>
                    </div>

                    {/* AI Find Actors Button (only for Auditions) */}
                    {postType === 'Audition' && (
                        <div className="mt-4">
                            <AIButton
                                onClick={(e) => {
                                    e?.stopPropagation();
                                    setShowCastingModal(true);
                                }}
                                label="AI Find Perfect Actors"
                                variant="primary"
                                className="w-full justify-center"
                            />
                            {invitedActors.length > 0 && (
                                <p className="text-center text-sm text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    {invitedActors.length} actor{invitedActors.length !== 1 ? 's' : ''} will be invited
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <section className="p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">info</span>
                            <span>Basic Information</span>
                        </h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    {postType === 'Audition' ? 'Role Name / Character' : 'Title'} *
                                </span>
                                <input
                                    name="title"
                                    value={jobFormData.title}
                                    onChange={handleJobInputChange}
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder={postType === 'Audition' ? "e.g., Lead Actor - 'Rahul'" : "e.g., Cinematographer"}
                                />
                            </label>
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    {postType === 'Audition' ? 'Project Name / Production' : 'Company / Production House'} *
                                </span>
                                <input
                                    name="company"
                                    value={jobFormData.company}
                                    onChange={handleJobInputChange}
                                    className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    placeholder="Enter banner or production house name"
                                />
                            </label>

                            {/* External Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                        IMDb Link (Optional)
                                    </span>
                                    <input
                                        name="imdb"
                                        value={jobFormData.imdb}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="https://imdb.com/..."
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                        Wiki Link (Optional)
                                    </span>
                                    <input
                                        name="wiki"
                                        value={jobFormData.wiki}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="https://wikipedia.org/..."
                                    />
                                </label>
                            </div>

                            {/* Audition Specifics */}
                            {postType === 'Audition' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                            Gender
                                        </span>
                                        <div className="relative">
                                            <select
                                                name="gender"
                                                value={jobFormData.gender}
                                                // @ts-ignore
                                                onChange={handleJobInputChange}
                                                className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                                            >
                                                <option value="Any">Any</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </label>
                                    <label className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                            Age Range
                                        </span>
                                        <input
                                            name="ageRange"
                                            value={jobFormData.ageRange}
                                            onChange={handleJobInputChange}
                                            className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                            placeholder="e.g. 20-30"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* The Details */}
                    <section className="p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">description</span>
                            <span>Opportunity Description & Specs</span>
                        </h2>
                        <div className="space-y-4">
                            <AIEnhancedTextarea
                                label={postType === 'Audition' ? "Character Bio / Description" : "Job Description"}
                                context={postType === 'Audition' ? "Character Bio" : "Job Description"}
                                name="description"
                                value={jobFormData.description}
                                onValueChange={(value: string) => setJobFormData(prev => ({ ...prev, description: value }))}
                                placeholder={postType === 'Audition' ? "Describe the character's personality, look, and role..." : "Describe the role and responsibilities"}
                            />
                            <AIEnhancedTextarea
                                label="Requirements & Qualifications"
                                context="Job Requirements"
                                name="requirements"
                                value={jobFormData.requirements}
                                onValueChange={(value) => setJobFormData(prev => ({ ...prev, requirements: value }))}
                                placeholder="List required skills, experience, etc."
                            />
                        </div>
                    </section>

                    {/* Logistical Information */}
                    <section className="p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">pin_drop</span>
                            <span>Logistical Details & Timeline</span>
                        </h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    Location *
                                </span>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg pointer-events-none">
                                        location_on
                                    </span>
                                    <input
                                        name="location"
                                        value={jobFormData.location}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="e.g., Hyderabad, Mumbai, Bangalore, Chennai"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    Salary / Compensation
                                </span>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg pointer-events-none">
                                        payments
                                    </span>
                                    <input
                                        name="salary"
                                        value={jobFormData.salary}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="e.g. As per industry standards, ₹50k - ₹1L"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    Application Deadline *
                                </span>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg pointer-events-none">
                                        calendar_today
                                    </span>
                                    <input
                                        name="deadline"
                                        type="date"
                                        value={jobFormData.deadline}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                    />
                                </div>
                            </label>

                            {/* Shoot Date & Days Required for Audition */}
                            {postType === 'Audition' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                            Tentative Shoot Date
                                        </span>
                                        <div className="relative flex items-center">
                                            <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg pointer-events-none">
                                                movie_filter
                                            </span>
                                            <input
                                                name="shootDate"
                                                type="date"
                                                value={jobFormData.shootDate}
                                                onChange={handleJobInputChange}
                                                className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                            />
                                        </div>
                                    </label>
                                    <label className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                            Days Required
                                        </span>
                                        <input
                                            name="daysRequired"
                                            value={jobFormData.daysRequired}
                                            onChange={handleJobInputChange}
                                            className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                            placeholder="e.g. 5 days"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Media */}
                    <section className="p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">video_library</span>
                            <span>Reference Media & Audition Reels</span>
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5 block">
                                    Reference Video / Audition Script (Optional)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    disabled={isUploadingVideo}
                                    className="flex items-center justify-center w-full h-14 px-4 py-2 border border-dashed border-zinc-300 dark:border-white/20 rounded-2xl bg-zinc-50 dark:bg-black/20 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined mr-2 text-amber-500">{isUploadingVideo ? 'hourglass_empty' : 'video_call'}</span>
                                    <span className="text-xs sm:text-sm font-bold">
                                        {isUploadingVideo ? 'Uploading Video...' : (jobFormData.videoUrl ? 'Change Video' : 'Upload Reference Video')}
                                    </span>
                                </button>
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setIsUploadingVideo(true);
                                        try {
                                            const result = await uploadFile(file);
                                            if (result.url) {
                                                setJobFormData(prev => ({ ...prev, videoUrl: result.url! }));
                                            } else {
                                                alert('Failed to upload video: ' + (result.error || 'Unknown error'));
                                            }
                                        } catch (error) {
                                            console.error('Video upload error:', error);
                                            alert('Failed to upload video.');
                                        } finally {
                                            setIsUploadingVideo(false);
                                            if (videoInputRef.current) videoInputRef.current.value = '';
                                        }
                                    }}
                                />
                                {jobFormData.videoUrl && (
                                    <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        <span>Video uploaded successfully</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* How to Apply */}
                    <section className="p-6 rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] shadow-sm space-y-4">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">outgoing_mail</span>
                            <span>Contact & Application Methods</span>
                        </h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5">
                                    Direct Contact Email (Optional)
                                </span>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 text-lg pointer-events-none">
                                        mail
                                    </span>
                                    <input
                                        name="email"
                                        type="email"
                                        value={jobFormData.email}
                                        onChange={handleJobInputChange}
                                        className="w-full rounded-xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 pl-11 pr-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                                        placeholder="casting@productionhouse.com"
                                    />
                                </div>
                            </label>
                            <div>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 pb-1.5 block">
                                    Attachments (Audition Script / Breakdown PDF)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    disabled={isUploadingAttachment}
                                    className="flex items-center justify-center w-full h-14 px-4 py-2 border border-dashed border-zinc-300 dark:border-white/20 rounded-2xl bg-zinc-50 dark:bg-black/20 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined mr-2 text-amber-500">{isUploadingAttachment ? 'hourglass_empty' : 'upload_file'}</span>
                                    <span className="text-xs sm:text-sm font-bold">
                                        {isUploadingAttachment ? 'Uploading...' : 'Attach Script or JD (PDF, DOC)'}
                                    </span>
                                </button>
                                <input
                                    ref={attachmentInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        if (jobAttachments.length >= 3) {
                                            alert('Maximum 3 attachments allowed.');
                                            return;
                                        }

                                        setIsUploadingAttachment(true);
                                        try {
                                            const result = await uploadFile(file);
                                            if (result.url) {
                                                setJobAttachments(prev => [...prev, { name: file.name, url: result.url! }]);
                                            } else {
                                                alert('Failed to upload file: ' + (result.error || 'Unknown error'));
                                            }
                                        } catch (error) {
                                            console.error('Attachment upload error:', error);
                                            alert('Failed to upload attachment.');
                                        } finally {
                                            setIsUploadingAttachment(false);
                                            if (attachmentInputRef.current) {
                                                attachmentInputRef.current.value = '';
                                            }
                                        }
                                    }}
                                />

                                {/* Uploaded Attachments */}
                                {jobAttachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {jobAttachments.map((attachment, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-xl">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="material-symbols-outlined text-amber-500">description</span>
                                                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[220px]">{attachment.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setJobAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <span className="material-symbols-outlined text-base">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Bottom Post Button */}
                <div className="mt-8 mb-8">
                    <button
                        type="button"
                        onClick={() => handleJobSubmit()}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black text-base py-4 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                <span>Publishing Call...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                <span>Broadcast {postType} Call</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                        By posting, you agree to iFilmDirectory Terms & Community Casting Safety Notice.
                    </p>
                </div>
            </main>

            {/* AI Casting Suggestions Modal */}
            <CastingSuggestionsModal
                isOpen={showCastingModal}
                onClose={() => setShowCastingModal(false)}
                onSelectActors={(actorIds) => {
                    setInvitedActors(actorIds);
                    console.log('Invited actors:', actorIds);
                }}
            />

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => !loading && setShowSuccessModal(false)}>
                    <div className="bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className={`size-16 rounded-2xl mx-auto flex items-center justify-center ${successMessage.includes('successfully')
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            }`}>
                            <span className="material-symbols-outlined text-3xl">
                                {successMessage.includes('successfully') ? 'check_circle' : 'info'}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1.5">
                                {successMessage.includes('successfully') ? 'Opportunity Published!' : 'Notice'}
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {successMessage}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowSuccessModal(false);
                                if (successMessage.includes('successfully')) navigate('/jobs');
                            }}
                            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-xs uppercase tracking-wider transition-all"
                        >
                            {successMessage.includes('successfully') ? 'View Jobs Board' : 'Dismiss'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
