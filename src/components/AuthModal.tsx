import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { createUserProfile } from '../services/userService';
import { useToast } from '../context/ToastContext';
import Logo from './Logo';

export default function AuthModal() {
    const { isOpen, reason, closeAuthModal, onSuccessLogin } = useAuthModal();
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                closeAuthModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeAuthModal]);

    if (!isOpen) return null;

    const returnUrl = encodeURIComponent(location.pathname + location.search);

    const handleGoogleSignIn = async () => {
        if (googleLoading) return;
        setGoogleLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            try {
                await createUserProfile(result.user);
            } catch (profileErr) {
                console.warn('[AuthModal] Profile init warning:', profileErr);
            }
            toast.success(`Welcome, ${result.user.displayName || 'Filmmaker'}!`);
            onSuccessLogin();
        } catch (err: any) {
            console.error('[AuthModal] Google Sign-In Error:', err);
            if (err?.code !== 'auth/popup-closed-by-user') {
                toast.error(err?.message || 'Google sign-in failed. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleEmailSignIn = () => {
        closeAuthModal();
        navigate(`/login?redirect=${returnUrl}`);
    };

    const handleEmailSignUp = () => {
        closeAuthModal();
        navigate(`/login?tab=signup&redirect=${returnUrl}`);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
            onClick={closeAuthModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <div
                className="w-full sm:max-w-md bg-white dark:bg-[#121316] rounded-t-[32px] sm:rounded-3xl border border-zinc-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 text-zinc-900 dark:text-white max-h-[92vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Logo and Close Button */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
                    <Logo size="sm" showText={true} />
                    <button
                        onClick={closeAuthModal}
                        className="size-8 rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                        title="Close"
                        aria-label="Close"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Contextual Action Banner */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/[0.08] border border-amber-500/20 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
                        <span className="material-symbols-outlined text-xs">lock</span>
                        <span>Sign In Required</span>
                    </div>
                    <h3 id="auth-modal-title" className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                        {reason}
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                        Free access for actors, directors, technicians, crew & creators across Indian cinema.
                    </p>
                </div>

                {/* Primary: Google 1-Click Sign-In */}
                <div className="space-y-3 pt-1">
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-300 dark:border-white/15 font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                    >
                        {googleLoading ? (
                            <>
                                <div className="size-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                                <span>Connecting to Google...</span>
                            </>
                        ) : (
                            <>
                                <svg className="size-5 shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-white/10" />
                        </div>
                        <span className="relative bg-white dark:bg-[#121316] px-3 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                            Or with email
                        </span>
                    </div>

                    {/* Email Sign In & Register Buttons */}
                    <div className="grid grid-cols-2 gap-2.5">
                        <button
                            onClick={handleEmailSignIn}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-800 dark:text-white font-bold text-xs border border-zinc-200 dark:border-white/5 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <span>Sign In</span>
                        </button>
                        <button
                            onClick={handleEmailSignUp}
                            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">person_add</span>
                            <span>Register Free</span>
                        </button>
                    </div>
                </div>

                {/* Frictionless Dismiss: Continue as Guest */}
                <div className="pt-2 text-center border-t border-zinc-100 dark:border-white/5">
                    <button
                        onClick={closeAuthModal}
                        className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium py-1 transition-colors"
                    >
                        Continue browsing as guest
                    </button>
                </div>
            </div>
        </div>
    );
}
