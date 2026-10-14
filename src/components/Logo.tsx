import logoImg from '../assets/logo.png';

interface LogoProps {
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    showText?: boolean;
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
    const sizeClasses = {
        xs: 'h-5',
        sm: 'h-7',
        md: 'h-9',
        lg: 'h-14',
        xl: 'h-20',
        '2xl': 'h-28',
        '3xl': 'h-36'
    };

    const textSizes = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-lg',
        lg: 'text-2xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl',
        '3xl': 'text-5xl'
    };

    return (
        <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
            <img
                src={logoImg}
                alt="iFilmDirectory Logo"
                className={`${sizeClasses[size]} w-auto object-contain antialiased select-none`}
            />
            {showText && (
                <span className={`font-black tracking-tight text-white ${textSizes[size]} font-display`}>
                    iFilm<span className="text-amber-500">Directory</span>
                </span>
            )}
        </div>
    );
}
