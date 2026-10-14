// Error Boundary Component for graceful error handling

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
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to Sentry
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: errorInfo.componentStack,
                },
            },
        });

        // Call custom error handler
        this.props.onError?.(error, errorInfo);

        // Log to console in development
        if (import.meta.env.DEV) {
            console.error('Error Boundary caught an error:', error, errorInfo);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-6xl text-red-500">
                                error_outline
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We're sorry for the inconvenience. The error has been reported and we'll fix it soon.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => (window.location.href = '/')}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for easier use
export const withErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) => {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
};

// Page-level error boundary with custom styling
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
    <ErrorBoundary
        fallback={
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-6xl text-red-500">
                            error_outline
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                        Page Error
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This page encountered an error. Please try refreshing or go back to the home page.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Refresh Page
                        </button>

                        <button
                            onClick={() => (window.location.href = '/')}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">home</span>
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        }
    >
        {children}
    </ErrorBoundary>
);

// Component-level error boundary (smaller, inline)
export const ComponentErrorBoundary = ({ children }: { children: ReactNode }) => (
    <ErrorBoundary
        fallback={
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">error_outline</span>
                    <div>
                        <p className="font-semibold text-red-700 dark:text-red-400">
                            Component Error
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-500">
                            This component failed to load. Try refreshing the page.
                        </p>
                    </div>
                </div>
            </div>
        }
    >
        {children}
    </ErrorBoundary>
);

export default ErrorBoundary;
