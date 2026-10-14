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

import { uploadFile } from '../services/storageService';

export default function PostJob() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

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
            <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-24">
                {/* Header */}
                <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 p-4 backdrop-blur-sm dark:bg-background-dark/80 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => navigate('/home')}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Create</h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </header>

                <main
                    className="flex-1 p-4 flex flex-col gap-4 relative"
                    onClick={() => navigate(-1)}
                >
                    <div className="absolute inset-0" onClick={() => navigate(-1)} />
                    <div className="relative z-10 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">What would you like to share?</p>

                        {/* Option 1: Share Update */}
                        <button
                            onClick={() => setCreationMode('post')}
                            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-blue-600 dark:text-blue-400">edit_note</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Share Update</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Post thoughts, images, or news to the Showcase feed.</p>
                            </div>
                        </button>

                        {/* Option 2: Upload Work */}
                        <button
                            onClick={() => navigate('/showreel/upload')}
                            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-purple-600 dark:text-purple-400">video_library</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Upload Work</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Showcase your skills & portfolio to get more work opportunities.</p>
                            </div>
                        </button>

                        {/* Option 3: Post Job */}
                        <button
                            onClick={() => setCreationMode('job')}
                            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">work</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Post Job / Audition</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Recruit talent or find crew for your project.</p>
                            </div>
                        </button>

                        {/* Option 4: Create Blog */}
                        <button
                            onClick={() => navigate('/create-blog')}
                            className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group"
                        >
                            <div className="w-16 h-16 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-fuchsia-600 dark:text-fuchsia-400">article</span>
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Write Blog</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Share articles, insights, or stories with AI assistance.</p>
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
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 p-4 pb-2 justify-between backdrop-blur-sm border-b border-white/5 dark:border-white/5">
                <div className="flex size-12 shrink-0 items-center justify-start">
                    <button
                        onClick={() => setCreationMode('select')}
                        className="hover:opacity-70 transition-opacity"
                    >
                        <span className="material-symbols-outlined text-black dark:text-white">
                            arrow_back_ios_new
                        </span>
                    </button>
                </div>
                <h1 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    Post a Job / Audition
                </h1>
                <div className="flex w-12 items-center justify-end">
                    <button
                        type="button"
                        onClick={() => handleJobSubmit()}
                        disabled={loading}
                        className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0 hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                        {loading ? '...' : 'Post'}
                    </button>
                </div>
            </header>

            <main className="flex-grow pb-24 w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto">
                <div className="p-4">
                    {/* Segmented Control */}
                    <div className="flex h-10 w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-[#493222] p-1">
                        <label
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-colors duration-200 ${postType === 'Job'
                                ? 'bg-white dark:bg-[#231810] shadow-sm text-black dark:text-white'
                                : 'text-gray-500 dark:text-[#cba990]'
                                }`}
                        >
                            <span className="truncate text-sm font-medium leading-normal">Job</span>
                            <input
                                className="invisible w-0"
                                name="post-type"
                                type="radio"
                                value="Job"
                                checked={postType === 'Job'}
                                onChange={() => setPostType('Job')}
                            />
                        </label>
                        <label
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 transition-colors duration-200 ${postType === 'Audition'
                                ? 'bg-white dark:bg-[#231810] shadow-sm text-black dark:text-white'
                                : 'text-gray-500 dark:text-[#cba990]'
                                }`}
                        >
                            <span className="truncate text-sm font-medium leading-normal">Audition</span>
                            <input
                                className="invisible w-0"
                                name="post-type"
                                type="radio"
                                value="Audition"
                                checked={postType === 'Audition'}
                                onChange={() => setPostType('Audition')}
                            />
                        </label>
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

                <div className="space-y-4 px-4">
                    {/* Basic Information */}
                    <section>
                        <h2 className="text-black dark:text-white text-lg font-bold mb-3">Basic Information</h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    {postType === 'Audition' ? 'Role Name / Character' : 'Title'}
                                </p>
                                <input
                                    name="title"
                                    value={jobFormData.title}
                                    onChange={handleJobInputChange}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                    placeholder={postType === 'Audition' ? "e.g., Lead Actor - 'Rahul'" : "e.g., Cinematographer"}
                                />
                            </label>
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    {postType === 'Audition' ? 'Project Name / Production' : 'Company / Production House'}
                                </p>
                                <input
                                    name="company"
                                    value={jobFormData.company}
                                    onChange={handleJobInputChange}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                    placeholder="Enter name"
                                />
                            </label>

                            {/* External Links */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col">
                                    <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                        IMDb Link (Optional)
                                    </p>
                                    <input
                                        name="imdb"
                                        value={jobFormData.imdb}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                        placeholder="https://imdb.com/..."
                                    />
                                </label>
                                <label className="flex flex-col">
                                    <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                        Wiki Link (Optional)
                                    </p>
                                    <input
                                        name="wiki"
                                        value={jobFormData.wiki}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                        placeholder="https://wikipedia.org/..."
                                    />
                                </label>
                            </div>

                            {/* Audition Specifics */}
                            {postType === 'Audition' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                            Gender
                                        </p>
                                        <div className="relative">
                                            <select
                                                name="gender"
                                                value={jobFormData.gender}
                                                // @ts-ignore
                                                onChange={handleJobInputChange}
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 p-[15px] text-base font-normal leading-normal appearance-none"
                                            >
                                                <option value="Any">Any</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                                        </div>
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                            Age Range
                                        </p>
                                        <input
                                            name="ageRange"
                                            value={jobFormData.ageRange}
                                            onChange={handleJobInputChange}
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                            placeholder="e.g. 20-30"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* The Details */}
                    <section>
                        <h2 className="text-black dark:text-white text-lg font-bold mb-3">The Details</h2>
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
                    <section>
                        <h2 className="text-black dark:text-white text-lg font-bold mb-3">
                            Logistical Information
                        </h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Location
                                </p>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-[#cba990]">
                                        location_on
                                    </span>
                                    <input
                                        name="location"
                                        value={jobFormData.location}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] pl-11 pr-4 py-[15px] text-base font-normal leading-normal"
                                        placeholder="e.g., Mumbai, Maharashtra"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Salary / Compensation
                                </p>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-[#cba990]">
                                        currency_rupee
                                    </span>
                                    <input
                                        name="salary"
                                        value={jobFormData.salary}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] pl-11 pr-4 py-[15px] text-base font-normal leading-normal"
                                        placeholder="As per industry standards"
                                    />
                                </div>
                            </label>
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Application Deadline
                                </p>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-[#cba990]">
                                        calendar_today
                                    </span>
                                    <input
                                        name="deadline"
                                        type="date"
                                        value={jobFormData.deadline}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] pl-11 pr-4 py-[15px] text-base font-normal leading-normal"
                                    />
                                </div>
                            </label>

                            {/* Shoot Date & Days Required for Audition */}
                            {postType === 'Audition' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex flex-col">
                                        <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                            Tentative Shoot Date
                                        </p>
                                        <div className="relative flex items-center">
                                            <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-[#cba990]">
                                                movie_filter
                                            </span>
                                            <input
                                                name="shootDate"
                                                type="date"
                                                value={jobFormData.shootDate}
                                                onChange={handleJobInputChange}
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] pl-11 pr-4 py-[15px] text-base font-normal leading-normal"
                                            />
                                        </div>
                                    </label>
                                    <label className="flex flex-col">
                                        <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                            Days Required
                                        </p>
                                        <input
                                            name="daysRequired"
                                            value={jobFormData.daysRequired}
                                            onChange={handleJobInputChange}
                                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] p-[15px] text-base font-normal leading-normal"
                                            placeholder="e.g. 5 days"
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Media */}
                    <section>
                        <h2 className="text-black dark:text-white text-lg font-bold mb-3">Reference Media</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Reference Video / Audition Script
                                </p>
                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    disabled={isUploadingVideo}
                                    className="flex items-center justify-center w-full h-14 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-[#684831] rounded-lg text-gray-500 dark:text-[#cba990] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined mr-2">{isUploadingVideo ? 'hourglass_empty' : 'video_call'}</span>
                                    <span className="text-base font-medium">
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
                                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Video uploaded successfully
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* How to Apply */}
                    <section>
                        <h2 className="text-black dark:text-white text-lg font-bold mb-3">How to Apply</h2>
                        <div className="space-y-4">
                            <label className="flex flex-col">
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Contact Email
                                </p>
                                <div className="relative flex items-center">
                                    <span className="material-symbols-outlined absolute left-3 text-gray-500 dark:text-[#cba990]">
                                        mail
                                    </span>
                                    <input
                                        name="email"
                                        type="email"
                                        value={jobFormData.email}
                                        onChange={handleJobInputChange}
                                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-black dark:text-white focus:outline-0 focus:ring-0 border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] focus:border-primary dark:focus:border-primary h-14 placeholder:text-gray-500 dark:placeholder:text-[#cba990] pl-11 pr-4 py-[15px] text-base font-normal leading-normal"
                                        placeholder="casting@productionhouse.com"
                                    />
                                </div>
                            </label>
                            <div>
                                <p className="text-black dark:text-white text-base font-medium leading-normal pb-2">
                                    Attachments
                                </p>
                                <button
                                    type="button"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    disabled={isUploadingAttachment}
                                    className="flex items-center justify-center w-full h-14 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-[#684831] rounded-lg text-gray-500 dark:text-[#cba990] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined mr-2">{isUploadingAttachment ? 'hourglass_empty' : 'upload_file'}</span>
                                    <span className="text-base font-medium">
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
                                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">description</span>
                                                    <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{attachment.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setJobAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <span className="material-symbols-outlined text-lg">close</span>
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
                <div className="mx-4 mt-6 mb-8">
                    <button
                        type="button"
                        onClick={() => handleJobSubmit()}
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                Posting...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                Post {postType}
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                        By posting, you agree to our Terms of Service and Community Guidelines.
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
                    // TODO: Send invitations to selected actors
                }}
            />

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={() => !loading && setShowSuccessModal(false)}>
                    <div className="bg-white dark:bg-[#231810] rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${successMessage.includes('successfully')
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                <span className="material-symbols-outlined text-3xl">
                                    {successMessage.includes('successfully') ? 'check_circle' : 'error'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                                {successMessage.includes('successfully') ? 'Success!' : 'Notice'}
                            </h3>

                            <p className="text-gray-600 dark:text-[#cba990] mb-6">
                                {successMessage}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    if (successMessage.includes('successfully')) {
                                        navigate('/jobs');
                                    }
                                }}
                                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                {successMessage.includes('successfully') ? 'Done' : 'Okay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
