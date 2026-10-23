import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowGuest?: boolean;
}

export default function ProtectedRoute({ children, allowGuest = false }: ProtectedRouteProps) {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        console.log('[ProtectedRoute] Auth state:', {
            loading,
            hasUser: !!currentUser,
            userId: currentUser?.uid,
            path: location.pathname,
            allowGuest
        });
    }, [loading, currentUser, location.pathname, allowGuest]);

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

    if (!currentUser && !allowGuest) {
        console.log('[ProtectedRoute] No user found and route requires auth, redirecting to login with return URL:', location.pathname);
        // Preserve the current path so user can return after login
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    const isShowreelViewer = location.pathname.startsWith('/showreel/view');
    const isStudioPage = ['/create-blog', '/edit-blog', '/create-event', '/post-job', '/showreel/upload'].some(p => location.pathname.startsWith(p));
    const isStandalone = location.pathname.startsWith('/-admin') || isShowreelViewer || isStudioPage;

    return (
        <div className={`min-h-screen ${
            isShowreelViewer ? 'bg-black text-white' : 'bg-background-light dark:bg-background-dark'
        } transition-all duration-300 ${
            isStandalone ? '' : 'md:pl-20 xl:pl-64'
        }`}>
            {children}
        </div>
    );
}
