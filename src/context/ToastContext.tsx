import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev.slice(-2), { id, message, type }]); // Keep maximum 3 toasts visible

        setTimeout(() => {
            removeToast(id);
        }, 3500);
    }, [removeToast]);

    const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
    const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
    const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
                {toasts.map(t => {
                    const iconName = t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info';
                    const iconColor = t.type === 'success' ? 'text-emerald-500' : t.type === 'error' ? 'text-red-500' : 'text-primary';
                    const borderColor = t.type === 'success' ? 'border-emerald-500/20' : t.type === 'error' ? 'border-red-500/20' : 'border-primary/20';

                    return (
                        <div
                            key={t.id}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border ${borderColor} shadow-2xl shadow-black/20 text-zinc-900 dark:text-white animate-in slide-in-from-top-3 fade-in duration-300`}
                        >
                            <span className={`material-symbols-outlined text-xl ${iconColor}`}>
                                {iconName}
                            </span>
                            <p className="text-xs font-bold flex-1 tracking-tight leading-snug">
                                {t.message}
                            </p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
