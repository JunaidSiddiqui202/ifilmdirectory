// Dark/Light Mode Toggle Component

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        // Check system preference or localStorage
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        setIsDark(shouldBeDark);

        // Apply theme
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-14 h-7 rounded-full p-1
        bg-gray-300 dark:bg-gray-700
        transition-colors duration-300
        ${className}
      `}
            aria-label="Toggle theme"
        >
            {/* Toggle circle */}
            <motion.div
                className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 shadow-md flex items-center justify-center"
                animate={{
                    x: isDark ? 28 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {/* Icon */}
                <span className="material-symbols-outlined text-xs">
                    {isDark ? 'dark_mode' : 'light_mode'}
                </span>
            </motion.div>
        </button>
    );
};

// Alternative: Icon-based toggle
export const ThemeToggleIcon = ({ className = '' }: { className?: string }) => {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        setIsDark(shouldBeDark);

        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);

        if (newTheme) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <motion.button
            onClick={toggleTheme}
            className={`
        p-2 rounded-full
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-colors
        ${className}
      `}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
        >
            <motion.span
                className="material-symbols-outlined text-2xl"
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3 }}
            >
                {isDark ? 'dark_mode' : 'light_mode'}
            </motion.span>
        </motion.button>
    );
};

export default ThemeToggle;
