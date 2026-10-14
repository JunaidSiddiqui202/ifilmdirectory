import React, { createContext, useContext, useEffect, useState } from 'react';
// Triggering re-process to fix potential hook issues in dev server

type Theme = 'gold' | 'blue' | 'red' | 'green' | 'purple';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('isDarkMode');
        return saved ? JSON.parse(saved) : true; // Default to dark
    });

    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'gold';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    useEffect(() => {
        const root = window.document.documentElement;
        // Remove all theme classes
        root.classList.remove('theme-gold', 'theme-blue', 'theme-red', 'theme-green', 'theme-purple');
        // Add current theme class (if not default gold, though gold is default in CSS, adding class ensures specificity if needed, or we can skip for gold)
        if (theme !== 'gold') {
            root.classList.add(`theme-${theme}`);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const setTheme = (newTheme: Theme) => setThemeState(newTheme);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
