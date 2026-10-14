import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DeepLinkHandler - Handles deep links from emails and external sources
 * This component ensures proper authentication before redirecting to protected routes
 */
export default function DeepLinkHandler() {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('[DeepLinkHandler] Current state:', { loading, hasUser: !!currentUser });

        // Wait for auth to complete
        if (loading) {
            return;
        }

        // Get the intended destination from URL params or default to home
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/home';

        if (currentUser) {
            console.log('[DeepLinkHandler] User authenticated, redirecting to:', redirect);
            navigate(redirect, { replace: true });
        } else {
            console.log('[DeepLinkHandler] No user, redirecting to login with return URL');
            navigate(`/login?redirect=${encodeURIComponent(redirect)}`, { replace: true });
        }
    }, [currentUser, loading, navigate]);

    return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">
                    Loading iFilmDirectory
                </h2>
                <p className="text-sm text-text-light/60 dark:text-text-dark/60 max-w-md">
                    {loading ? 'Verifying your authentication...' : 'Redirecting you to the right place...'}
                </p>
            </div>
        </div>
    );
}
