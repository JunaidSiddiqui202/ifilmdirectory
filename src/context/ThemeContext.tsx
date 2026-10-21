import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'day' | 'night';

interface ThemeContextType {
    isDarkMode: boolean;
    themeMode: ThemeMode;
    toggleDarkMode: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    theme: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTheme: (theme: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        // If user explicitly chose a theme, respect their saved choice
        const userExplicitChoice = localStorage.getItem('theme_user_chosen');
        if (userExplicitChoice === 'true') {
            const saved = localStorage.getItem('isDarkMode');
            if (saved !== null) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') return true;
            if (savedTheme === 'light') return false;
        }
        // Day theme (Studio Light Mode) is the DEFAULT for fresh visitors
        return false;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Purge legacy color accent classes
        root.classList.remove('theme-blue', 'theme-red', 'theme-green', 'theme-purple', 'theme-gold');
        localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
        localStorage.setItem('themeMode', isDarkMode ? 'night' : 'day');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        localStorage.setItem('theme_user_chosen', 'true');
        setIsDarkMode(prev => !prev);
    };
    const setThemeMode = (mode: ThemeMode) => {
        localStorage.setItem('theme_user_chosen', 'true');
        setIsDarkMode(mode === 'night');
    };

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            themeMode: isDarkMode ? 'night' : 'day',
            toggleDarkMode,
            setThemeMode,
            theme: isDarkMode ? 'night' : 'day',
            setTheme: (t: any) => setIsDarkMode(t === 'night' || t === 'dark')
        }}>
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

