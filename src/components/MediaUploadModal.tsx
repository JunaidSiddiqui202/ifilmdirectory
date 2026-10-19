import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/imageUtils';
import { uploadFile } from '../services/storageService';
import { useToast } from '../context/ToastContext';

export type MediaUploadVariant = 'avatar' | 'gallery' | 'blog' | 'cover';

export interface MediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Callback returning the uploaded public URL */
    onSave?: (url: string) => void | Promise<void>;
    /** Alias for onSave for drop-in compatibility */
    onUpload?: (url: string) => void | Promise<void>;
    /** Visual preset affecting defaults, icons, and texts */
    variant?: MediaUploadVariant;
    /** Crop aspect ratio. If explicitly set to null or not provided in non-avatar modes, cropping is bypassed. */
    aspectRatio?: number | null;
    /** Custom title override */
    title?: string;
    /** Custom subtitle override */
    subtitle?: string;
    /** Maximum allowed file size in MB (default: 10) */
    maxSizeMB?: number;
}

export default function MediaUploadModal({
    isOpen,
    onClose,
    onSave,
    onUpload,
    variant = 'gallery',
    aspectRatio,
    title,
    subtitle,
    maxSizeMB = 10,
}: MediaUploadModalProps) {
    const toast = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Compute effective aspect ratio based on variant if not explicitly defined
    const effectiveAspectRatio = aspectRatio !== undefined
        ? aspectRatio
        : variant === 'avatar'
            ? 1
            : variant === 'cover'
                ? 16 / 9
                : null;

    const shouldCrop = effectiveAspectRatio !== null && effectiveAspectRatio > 0;

    // Reset state whenever modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setImageSrc(null);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
            setLoading(false);
            setIsDragging(false);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const processSelectedFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file (JPEG, PNG, WEBP, HEIC)');
            return;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleSave = async () => {
        // 1. Double-click and validation guard
        if (!imageSrc || !selectedFile || loading) return;

        // 2. Corrupt / 0-byte file guard
        if (selectedFile.size === 0) {
            toast.error('Selected file is empty or corrupted. Please choose another image.');
            return;
        }

        // 3. Offline check
        if (!navigator.onLine) {
            toast.error('Cannot upload media while offline. Please check your internet connection.');
            return;
        }

        setLoading(true);
        try {
            let fileToUpload: File = selectedFile;

            // If cropping is enabled, crop to canvas blob first
            if (shouldCrop && croppedAreaPixels) {
                const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
                if (!croppedBlob) {
                    throw new Error('Failed to crop image');
                }
                const filename = selectedFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
                fileToUpload = new File([croppedBlob], filename, { type: 'image/jpeg' });
            }

            const response = await uploadFile(fileToUpload);
            if (response.url) {
                const notify = onSave || onUpload;
                if (notify) await notify(response.url);
                onClose();
            } else {
                toast.error('Upload failed: ' + (response.error || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Media upload error:', error);
            const isNetworkError = !navigator.onLine || error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError');
            toast.error(isNetworkError
                ? 'Network connection lost during upload. Please check your internet connection and try again.'
                : 'Something went wrong during upload: ' + (error?.message || 'Error'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Config defaults per variant
    const titles = {
        avatar: 'Update Profile Picture',
        gallery: 'Add Photo to Gallery',
        blog: 'Upload Blog Image',
        cover: 'Update Cover Banner'
    };

    const subtitles = {
        avatar: 'Crop and position your headshot or profile photo',
        gallery: 'Add high-resolution work samples to your portfolio',
        blog: 'Add visual media blocks to enrich your article',
        cover: 'Recommended ratio 16:9 for clean display across devices'
    };

    const icons = {
        avatar: 'account_circle',
        gallery: 'photo_library',
        blog: 'image',
        cover: 'panorama'
    };

    const modalTitle = title || titles[variant];
    const modalSubtitle = subtitle || subtitles[variant];
    const modalIcon = icons[variant];

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={() => { if (!loading) onClose(); }}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-xl">{modalIcon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight truncate">
                                {modalTitle}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 sm:line-clamp-none">
                                {modalSubtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 shrink-0"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 overflow-y-auto">
                    {!imageSrc ? (
                        // File Selection / Dropzone
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center gap-3 p-10 sm:p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer group text-center ${
                                isDragging
                                    ? 'border-primary bg-primary/10'
                                    : 'border-zinc-300 dark:border-zinc-700 hover:border-primary hover:bg-primary/5'
                            }`}
                        >
                            <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors group-hover:scale-105 duration-200">
                                <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                            </div>
                            <div>
                                <p className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                                    Click or drag image here
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    JPEG, PNG, WEBP or HEIC (Up to {maxSizeMB}MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    ) : shouldCrop ? (
                        // Cropping Canvas
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-56 sm:h-72 md:h-80 bg-black rounded-xl overflow-hidden border border-zinc-800">
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={effectiveAspectRatio!}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>
                            {/* Zoom Slider */}
                            <div className="flex items-center gap-3 px-1">
                                <span className="material-symbols-outlined text-sm text-zinc-400">zoom_out</span>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full accent-primary h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
                                />
                                <span className="material-symbols-outlined text-sm text-zinc-400">zoom_in</span>
                            </div>
                        </div>
                    ) : (
                        // Instant Preview (No Crop)
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            <img
                                src={imageSrc}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                            <button
                                onClick={() => { setSelectedFile(null); setImageSrc(null); }}
                                className="absolute top-2 right-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
                                title="Remove and choose another image"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (imageSrc) {
                                setSelectedFile(null);
                                setImageSrc(null);
                            } else {
                                onClose();
                            }
                        }}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 text-center"
                    >
                        {imageSrc ? 'Choose Different Image' : 'Cancel'}
                    </button>

                    <div className="flex items-center gap-2">
                        {imageSrc && (
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="hidden sm:inline-flex px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!imageSrc || loading}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                                    <span>{shouldCrop ? 'Crop & Upload' : 'Upload Image'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
