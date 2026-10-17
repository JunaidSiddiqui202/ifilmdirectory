// Dark/Light Mode Toggle Component (Connected to ThemeContext)

import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <button
            onClick={toggleDarkMode}
            type="button"
            className={`
                relative w-14 h-7 rounded-full p-1
                bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-white/10
                transition-colors duration-300 cursor-pointer focus:outline-none select-none
                ${className}
            `}
            title={isDarkMode ? "Switch to Day Theme (Studio Light)" : "Switch to Night Theme (Cinematic Dark)"}
            aria-label="Toggle theme"
        >
            {/* Toggle circle */}
            <motion.div
                className="w-5 h-5 rounded-full bg-white dark:bg-amber-400 shadow-md flex items-center justify-center text-zinc-800 dark:text-black"
                animate={{
                    x: isDarkMode ? 28 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {/* Icon */}
                <span className="material-symbols-outlined text-xs">
                    {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
            </motion.div>
        </button>
    );
};

// Alternative: Icon-based toggle with optional label
export const ThemeToggleIcon = ({ className = '', showLabel = false }: { className?: string; showLabel?: boolean }) => {
    const { isDarkMode, toggleDarkMode } = useTheme();

    return (
        <motion.button
            onClick={toggleDarkMode}
            type="button"
            className={`
                flex items-center gap-1.5 p-2 rounded-xl
                hover:bg-zinc-100 dark:hover:bg-white/[0.08]
                text-zinc-700 dark:text-zinc-200
                transition-colors cursor-pointer select-none
                ${className}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isDarkMode ? "Switch to Day Theme (Studio Light)" : "Switch to Night Theme (Cinematic Dark)"}
            aria-label="Toggle theme"
        >
            <motion.span
                className={`material-symbols-outlined text-xl ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}
                initial={false}
                animate={{ rotate: isDarkMode ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {isDarkMode ? 'light_mode' : 'dark_mode'}
            </motion.span>
            {showLabel && (
                <span className="text-xs font-bold font-display uppercase tracking-wider text-zinc-900 dark:text-white">
                    {isDarkMode ? 'Day' : 'Night'}
                </span>
            )}
        </motion.button>
    );
};

export default ThemeToggle;

