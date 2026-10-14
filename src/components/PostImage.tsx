import { useState } from 'react';

interface PostImageProps {
    src: string;
    alt?: string;
    className?: string;
    isLink?: boolean; // If true, the URL is a webpage link not an image
}

// Helper to detect if URL is likely a webpage rather than an image
const isLikelyWebpageUrl = (url: string): boolean => {
    if (!url) return false;

    // Check if it's a known webpage pattern
    const webpagePatterns = [
        /\/blog\//i,
        /\/article\//i,
        /\/post\//i,
        /\/news\//i,
        /youtube\.com\/watch/i,
        /youtu\.be\//i,
        /twitter\.com\//i,
        /x\.com\//i,
        /facebook\.com\//i,
        /instagram\.com\/p\//i,
        /linkedin\.com\/post/i,
    ];

    // Check if it's NOT an image extension
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
    const cloudinaryImageUrl = /res\.cloudinary\.com.*\/(image|video)\/upload/i;
    const unsplashUrl = /images\.unsplash\.com/i;

    const looksLikeImage = imageExtensions.test(url) ||
        cloudinaryImageUrl.test(url) ||
        unsplashUrl.test(url);

    if (looksLikeImage) return false;

    return webpagePatterns.some(pattern => pattern.test(url));
};

// Extract domain from URL for display
const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
};

// External Link Confirmation Modal
interface ExternalLinkModalProps {
    isOpen: boolean;
    url: string;
    onClose: () => void;
    onConfirm: () => void;
}

function ExternalLinkModal({ isOpen, url, onClose, onConfirm }: ExternalLinkModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">open_in_new</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-center">
                    Leaving iFilmDirectory
                </h3>

                {/* Message */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                    You're about to open an external link. This will take you to:
                </p>

                {/* URL Preview */}
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="material-symbols-outlined text-sm text-zinc-500 mr-1">link</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium break-all">
                        {extractDomain(url)}
                    </span>
                </div>

                {/* Warning */}
                <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
                    iFilmDirectory is not responsible for content on external sites.
                </p>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 rounded-full bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                    >
                        <span>Open Link</span>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function PostImage({ src, alt = "Post attachment", className = "" }: PostImageProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLinkModal, setShowLinkModal] = useState(false);

    const isWebpage = isLikelyWebpageUrl(src);

    const handleOpenLink = () => {
        window.open(src, '_blank', 'noopener,noreferrer');
        setShowLinkModal(false);
    };

    // If it's a webpage URL, show a link preview card
    if (isWebpage || hasError) {
        return (
            <>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowLinkModal(true);
                    }}
                    className={`flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer w-full h-full ${className}`}
                >
                    <div className="flex flex-col items-center gap-2 text-center">
                        <span className="material-symbols-outlined text-3xl text-zinc-500 dark:text-zinc-400">link</span>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2">
                            {hasError ? 'Image failed to load' : 'Link Attachment'}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-full">
                            {extractDomain(src)}
                        </span>
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                            Click to open
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                        </span>
                    </div>
                </button>

                <ExternalLinkModal
                    isOpen={showLinkModal}
                    url={src}
                    onClose={() => setShowLinkModal(false)}
                    onConfirm={handleOpenLink}
                />
            </>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-primary rounded-full animate-spin" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                }}
            />
        </div>
    );
}

