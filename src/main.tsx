import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import './index.css'
import App from './App.tsx'

import { ThemeProvider } from './context/ThemeContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { initializeAnalytics } from './utils/analytics';
import ErrorBoundary from './components/ErrorBoundary';

// Initialize Sentry for error tracking and performance monitoring
// Only enable in production to avoid noise during development
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    release: `ifilmdirectory@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Script error.',
    ],
  });

  console.log('[Sentry] Error tracking initialized');
}

// Initialize analytics (only in production)
if (import.meta.env.PROD) {
  initializeAnalytics();
}

/**
 * MANDATORY FIX FOR BLANK SCREEN:
 * Unregister any existing Service Workers that might be causing stale cache issues.
 * This is critical because registration was recently disabled/commented out,
 * leaving old users stuck with broken cached versions.
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      console.log('[App] Unregistering stale Service Worker:', registration.scope);
      registration.unregister();
    }
  }).catch(err => console.error('[App] Failed to unregister Service Workers:', err));
}

// Add a global error listener for early-stage failures and dynamic chunk mismatch
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error || event.message);
  const msg = (event.error?.message || event.message || '').toString();
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Unexpected token') ||
    msg.includes('Importing a module script failed')
  ) {
    const reloaded = sessionStorage.getItem('chunk_unhandled_reloaded');
    if (!reloaded) {
      sessionStorage.setItem('chunk_unhandled_reloaded', 'true');
      console.warn('[Global] Stale bundle mismatch detected. Auto-refreshing app...');
      window.location.reload();
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event.reason?.message || event.reason?.toString() || '').toString();
  if (
    reason.includes('dynamically imported module') ||
    reason.includes('Loading chunk') ||
    reason.includes('Unexpected token') ||
    reason.includes('Importing a module script failed')
  ) {
    const reloaded = sessionStorage.getItem('chunk_unhandled_reloaded');
    if (!reloaded) {
      sessionStorage.setItem('chunk_unhandled_reloaded', 'true');
      console.warn('[Global] Stale chunk rejection detected. Auto-refreshing app...');
      window.location.reload();
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

