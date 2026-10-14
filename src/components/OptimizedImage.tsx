// Optimized Image Component with WebP support, lazy loading, and responsive images

import { useState } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean; // Load immediately (for above-fold images)
    sizes?: string; // Responsive sizes
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const OptimizedImage = ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    sizes = '100vw',
    objectFit = 'cover',
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Generate WebP version URL (assumes your storage service supports it)
    const getWebPUrl = (url: string) => {
        if (url.includes('cloudinary.com')) {
            // Cloudinary: Add f_auto for automatic format
            return url.replace('/upload/', '/upload/f_auto,q_auto/');
        }
        if (url.includes('imagekit.io')) {
            // ImageKit: Add format transformation
            return `${url}?tr=f-webp,q-80`;
        }
        // For other services, return original
        return url;
    };

    // Generate responsive srcSet
    const getSrcSet = (url: string) => {
        if (url.includes('cloudinary.com')) {
            return `
        ${url.replace('/upload/', '/upload/w_320,f_auto,q_auto/')} 320w,
        ${url.replace('/upload/', '/upload/w_640,f_auto,q_auto/')} 640w,
        ${url.replace('/upload/', '/upload/w_1024,f_auto,q_auto/')} 1024w,
        ${url.replace('/upload/', '/upload/w_1920,f_auto,q_auto/')} 1920w
      `.trim();
        }
        if (url.includes('imagekit.io')) {
            return `
        ${url}?tr=w-320,f-webp,q-80 320w,
        ${url}?tr=w-640,f-webp,q-80 640w,
        ${url}?tr=w-1024,f-webp,q-80 1024w,
        ${url}?tr=w-1920,f-webp,q-80 1920w
      `.trim();
        }
        return undefined;
    };

    const webpUrl = getWebPUrl(src);
    const srcSet = getSrcSet(src);

    if (hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
                style={{ width, height }}
            >
                <span className="material-symbols-outlined text-gray-400 text-4xl">
                    broken_image
                </span>
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
            {/* Loading placeholder */}
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-700" />
            )}

            {/* Actual image */}
            <picture>
                {/* WebP version for modern browsers */}
                {webpUrl !== src && (
                    <source
                        type="image/webp"
                        srcSet={srcSet || webpUrl}
                        sizes={sizes}
                    />
                )}

                {/* Fallback to original format */}
                <img
                    src={src}
                    srcSet={srcSet}
                    sizes={sizes}
                    alt={alt}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    width={width}
                    height={height}
                    className={`w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ objectFit }}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setHasError(true)}
                />
            </picture>

            {/* Blur-up effect (optional) */}
            {!isLoaded && (
                <div className="absolute inset-0 backdrop-blur-sm" />
            )}
        </div>
    );
};

// Avatar component with optimized images
export const OptimizedAvatar = ({
    src,
    alt,
    size = 'md',
    className = '',
}: {
    src: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) => {
    const sizeMap = {
        sm: { px: 32, class: 'h-8 w-8' },
        md: { px: 48, class: 'h-12 w-12' },
        lg: { px: 64, class: 'h-16 w-16' },
        xl: { px: 96, class: 'h-24 w-24' },
    };

    const { px, class: sizeClass } = sizeMap[size];

    return (
        <OptimizedImage
            src={src}
            alt={alt}
            width={px}
            height={px}
            className={`${sizeClass} rounded-full ${className}`}
            objectFit="cover"
        />
    );
};

// Background image component
export const OptimizedBackgroundImage = ({
    src,
    alt,
    children,
    className = '',
    overlay = false,
}: {
    src: string;
    alt: string;
    children?: React.ReactNode;
    className?: string;
    overlay?: boolean;
}) => {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Background image */}
            <div className="absolute inset-0">
                <OptimizedImage
                    src={src}
                    alt={alt}
                    className="w-full h-full"
                    objectFit="cover"
                />
            </div>

            {/* Overlay */}
            {overlay && (
                <div className="absolute inset-0 bg-black/50" />
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default OptimizedImage;
