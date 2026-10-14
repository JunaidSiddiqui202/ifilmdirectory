import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        console.log('[ProtectedRoute] Auth state:', {
            loading,
            hasUser: !!currentUser,
            userId: currentUser?.uid,
            path: location.pathname
        });
    }, [loading, currentUser, location.pathname]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                        Verifying authentication...
                    </p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        console.log('[ProtectedRoute] No user found, redirecting to login with return URL:', location.pathname);
        // Preserve the current path so user can return after login
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    const isStandalone = location.pathname.startsWith('/-admin');

    return (
        <div className={`min-h-screen bg-background-light dark:bg-background-dark transition-all duration-300 ${
            isStandalone ? '' : 'md:pl-20 xl:pl-64'
        }`}>
            {children}
        </div>
    );
}
