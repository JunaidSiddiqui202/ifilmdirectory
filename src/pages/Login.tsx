import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { createUserProfile, triggerEmail } from '../services/userService';
import Logo from '../components/Logo';
import { useToast } from '../context/ToastContext';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();

    // Initialize tab state based on URL parameter
    const initialTab = searchParams.get('tab');
    const [view, setView] = useState<'login' | 'signup' | 'request'>(initialTab === 'request' ? 'request' : 'login');
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState('');
    const [portfolioLink, setPortfolioLink] = useState('');
    const [role, setRole] = useState<'actor' | 'director' | 'crew' | 'influencer' | 'content_creator' | 'other'>('actor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    // Honeypot state for bot protection
    const [unionCardFrontFile, setUnionCardFrontFile] = useState<File | null>(null);
    const [unionCardBackFile, setUnionCardBackFile] = useState<File | null>(null);
    const [honeyPot, setHoneyPot] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Bot Protection: standard Honeypot check
        if (honeyPot) {
            console.log("Bot detected via honeypot");
            return;
        }

        setError('');
        setLoading(true);

        // Get redirect URL from search params
        const redirectUrl = searchParams.get('redirect') || '/home';

        try {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('[Login] Redirecting to:', redirectUrl);
                navigate(redirectUrl);
            } else if (view === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                // 1. Create the Auth User
                const result = await createUserWithEmailAndPassword(auth, email, password);

                try {
                    // 2. Create the User Profile (this checks for approval)
                    await createUserProfile(result.user, { displayName: fullName });
                    console.log('[Signup] Redirecting to:', redirectUrl);
                    navigate(redirectUrl);
                } catch (profileErr: any) {
                    // 3. Rollback if not authorized
                    await signOut(auth);
                    throw profileErr;
                }
            } else {
                // Request Access Logic
                let unionCardFrontUrl = '';
                let unionCardBackUrl = '';

                const { uploadFile } = await import('../services/storageService');

                if (unionCardFrontFile) {
                    const uploadRes = await uploadFile(unionCardFrontFile);
                    if (uploadRes.error) throw new Error(`Front side: ${uploadRes.error}`);
                    unionCardFrontUrl = uploadRes.url || '';
                }

                if (unionCardBackFile) {
                    const uploadRes = await uploadFile(unionCardBackFile);
                    if (uploadRes.error) throw new Error(`Back side: ${uploadRes.error}`);
                    unionCardBackUrl = uploadRes.url || '';
                }

                await addDoc(collection(db, 'access_requests'), {
                    fullName,
                    email: email.toLowerCase(),
                    role,
                    portfolioLink,
                    unionCardFrontUrl,
                    unionCardBackUrl,
                    status: 'pending',
                    referredBy: localStorage.getItem('referralCode') || null,
                    submittedAt: new Date().toISOString()
                });

                // --- INTERNAL AND EMAIL NOTIFICATIONS ---
                // 1. In-App Notification to Admins
                try {
                    const { notifyAdminsOfNewRequest } = await import('../services/notificationService');
                    await notifyAdminsOfNewRequest(fullName, email);
                } catch (notifErr) {
                    console.error("Failed to send in-app notification:", notifErr);
                }

                // 2. Acknowledgment to User (Email)
                await triggerEmail(email, 'access_request_received', fullName);

                // 3. Alert to Admin (Email Alert to contact@ifilmdirectory.com as requested)
                await triggerEmail('contact@ifilmdirectory.com', 'admin_access_alert', fullName, {
                    serviceType: role, // Mapping role to serviceType template field
                    amount: email      // Mapping email to amount template field to show in the alert
                });

                localStorage.removeItem('referralCode');
                setSubmitted(true);
            }
        } catch (err: any) {
            console.error('Submit Error:', err);
            let msg = err.message || 'Action failed';

            if (err.code === 'auth/invalid-credential') {
                msg = 'Incorrect email or password. If you are a new approved member, please use the "Sign Up" tab to create your account.';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'This email is already registered. Please login instead.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            } else if (err.code === 'permission-denied') {
                msg = 'Firestore Permission Denied (Check rules)';
            }

            setError(`Firebase: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        // Prevent multiple simultaneous popup requests
        if (googleLoading) {
            console.log('Google Sign-In already in progress, ignoring duplicate request');
            return;
        }

        // Get redirect URL from search params
        const redirectUrl = searchParams.get('redirect') || '/home';

        try {
            setError('');
            setGoogleLoading(true);
            console.log('Initiating Google Sign-In...');

            const result = await signInWithPopup(auth, googleProvider);
            console.log('Google Auth successful. Verifying membership...');

            try {
                // This will now throw if the user isn't approved
                await createUserProfile(result.user);
                console.log('User membership verified. Navigating to:', redirectUrl);
                navigate(redirectUrl);
            } catch (profileErr: any) {
                console.warn('Membership check failed:', profileErr.message);
                setError(profileErr.message || 'Access denied');
                // IMPORTANT: Sign out from Firebase Auth so they don't stay "half-logged in"
                const { signOut } = await import('firebase/auth');
                await signOut(auth);
            }
        } catch (err: any) {
            console.error('Google Sign-In Error:', err);

            // Don't show error for cancelled popup (user closed it or clicked again)
            if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
                console.log('Popup was cancelled or closed by user');
                return;
            }

            if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked or domain unauthorized. Please add ifilmdirectory.vercel.app to Firebase Console -> Authentication -> Settings -> Authorized domains.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('Domain unauthorized. Please add ifilmdirectory.vercel.app to Firebase Console -> Authentication -> Settings -> Authorized domains.');
            } else {
                setError(`Firebase: Error (${err.code || 'unknown'}).`);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col p-4 pb-12 overflow-y-auto bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-md mx-auto flex flex-col flex-1">
            {/* Logo and Image Section */}
            <div className="flex flex-col items-center pt-8 pb-6">
                <Logo size="2xl" showText={false} />
            </div>

            {/* Segmented Control */}
            <div className="flex px-0 py-4">
                <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-gray-200 dark:bg-white/5 p-1 border border-border-light dark:border-border-dark">
                    <button
                        onClick={() => { setView('login'); setSubmitted(false); }}
                        className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-1.5 sm:px-2 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 ${view === 'login'
                            ? 'bg-background-light dark:bg-background-dark shadow-sm text-primary'
                            : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-text-light'
                            }`}
                    >
                        <span className="truncate">Login</span>
                    </button>
                    <button
                        onClick={() => { setView('signup'); setSubmitted(false); }}
                        className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-1.5 sm:px-2 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 ${view === 'signup'
                            ? 'bg-background-light dark:bg-background-dark shadow-sm text-primary'
                            : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-text-light'
                            }`}
                    >
                        <span className="truncate">Sign Up</span>
                    </button>
                    <button
                        onClick={() => { setView('request'); setSubmitted(false); }}
                        className={`flex h-full grow items-center justify-center overflow-hidden rounded-lg px-1.5 sm:px-2 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 ${view === 'request'
                            ? 'bg-background-light dark:bg-background-dark shadow-sm text-primary'
                            : 'text-text-subtle-light dark:text-text-subtle-dark hover:text-text-light'
                            }`}
                    >
                        <span className="truncate">Request Access</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm text-center">
                    {error}
                </div>
            )}

            {/* Form Fields */}
            {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in zoom-in-95 duration-500">
                    <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-green-600">verified</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Request Received</h2>
                    <p className="text-text-subtle-light dark:text-text-subtle-dark max-w-xs mx-auto mb-8">
                        Thank you for applying. We are currently vetting new profiles to maintain the platform's professional standards.
                        <strong> Be sure to check your inbox and junk/spam folder for your invitation email</strong> once approved.
                    </p>
                    <button
                        onClick={() => setView('login')}
                        className="text-primary font-bold hover:underline"
                    >
                        Back to Login
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Full Name - For Signup or Request Access */}
                    {(view === 'signup' || view === 'request') && (
                        <label className="flex flex-col w-full animate-in slide-in-from-top-2">
                            <p className="text-sm font-medium leading-normal pb-2">Full Name</p>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 h-12 p-3 text-base"
                                placeholder="Enter your full name"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </label>
                    )}

                    {/* Role Selection - Only for Request Access */}
                    {view === 'request' && (
                        <label className="flex flex-col w-full animate-in slide-in-from-top-2 delay-75">
                            <p className="text-sm font-medium leading-normal pb-2">I am a</p>
                            <select
                                className="form-select flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 h-12 p-3 text-base"
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                            >
                                <option value="actor">Film Professional (Actor/Crew)</option>
                                <option value="director">Director / Producer</option>
                                <option value="influencer">Social Media Influencer</option>
                                <option value="content_creator">YouTuber / Content Creator</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                    )}
                    {/* Portfolio/Social Link - Only for Request Access */}
                    {view === 'request' && (
                        <label className="flex flex-col w-full animate-in slide-in-from-top-2 delay-100">
                            <p className="text-sm font-medium leading-normal pb-2">Work Link (IMDb, Instagram, YouTube, etc.)</p>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 h-12 p-3 text-base"
                                placeholder="Link to your best work or social profile"
                                type="url"
                                value={portfolioLink}
                                onChange={(e) => setPortfolioLink(e.target.value)}
                                required
                            />
                            <p className="text-[10px] text-text-subtle-light dark:text-text-subtle-dark mt-1">
                                Provide a link that helps us verify your professional work.
                            </p>
                        </label>
                    )}

                    {/* Union Card / ID Proof - Front and Back */}
                    {view === 'request' && (
                        <div className="flex flex-col w-full animate-in slide-in-from-top-2 delay-125 gap-4">
                            <p className="text-sm font-medium leading-normal">Union Card / Professional ID (Photos)</p>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Front Side */}
                                <div className="flex flex-col gap-2">
                                    <div className={`relative flex items-center justify-center border-2 border-dashed rounded-xl h-24 transition-all cursor-pointer overflow-hidden ${unionCardFrontFile ? 'border-primary bg-primary/5' : 'border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setUnionCardFrontFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                        />
                                        {unionCardFrontFile ? (
                                            <div className="flex flex-col items-center">
                                                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                                <span className="text-[10px] font-bold text-primary truncate max-w-[80px]">Front Attached</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-text-subtle-light dark:text-text-subtle-dark">
                                                <span className="material-symbols-outlined text-2xl">image</span>
                                                <span className="text-[10px] font-medium">Front Side</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Back Side */}
                                <div className="flex flex-col gap-2">
                                    <div className={`relative flex items-center justify-center border-2 border-dashed rounded-xl h-24 transition-all cursor-pointer overflow-hidden ${unionCardBackFile ? 'border-primary bg-primary/5' : 'border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setUnionCardBackFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                        />
                                        {unionCardBackFile ? (
                                            <div className="flex flex-col items-center">
                                                <span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
                                                <span className="text-[10px] font-bold text-primary truncate max-w-[80px]">Back Attached</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-text-subtle-light dark:text-text-subtle-dark">
                                                <span className="material-symbols-outlined text-2xl">image</span>
                                                <span className="text-[10px] font-medium">Back Side</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-[10px] text-text-subtle-light dark:text-text-subtle-dark -mt-1">
                                Upload both sides of your ID. This helps us ensure you are a verified professional.
                            </p>
                        </div>
                    )}

                    {/* Email Field */}
                    <label className="flex flex-col w-full">
                        <p className="text-sm font-medium leading-normal pb-2">Email</p>
                        <input
                            className="form-input flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 focus:border-primary h-12 placeholder:text-text-subtle-light dark:placeholder:text-text-subtle-dark p-3 text-base font-normal leading-normal"
                            placeholder="Enter your email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    {/* Password Field - For Login or Signup */}
                    {(view === 'login' || view === 'signup') && (
                        <label className="flex flex-col w-full">
                            <p className="text-sm font-medium leading-normal pb-2">{view === 'signup' ? 'Create Password' : 'Password'}</p>
                            <div className="flex w-full flex-1 items-stretch rounded-lg">
                                <input
                                    className="form-input flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 focus:border-primary h-12 placeholder:text-text-subtle-light dark:placeholder:text-text-subtle-dark p-3 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                                    placeholder={view === 'signup' ? 'Choose a secure password' : 'Enter your password'}
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                    className="text-text-subtle-light dark:text-text-subtle-dark flex border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 items-center justify-center px-3 rounded-r-lg border-l-0 hover:bg-gray-200 dark:hover:bg-white/10"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </label>
                    )}

                    {/* Confirm Password Field - Only for Signup */}
                    {view === 'signup' && (
                        <label className="flex flex-col w-full animate-in slide-in-from-top-2">
                            <p className="text-sm font-medium leading-normal pb-2">Confirm Password</p>
                            <input
                                className="form-input flex w-full min-w-0 flex-1 rounded-lg focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-gray-100 dark:bg-white/5 h-12 p-3 text-base"
                                placeholder="Repeat your password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </label>
                    )}

                    {/* Forgot Password Link */}
                    {view === 'login' && (
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!email.trim()) {
                                        setError("Please enter your email above to reset your password.");
                                        return;
                                    }
                                    try {
                                        await sendPasswordResetEmail(auth, email.trim());
                                        toast.success(`Password reset link sent to ${email.trim()}`);
                                    } catch (err: any) {
                                        setError(err.message || "Failed to send reset email.");
                                        toast.error(err.message || "Failed to send reset email.");
                                    }
                                }}
                                className="text-sm font-medium text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    {/* Honeypot Field (Hidden for humans, visible to bots) */}
                    <div className="absolute opacity-0 -z-10 h-0 w-0 overflow-hidden">
                        <label htmlFor="website_hp">Website</label>
                        <input
                            id="website_hp"
                            type="text"
                            name="website"
                            value={honeyPot}
                            onChange={(e) => setHoneyPot(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    {/* CTA Button */}
                    <div className="pt-6 pb-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                view === 'login' ? 'Login' : view === 'signup' ? 'Create Account' : 'Submit Request'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {(view === 'login' || view === 'signup') && (
                <>
                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <hr className="flex-grow border-t border-border-light dark:border-border-dark" />
                        <span className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark">
                            or continue with
                        </span>
                        <hr className="flex-grow border-t border-border-light dark:border-border-dark" />
                    </div>

                    {/* Social Logins */}
                    <div className="flex justify-center gap-4 pt-6">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            aria-label="Continue with Google"
                            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:bg-gray-100 dark:hover:bg-white/5 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {googleLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                                    <span className="text-sm font-bold text-text-light dark:text-text-dark">Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_3030_10037)">
                                            <path
                                                d="M21.9999 12.2158C21.9999 11.3934 21.9263 10.5898 21.7894 9.81818H12.2178V14.4076H17.7595C17.5218 15.8202 16.7118 17.0652 15.5327 17.8761V20.6695H19.4586C21.0859 19.1834 21.9999 16.9461 21.9999 14.2158V12.2158Z"
                                                fill="#4285F4"
                                            ></path>
                                            <path
                                                d="M12.2178 22.0001C15.1436 22.0001 17.6186 21.0501 19.4586 19.6695L15.5327 16.8761C14.5363 17.5455 13.2727 17.9546 12.2178 17.9546C10.0454 17.9546 8.16815 16.4955 7.49997 14.5455H3.44995V17.4182C5.23179 20.2546 8.48179 22.0001 12.2178 22.0001Z"
                                                fill="#34A853"
                                            ></path>
                                            <path
                                                d="M7.5 14.5454C7.25455 13.8409 7.10909 13.0909 7.10909 12.3181C7.10909 11.5454 7.25455 10.7954 7.5 10.0909V7.21814H3.45C2.54545 8.94086 2 10.5727 2 12.3181C2 14.0636 2.54545 15.6954 3.45 17.4181L7.5 14.5454Z"
                                                fill="#FBBC05"
                                            ></path>
                                            <path
                                                d="M12.2178 6.68182C13.7182 6.68182 14.9818 7.22727 15.9318 8.12273L19.5318 4.52273C17.6136 2.78636 15.1436 2 12.2178 2C8.48179 2 5.23179 3.74545 3.44995 6.58182L7.49997 9.45455C8.16815 7.50455 10.0454 6.68182 12.2178 6.68182Z"
                                                fill="#EA4335"
                                            ></path>
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_3030_10037">
                                                <rect fill="white" height="20" transform="translate(2 2)" width="20"></rect>
                                            </clipPath>
                                        </defs>
                                    </svg>
                                    <span className="text-sm font-bold text-text-light dark:text-text-dark">Continue with Google</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Footer with Privacy & Terms Links */}
            <div className="mt-auto pt-8 pb-4 text-center">
                <div className="flex items-center justify-center gap-4 text-xs text-text-subtle-light dark:text-text-subtle-dark">
                    <Link
                        to="/privacy"
                        className="hover:text-primary transition-colors hover:underline"
                    >
                        Privacy Policy
                    </Link>
                    <span>•</span>
                    <Link
                        to="/terms"
                        className="hover:text-primary transition-colors hover:underline"
                    >
                        Terms of Service
                    </Link>
                </div>
                <p className="text-[10px] text-text-subtle-light dark:text-text-subtle-dark mt-2">
                    © 2025 iFilmDirectory. All rights reserved.
                </p>
            </div>
            </div>
        </div>
    );
}
