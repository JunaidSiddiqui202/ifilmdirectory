// Error Boundary Component for graceful error handling with automatic chunk-retry and dark luxury UI

import { Component, type ReactNode, type ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isChunkError: boolean;
    showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            isChunkError: false,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        const message = error?.message || error?.toString() || '';
        const isChunkError =
            message.includes('dynamically imported module') ||
            message.includes('Loading chunk') ||
            message.includes('Unexpected token') ||
            message.includes('Importing a module script failed');

        return {
            hasError: true,
            error,
            isChunkError,
            showDetails: false,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to Sentry
        try {
            Sentry.captureException(error, {
                contexts: {
                    react: {
                        componentStack: errorInfo.componentStack,
                    },
                },
            });
        } catch (e) {
            console.error('Sentry logging failed:', e);
        }

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        const message = error?.message || error?.toString() || '';
        const isChunkError =
            message.includes('dynamically imported module') ||
            message.includes('Loading chunk') ||
            message.includes('Unexpected token') ||
            message.includes('Importing a module script failed');

        // If it's a chunk/version mismatch error after a fresh deployment, auto-reload once to pick up new bundles
        if (isChunkError) {
            const hasAutoReloaded = sessionStorage.getItem('chunk_auto_reloaded');
            if (!hasAutoReloaded) {
                sessionStorage.setItem('chunk_auto_reloaded', 'true');
                console.warn('[ErrorBoundary] New deployment detected. Auto-refreshing application...');
                setTimeout(() => {
                    window.location.reload();
                }, 300);
                return;
            }
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            isChunkError: false,
            showDetails: false,
        });
    };

    handleHardReload = () => {
        try {
            sessionStorage.clear();
            if ('caches' in window) {
                caches.keys().then((keys) => {
                    keys.forEach((k) => caches.delete(k));
                });
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((r) => r.unregister());
                });
            }
        } catch (e) {
            console.warn('Cache clearing warning:', e);
        }

        // Force a hard reload of current URL with cache busting parameter
        try {
            const url = new URL(window.location.href);
            url.searchParams.set('_r', Date.now().toString());
            window.location.href = url.toString();
        } catch {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error, isChunkError, showDetails } = this.state;

            return (
                <div className="min-h-[100dvh] w-full flex items-center justify-center bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white p-4 font-display selection:bg-amber-500/20 selection:text-amber-500 dark:selection:text-amber-300 transition-colors">
                    <div className="max-w-md w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] rounded-3xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
                        {/* Ambient glow */}
                        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Icon */}
                        <div className="size-20 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-500 dark:text-amber-400 shadow-lg shadow-amber-500/10">
                            <span className="material-symbols-outlined text-4xl">
                                {isChunkError ? 'browser_updated' : 'warning'}
                            </span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">
                            {isChunkError ? 'New Update Ready' : 'Oops! Something went wrong'}
                        </h1>

                        {/* Description */}
                        <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            {isChunkError
                                ? 'A fresh version of iFilmDirectory has been deployed. Tap below to refresh and load the latest features.'
                                : 'We encountered an unexpected glitch. Tap below to reload your session or return to the directory.'}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleHardReload}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">refresh</span>
                                <span>{isChunkError ? 'Update & Reload' : 'Reload & Try Again'}</span>
                            </button>

                            <button
                                onClick={() => (window.location.href = '/home')}
                                className="w-full py-3 px-4 bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                            >
                                Go to Home
                            </button>
                        </div>

                        {/* Diagnostic Details Accordion */}
                        {error && (
                            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/[0.06] text-left">
                                <button
                                    onClick={() => this.setState({ showDetails: !showDetails })}
                                    className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                                >
                                    <span>Diagnostic Details</span>
                                    <span className="material-symbols-outlined text-sm">
                                        {showDetails ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>

                                {showDetails && (
                                    <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/[0.06] overflow-x-auto">
                                        <p className="text-[11px] font-mono text-red-600 dark:text-red-400 break-all leading-normal">
                                            {error.toString()}
                                        </p>
                                        {error.stack && (
                                            <pre className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 mt-2 whitespace-pre-wrap max-h-36 overflow-y-auto">
                                                {error.stack.split('\n').slice(0, 5).join('\n')}
                                            </pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
