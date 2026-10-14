interface AIButtonProps {
    onClick: (e?: React.MouseEvent) => void;
    loading?: boolean;
    label?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
    className?: string;
}

export default function AIButton({
    onClick,
    loading = false,
    label = 'AI Assist',
    variant = 'primary',
    disabled = false,
    className = ''
}: AIButtonProps) {
    const baseStyles = 'flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95',
        secondary: 'bg-white dark:bg-[#342418] border-2 border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/20',
        ghost: 'text-primary hover:bg-primary/10 dark:hover:bg-primary/20'
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        >
            {loading ? (
                <>
                    <span className="material-symbols-outlined animate-spin text-lg">
                        refresh
                    </span>
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined text-lg">
                        auto_awesome
                    </span>
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}
