// Skeleton loading components for better perceived performance

export const SkeletonCard = () => (
    <div className="animate-pulse bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4">
        {/* Image placeholder */}
        <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4"></div>

        {/* Title placeholder */}
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>

        {/* Description placeholders */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
);

export const SkeletonProfile = () => (
    <div className="animate-pulse bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            <div className="h-16 w-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>

            <div className="flex-1">
                {/* Name */}
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                {/* Role */}
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
        </div>

        {/* Bio */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
    </div>
);

export const SkeletonJob = () => (
    <div className="animate-pulse bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4">
        {/* Company logo */}
        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-lg mb-3"></div>

        {/* Job title */}
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-2"></div>

        {/* Company name */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-3"></div>

        {/* Tags */}
        <div className="flex gap-2 mb-3">
            <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Description */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
);

export const SkeletonPost = () => (
    <div className="animate-pulse bg-surface-light dark:bg-surface-dark rounded-xl p-4 mb-4">
        {/* User info */}
        <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
        </div>

        {/* Post content */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-5/6 mb-4"></div>

        {/* Image */}
        <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4"></div>

        {/* Actions */}
        <div className="flex gap-4">
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

export const SkeletonList = ({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'profile' | 'job' | 'post' }) => {
    const SkeletonComponent = {
        card: SkeletonCard,
        profile: SkeletonProfile,
        job: SkeletonJob,
        post: SkeletonPost,
    }[type];

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonComponent key={index} />
            ))}
        </>
    );
};

export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
    <div className={`animate-pulse ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
            <div
                key={index}
                className={`h-3 bg-gray-300 dark:bg-gray-700 rounded mb-2 ${index === lines - 1 ? 'w-3/4' : 'w-full'
                    }`}
            ></div>
        ))}
    </div>
);

export const SkeletonButton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse h-10 bg-gray-300 dark:bg-gray-700 rounded-lg ${className}`}></div>
);

export const SkeletonAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
    };

    return (
        <div className={`animate-pulse ${sizeClasses[size]} bg-gray-300 dark:bg-gray-700 rounded-full`}></div>
    );
};
