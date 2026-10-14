import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { type User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { unregisterFCMToken } from '../services/fcmService';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const authInitialized = useRef(false);

    useEffect(() => {
        console.log('[AuthContext] Initializing auth listener...');

        // Safety timeout: Force loading to complete after 10 seconds
        const loadingTimeout = setTimeout(() => {
            if (!authInitialized.current) {
                console.warn('[AuthContext] Auth initialization timeout - forcing loading complete');
                setLoading(false);
                setAuthError('Auth initialization timeout');
                authInitialized.current = true;
            }
        }, 10000);

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                console.log('[AuthContext] Auth state changed:', user ? `User: ${user.uid}` : 'No user');
                clearTimeout(loadingTimeout);
                authInitialized.current = true;
                setCurrentUser(user);
                setLoading(false);
                setAuthError(null);

                // Register for push notifications when user logs in
                if (user) {
                    try {
                        // Temporarily disabled to prevent 'atob' error flashing
                        // await registerFCMToken(user.uid);

                        // Listen for foreground messages
                        // listenForMessages((payload) => {
                        //     console.log('Notification received:', payload);
                        //     // Notification is automatically shown by fcmService
                        // });
                    } catch (error) {
                        console.error('[AuthContext] Failed to register for notifications:', error);
                    }
                } else {
                    // User logged out - unregister token
                    const previousUser = auth.currentUser;
                    if (previousUser) {
                        try {
                            await unregisterFCMToken(previousUser.uid);
                        } catch (error) {
                            console.error('[AuthContext] Failed to unregister notifications:', error);
                        }
                    }
                }
            },
            (error) => {
                // Error callback for onAuthStateChanged
                console.error('[AuthContext] Auth state change error:', error);
                clearTimeout(loadingTimeout);
                authInitialized.current = true;
                setLoading(false);
                setAuthError(error.message);
            }
        );

        return () => {
            clearTimeout(loadingTimeout);
            unsubscribe();
        };
    }, []);

    const logout = async () => {
        if (currentUser) {
            await unregisterFCMToken(currentUser.uid);
        }
        return signOut(auth);
    };

    const value = {
        currentUser,
        loading,
        logout
    };

    // Always render children, but show loading overlay if needed
    return (
        <AuthContext.Provider value={value}>
            {children}
            {authError && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ef4444',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    zIndex: 9999,
                    fontSize: '14px'
                }}>
                    Auth Error: {authError}
                </div>
            )}
        </AuthContext.Provider>
    );
}
