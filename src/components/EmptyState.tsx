// Empty State Component - Backward compatible with existing code

import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface EmptyStateProps {
    icon: string;
    // New prop names
    title?: string;
    description?: string;
    action?: ReactNode;
    // Old prop names (backward compatibility)
    message?: string;
    subMessage?: string;
    actionLabel?: string;
    onAction?: () => void;
    illustration?: string;
}

const EmptyState = ({
    icon,
    title,
    description,
    message,
    subMessage,
    actionLabel,
    action,
    onAction,
    illustration,
}: EmptyStateProps) => {
    // Use new props if available, fall back to old ones
    const displayTitle = title || message || '';
    const displayDescription = description || subMessage || '';

    // Create action button from old props if needed
    const displayAction = action || (onAction && actionLabel ? (
        <button
            onClick={onAction}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
            {actionLabel}
        </button>
    ) : null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            {illustration ? (
                <img src={illustration} alt={displayTitle} className="w-48 h-48 mb-6 opacity-50" />
            ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-6xl text-gray-400">
                        {icon}
                    </span>
                </div>
            )}

            <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">
                {displayTitle}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {displayDescription}
            </p>

            {displayAction && <div>{displayAction}</div>}
        </motion.div>
    );
};

export default EmptyState;
