import { useState } from 'react';
import { CINEMATIC_PLACEHOLDERS } from '../constants/images';

interface PostMediaProps {
    src: string;
    alt?: string;
    className?: string;
    isThumbnail?: boolean;
    fallbackType?: keyof typeof CINEMATIC_PLACEHOLDERS;
}

// Helper to detect video URLs
const isVideoUrl = (url: string): boolean => {
    if (!url) return false;

    // YouTube patterns (including Shorts)
    if (/youtube\.com\/watch/i.test(url) || /youtu\.be\//i.test(url) || /youtube\.com\/shorts\//i.test(url)) return true;

    // Vimeo patterns
    if (/vimeo\.com\//i.test(url)) return true;

    // Direct video file extensions
    if (/\.(mp4|webm|ogg|mov|avi|m4v)(\?.*)?$/i.test(url)) return true;

    // Cloudinary video
    if (/res\.cloudinary\.com.*\/video\/upload/i.test(url)) return true;

    return false;
};

// Helper to detect vertical video (9:16 aspect ratio like Shorts)
const isVerticalVideo = (url: string): boolean => {
    // YouTube Shorts
    if (/youtube\.com\/shorts\//i.test(url)) return true;

    // Cloudinary or direct links with vertical markers (common in some setups)
    if (url.includes('aspect_9:16') || url.includes('vertical')) return true;

    // If it's a direct video link, we might not always know, but we can try to guess from common storage names
    if (url.toLowerCase().includes('reel') || url.toLowerCase().includes('short')) return true;

    return false;
};

// Helper to get YouTube embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
    // Match youtube.com/shorts/VIDEO_ID (YouTube Shorts)
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;

    // Match youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;

    // Match youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;

    return null;
};

// Helper to get Vimeo embed URL
const getVimeoEmbedUrl = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
    return null;
};

export default function PostMedia({ src, alt = "Post attachment", className = "", isThumbnail = false, fallbackType = 'GENERAL' }: PostMediaProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const [isDetectedVertical, setIsDetectedVertical] = useState(false);

    const isVideo = isVideoUrl(src);
    const isVertical = isVerticalVideo(src);

    // Handle YouTube videos (including Shorts)
    const youtubeEmbedUrl = getYouTubeEmbedUrl(src);
    if (youtubeEmbedUrl) {
        // Extract video ID for looping
        const videoId = youtubeEmbedUrl.split('/').pop();
        const embedParams = isThumbnail
            ? `?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`
            : '';

        // For YouTube Shorts: display as tall vertical video (9:16)
        if (isVertical) {
            return (
                <div className={`relative w-full h-full ${className}`}>
                    <iframe
                        src={`${youtubeEmbedUrl}${embedParams}`}
                        className={`absolute inset-0 w-full h-full ${isThumbnail ? '' : 'rounded-2xl shadow-xl'}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={alt}
                    />
                </div>
            );
        }
        // Regular YouTube video (16:9)
        return (
            <div className={`relative w-full ${isThumbnail ? 'h-full' : 'aspect-video'} ${className}`}>
                <iframe
                    src={`${youtubeEmbedUrl}${embedParams}`}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={alt}
                />
            </div>
        );
    }

    // Handle Vimeo videos
    const vimeoEmbedUrl = getVimeoEmbedUrl(src);
    if (vimeoEmbedUrl) {
        const embedParams = isThumbnail ? '?background=1&autoplay=1&muted=1&loop=1' : '';
        return (
            <div className={`relative w-full aspect-video ${className}`}>
                <iframe
                    src={`${vimeoEmbedUrl}${embedParams}`}
                    className="absolute inset-0 w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={alt}
                />
            </div>
        );
    }

    // Handle direct video files (Cloudinary, etc.)
    if (isVideo) {
        return (
            <div className={`relative w-full group overflow-hidden ${(isVertical || isDetectedVertical) ? 'aspect-[9/16] max-h-[700px] max-w-[450px] mx-auto' : 'aspect-video'} ${className}`}>
                <video
                    src={src}
                    className={`w-full h-full object-cover ${isThumbnail ? '' : 'rounded-2xl'} bg-black cursor-pointer`}
                    controls={isPlaying && !isThumbnail}
                    autoPlay={isThumbnail}
                    muted={isThumbnail}
                    loop={isThumbnail}
                    preload="auto"
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={(e) => {
                        const v = e.currentTarget;
                        if (v.paused) v.play();
                        else v.pause();
                    }}
                    onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        if (v.videoHeight > v.videoWidth) {
                            setIsDetectedVertical(true);
                        }
                        setIsLoading(false);
                    }}
                    onLoadedData={() => setIsLoading(false)}
                    onError={() => setHasError(true)}
                >
                    Your browser does not support the video tag.
                </video>

                {/* Big Play Button Overlay */}
                {!isPlaying && !isLoading && !hasError && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all cursor-pointer"
                        onClick={(e) => {
                            const video = e.currentTarget.parentElement?.querySelector('video');
                            if (video) video.play();
                        }}
                    >
                        <div className="size-20 flex items-center justify-center rounded-full bg-primary/90 text-white shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                            <span className="material-symbols-outlined text-5xl filled" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </div>
                    </div>
                )}

                {isLoading && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span className="text-sm font-medium text-zinc-500">Loading video...</span>
                        </div>
                    </div>
                )}
                {hasError && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center">
                        <img
                            src={CINEMATIC_PLACEHOLDERS[fallbackType]}
                            alt={alt}
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                            <div className="size-12 rounded-full bg-amber-500/90 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <span className="material-symbols-outlined text-2xl font-bold">play_arrow</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // For images, use standard image display
    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-primary rounded-full animate-spin" />
                </div>
            )}
            <img
                src={(hasError || !src) ? CINEMATIC_PLACEHOLDERS[fallbackType] : src}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'} ${className.includes('object-') ? '' : 'object-center'} ${className}`}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    if (!hasError) {
                        setHasError(true);
                    } else {
                        setIsLoading(false);
                    }
                }}
            />
        </div>
    );
}
