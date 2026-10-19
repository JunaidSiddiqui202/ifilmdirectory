import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface AuthModalContextType {
    isOpen: boolean;
    reason: string;
    openAuthModal: (reason?: string, onAuthenticated?: () => void) => void;
    closeAuthModal: () => void;
    requireAuth: (callback: () => void, reason?: string) => void;
    onSuccessLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('Sign in to continue');
    const pendingActionRef = useRef<(() => void) | null>(null);

    const openAuthModal = useCallback((customReason?: string, onAuthenticated?: () => void) => {
        setReason(customReason || 'Sign in to access all filmmaker features');
        if (onAuthenticated) {
            pendingActionRef.current = onAuthenticated;
        } else {
            pendingActionRef.current = null;
        }
        setIsOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsOpen(false);
        pendingActionRef.current = null;
    }, []);

    const onSuccessLogin = useCallback(() => {
        setIsOpen(false);
        if (pendingActionRef.current) {
            const action = pendingActionRef.current;
            pendingActionRef.current = null;
            try {
                action();
            } catch (err) {
                console.error('[AuthModal] Error executing post-auth callback:', err);
            }
        }
    }, []);

    const requireAuth = useCallback((callback: () => void, customReason?: string) => {
        if (currentUser) {
            callback();
        } else {
            openAuthModal(customReason, callback);
        }
    }, [currentUser, openAuthModal]);

    return (
        <AuthModalContext.Provider
            value={{
                isOpen,
                reason,
                openAuthModal,
                closeAuthModal,
                requireAuth,
                onSuccessLogin
            }}
        >
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
}
