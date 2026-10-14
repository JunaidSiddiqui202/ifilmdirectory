// Mobile UX enhancements: Pull-to-refresh, Haptic feedback, Touch interactions

import { useState, useRef, useEffect, type ReactNode } from 'react';

// Haptic feedback utility
export const haptic = {
    light: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    },
    medium: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(20);
        }
    },
    heavy: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 10, 30]);
        }
    },
    success: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([10, 50, 10]);
        }
    },
    error: () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
        }
    },
};

// Pull-to-refresh component
interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    className?: string;
    threshold?: number; // Distance to trigger refresh (px)
}

export const PullToRefresh = ({
    onRefresh,
    children,
    className = '',
    threshold = 80,
}: PullToRefreshProps) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [canPull, setCanPull] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    const handleTouchStart = (e: TouchEvent) => {
        const container = containerRef.current;
        if (!container) return;

        // Only allow pull-to-refresh if scrolled to top
        if (container.scrollTop === 0) {
            setCanPull(true);
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!canPull || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const distance = currentY.current - startY.current;

        if (distance > 0) {
            // Prevent default scroll behavior
            e.preventDefault();

            // Apply resistance (diminishing returns)
            const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
            setPullDistance(resistedDistance);

            // Haptic feedback at threshold
            if (resistedDistance >= threshold && pullDistance < threshold) {
                haptic.medium();
            }
        }
    };

    const handleTouchEnd = async () => {
        if (!canPull) return;

        setCanPull(false);

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            haptic.success();

            try {
                await onRefresh();
            } catch (error) {
                console.error('[PullToRefresh] Error:', error);
                haptic.error();
            } finally {
                setIsRefreshing(false);
            }
        }

        setPullDistance(0);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [canPull, pullDistance, isRefreshing]);

    const rotation = (pullDistance / threshold) * 360;

    return (
        <div ref={containerRef} className={`relative overflow-auto ${className}`}>
            {/* Pull indicator */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
                style={{
                    height: pullDistance,
                    opacity: pullDistance > 0 ? 1 : 0,
                }}
            >
                <div className="flex flex-col items-center gap-2">
                    {/* Spinner */}
                    <div
                        className={`h-8 w-8 rounded-full border-4 border-primary border-t-transparent transition-transform ${isRefreshing ? 'animate-spin' : ''
                            }`}
                        style={{
                            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
                        }}
                    />

                    {/* Text */}
                    <p className="text-xs text-text-light/60 dark:text-text-dark/60">
                        {isRefreshing
                            ? 'Refreshing...'
                            : pullDistance >= threshold
                                ? 'Release to refresh'
                                : 'Pull to refresh'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: isRefreshing || pullDistance === 0 ? 'transform 0.2s' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
};

// Enhanced button with haptic feedback
interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    hapticType?: 'light' | 'medium' | 'heavy';
    children: ReactNode;
}

export const HapticButton = ({
    hapticType = 'light',
    onClick,
    children,
    className = '',
    ...props
}: HapticButtonProps) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        haptic[hapticType]();
        onClick?.(e);
    };

    return (
        <button
            onClick={handleClick}
            className={`min-w-[44px] min-h-[44px] ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// Touch-friendly icon button
export const TouchIconButton = ({
    icon,
    onClick,
    label,
    className = '',
    hapticType = 'light',
}: {
    icon: string;
    onClick: () => void;
    label: string;
    className?: string;
    hapticType?: 'light' | 'medium' | 'heavy';
}) => {
    const handleClick = () => {
        haptic[hapticType]();
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            aria-label={label}
            className={`
        flex items-center justify-center
        min-w-[44px] min-h-[44px]
        rounded-full
        hover:bg-gray-100 dark:hover:bg-gray-800
        active:scale-95
        transition-all
        ${className}
      `}
        >
            <span className="material-symbols-outlined">{icon}</span>
        </button>
    );
};

// Swipeable card component
interface SwipeableCardProps {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    children: ReactNode;
    className?: string;
    threshold?: number;
}

export const SwipeableCard = ({
    onSwipeLeft,
    onSwipeRight,
    children,
    className = '',
    threshold = 100,
}: SwipeableCardProps) => {
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const startX = useRef(0);
    const currentX = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsSwiping(true);
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;

        currentX.current = e.touches[0].clientX;
        const distance = currentX.current - startX.current;
        setOffset(distance);

        // Haptic feedback at threshold
        if (Math.abs(distance) >= threshold && Math.abs(offset) < threshold) {
            haptic.light();
        }
    };

    const handleTouchEnd = () => {
        setIsSwiping(false);

        if (offset >= threshold && onSwipeRight) {
            haptic.success();
            onSwipeRight();
        } else if (offset <= -threshold && onSwipeLeft) {
            haptic.success();
            onSwipeLeft();
        }

        setOffset(0);
    };

    return (
        <div
            className={`touch-pan-y ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: `translateX(${offset}px)`,
                transition: isSwiping ? 'none' : 'transform 0.2s',
            }}
        >
            {children}
        </div>
    );
};

export default PullToRefresh;
