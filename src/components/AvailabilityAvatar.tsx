import { useId } from 'react';
import PostMedia from './PostMedia';
import { getAvailabilityConfig } from '../services/userService';
import { CINEMATIC_PLACEHOLDERS } from '../constants/images';

export interface AvailabilityAvatarProps {
    src?: string | null;
    alt?: string;
    status?: string; // 'available' | 'working' | 'unavailable' | 'casting' | custom
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    shape?: 'circle' | 'rounded';
    className?: string;
    imgClassName?: string;
    showRibbon?: boolean;
    fallbackType?: keyof typeof CINEMATIC_PLACEHOLDERS;
    onClick?: () => void;
    title?: string;
}

// Size mappings for container
const SIZE_CLASSES: Record<string, { container: string; showText: boolean; fontSize: number; ribbonStroke: number; ringWidth: number }> = {
    xs: { container: 'size-7 sm:size-8', showText: false, fontSize: 0, ribbonStroke: 6, ringWidth: 2 },
    sm: { container: 'size-9 sm:size-10', showText: false, fontSize: 0, ribbonStroke: 8, ringWidth: 2 },
    md: { container: 'size-12 sm:size-14', showText: true, fontSize: 8.2, ribbonStroke: 14.5, ringWidth: 2.5 },
    lg: { container: 'size-16 sm:size-20', showText: true, fontSize: 8.5, ribbonStroke: 15, ringWidth: 2.5 },
    xl: { container: 'size-24 sm:size-28', showText: true, fontSize: 9.0, ribbonStroke: 16, ringWidth: 3 },
    '2xl': { container: 'size-32 sm:size-36 md:size-40', showText: true, fontSize: 9.5, ribbonStroke: 17, ringWidth: 3.5 },
    full: { container: 'w-full h-full', showText: true, fontSize: 9.0, ribbonStroke: 16, ringWidth: 3 }
};

export default function AvailabilityAvatar({
    src,
    alt = 'Filmmaker',
    status,
    size = 'md',
    shape = 'circle',
    className = '',
    imgClassName = '',
    showRibbon = true,
    fallbackType = 'USER_MALE',
    onClick,
    title
}: AvailabilityAvatarProps) {
    const rawId = useId();
    const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
    const pathId = `avail-arc-${cleanId}`;

    const isCasting = status === 'casting';
    const avail = getAvailabilityConfig(status);
    const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    // Determine colors and label
    let ringColor = 'stroke-emerald-500';
    let ringGlow = 'rgba(16, 185, 129, 0.4)';
    let ribbonBg = '#059669'; // Emerald-600
    let ribbonText = '#AVAILABLE';
    let dotColor = 'bg-emerald-500';
    let hasActiveStatus = true;

    if (isCasting) {
        ringColor = 'stroke-purple-500';
        ringGlow = 'rgba(168, 85, 247, 0.4)';
        ribbonBg = '#7c3aed'; // Violet-600
        ribbonText = '#CASTING NOW';
        dotColor = 'bg-purple-500';
    } else if (avail.code === 'working') {
        ringColor = 'stroke-amber-500';
        ringGlow = 'rgba(245, 158, 11, 0.4)';
        ribbonBg = '#d97706'; // Amber-600
        ribbonText = '#UPCOMING';
        dotColor = 'bg-amber-500';
    } else if (avail.code === 'unavailable') {
        hasActiveStatus = false;
        ringColor = 'stroke-zinc-500/40';
        ringGlow = 'transparent';
        ribbonBg = '#3f3f46';
        ribbonText = '#UNAVAILABLE';
        dotColor = 'bg-zinc-500';
    }

    const containerShape = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

    return (
        <div
            onClick={onClick}
            title={title || (hasActiveStatus ? avail.label : undefined)}
            className={`relative shrink-0 select-none ${sizeConfig.container} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {/* The Image inside container */}
            <div className={`w-full h-full overflow-hidden bg-black ${containerShape} shadow-inner`}>
                <PostMedia
                    src={src || ''}
                    alt={alt}
                    fallbackType={fallbackType}
                    className={`w-full h-full object-cover ${imgClassName}`}
                />
            </div>

            {/* Circular LinkedIn-style curved ribbon overlay */}
            {shape === 'circle' && showRibbon && hasActiveStatus && (
                <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                    style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.4))` }}
                >
                    <defs>
                        {/* Text arc along bottom curve: sweeping left to right through bottom center */}
                        <path
                            id={pathId}
                            d="M 14,75.2 A 44,44 0 0,0 86,75.2"
                            fill="none"
                        />
                        <filter id={`glow-${cleanId}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
                        </filter>
                    </defs>

                    {/* Outer accent ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="47"
                        fill="none"
                        className={ringColor}
                        strokeWidth={sizeConfig.ringWidth}
                        style={{ filter: `drop-shadow(0 0 2px ${ringGlow})` }}
                    />

                    {/* Ribbon Background Arc (covers bottom perimeter) */}
                    <path
                        d="M 14,75.2 A 44,44 0 0,0 86,75.2"
                        fill="none"
                        stroke={ribbonBg}
                        strokeWidth={sizeConfig.ribbonStroke}
                        strokeLinecap="round"
                    />

                    {/* Inner highlight line on ribbon */}
                    <path
                        d="M 15,74.5 A 44,44 0 0,0 85,74.5"
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />

                    {/* Curved Ribbon Text: only shown if size has room for legibility */}
                    {sizeConfig.showText && (
                        <text
                            fill="#ffffff"
                            fontSize={sizeConfig.fontSize}
                            fontWeight="900"
                            letterSpacing="0.8px"
                            style={{ filter: `url(#glow-${cleanId})`, textTransform: 'uppercase', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                            <textPath
                                href={`#${pathId}`}
                                xlinkHref={`#${pathId}`}
                                startOffset="50%"
                                textAnchor="middle"
                            >
                                {ribbonText}
                            </textPath>
                        </text>
                    )}
                </svg>
            )}

            {/* Small sizes (xs / sm) or rounded shape: Show crisp status indicator dot if text is hidden */}
            {(!sizeConfig.showText || shape === 'rounded') && hasActiveStatus && (
                <span
                    className={`absolute bottom-0 right-0 size-2.5 sm:size-3 rounded-full border-2 border-white dark:border-[#121316] ${dotColor} shadow-md`}
                    title={avail.label}
                />
            )}
        </div>
    );
}
