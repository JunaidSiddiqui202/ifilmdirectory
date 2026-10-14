// Analytics and monitoring utilities - simplified version

// ==================== EVENT TRACKING ====================

interface AnalyticsEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
}

class Analytics {
    private queue: AnalyticsEvent[] = [];
    private isInitialized = false;

    init() {
        this.isInitialized = true;
        console.log('[Analytics] Initialized');

        // Flush queued events
        this.queue.forEach(event => this.sendEvent(event));
        this.queue = [];
    }

    private sendEvent(event: AnalyticsEvent) {
        // Google Analytics 4
        if (window.gtag) {
            window.gtag('event', event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
            });
        }

        // Log in development
        if (import.meta.env.DEV) {
            console.log('[Analytics]', event);
        }
    }

    track(event: AnalyticsEvent) {
        if (!this.isInitialized) {
            this.queue.push(event);
            return;
        }

        this.sendEvent(event);
    }

    pageView(path: string) {
        this.track({
            category: 'Page',
            action: 'view',
            label: path,
        });
    }

    userAction(action: string, label?: string, value?: number) {
        this.track({
            category: 'User',
            action,
            label,
            value,
        });
    }

    conversion(action: string, value?: number) {
        this.track({
            category: 'Conversion',
            action,
            value,
        });
    }
}

export const analytics = new Analytics();

// ==================== PERFORMANCE MONITORING ====================

class PerformanceMonitor {
    private metrics = new Map<string, number>();

    start(label: string) {
        this.metrics.set(label, performance.now());
    }

    end(label: string) {
        const startTime = this.metrics.get(label);
        if (!startTime) return;

        const duration = performance.now() - startTime;
        this.metrics.delete(label);

        analytics.track({
            category: 'Performance',
            action: label,
            value: Math.round(duration),
        });

        return duration;
    }

    async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
        this.start(label);
        try {
            const result = await fn();
            this.end(label);
            return result;
        } catch (error) {
            this.end(label);
            throw error;
        }
    }

    getCoreWebVitals() {
        if ('PerformanceObserver' in window) {
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    analytics.track({
                        category: 'Web Vitals',
                        action: 'LCP',
                        value: Math.round(lastEntry.startTime),
                    });
                }).observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('[Performance] LCP not supported');
            }
        }
    }

    monitorResources() {
        if ('PerformanceObserver' in window) {
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry: any) => {
                        if (entry.duration > 1000) {
                            analytics.track({
                                category: 'Resource',
                                action: 'slow_load',
                                label: entry.name,
                                value: Math.round(entry.duration),
                            });
                        }
                    });
                }).observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('[Performance] Resource monitoring not supported');
            }
        }
    }
}

export const performanceMonitor = new PerformanceMonitor();

// ==================== USER BEHAVIOR TRACKING ====================

export const trackUserBehavior = {
    jobView: (jobId: string) => analytics.userAction('job_view', jobId),
    jobApply: (jobId: string) => {
        analytics.conversion('job_apply', 1);
        analytics.userAction('job_apply', jobId);
    },
    profileView: (profileId: string) => analytics.userAction('profile_view', profileId),
    postLike: (postId: string) => analytics.userAction('post_like', postId),
    search: (query: string, count: number) => analytics.userAction('search', query, count),
};

// ==================== INITIALIZE ====================

export const initializeAnalytics = () => {
    analytics.init();
    performanceMonitor.getCoreWebVitals();
    performanceMonitor.monitorResources();
    console.log('[Analytics] Tracking initialized');
};

// Declare gtag for TypeScript
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export default {
    analytics,
    performanceMonitor,
    trackUserBehavior,
    initializeAnalytics,
};
