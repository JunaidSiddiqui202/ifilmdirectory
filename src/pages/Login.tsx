import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { createUserProfile, triggerEmail } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import { useToast } from '../context/ToastContext';

const onboardingSlides = [
    {
        icon: 'work',
        tag: 'CASTINGS & GIGS',
        title: 'Find Your Next Role',
        description: 'Access exclusive job listings, audition notices, and crew calls from verified production houses.',
        accent: 'from-amber-500/20 to-orange-500/10',
        iconColor: 'text-amber-400',
        badge: 'Live Auditions Daily',
    },
    {
        icon: 'groups',
        tag: 'NETWORKING',
        title: 'Connect with Professionals',
        description: 'Build your inner circle with directors, technicians, writers, and artists across 50+ cinema crafts.',
        accent: 'from-blue-500/20 to-cyan-500/10',
        iconColor: 'text-cyan-400',
        badge: 'Direct Industry Chat',
    },
    {
        icon: 'movie',
        tag: 'PORTFOLIO',
        title: 'Showcase Your Showreels',
        description: 'Put your cinematic work in front of decision-makers with video portfolios, IMDb credits, and verified badges.',
        accent: 'from-purple-500/20 to-pink-500/10',
        iconColor: 'text-purple-400',
        badge: 'Industry Spotlight',
    },
];

const featureHighlights = [
    {
        icon: 'explore',
        title: 'Talent Directory',
        desc: 'Filter verified actors, cinematographers, sound designers, and technicians by skill & city.',
    },
    {
        icon: 'domain',
        title: 'Gear & Facilities',
        desc: 'Book soundstages, RED/ARRI camera kits, grip trucks, and post-production suites.',
    },
    {
        icon: 'newspaper',
        title: 'Cinema Wire',
        desc: 'Real-time industry updates, trade analysis, box office reports, and reviews.',
    },
    {
        icon: 'forum',
        title: 'Guilds & Forums',
        desc: 'Join private departmental communities to discuss craft, rates, and collaborations.',
    },
];

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();
    const { currentUser } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

    // Initialize tab state based on URL parameter
    const initialTab = searchParams.get('tab');
    const [view, setView] = useState<'login' | 'signup' | 'request'>(
        initialTab === 'request' ? 'request' : initialTab === 'signup' ? 'signup' : 'login'
    );

    const scrollToAuthBox = (targetView?: 'login' | 'signup' | 'request') => {
        if (targetView) {
            setView(targetView);
            setSubmitted(false);
        }
        setTimeout(() => {
            const el = document.getElementById('auth-box');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 60);
    };
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
    const [activeSlide, setActiveSlide] = useState(0);

    // Honeypot state for bot protection
    const [unionCardFrontFile, setUnionCardFrontFile] = useState<File | null>(null);
    const [unionCardBackFile, setUnionCardBackFile] = useState<File | null>(null);
    const [honeyPot, setHoneyPot] = useState('');

    // Terms of Service & Privacy Policy Acceptance State
    const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
        return (
            localStorage.getItem('ifilm_terms_accepted') === 'true' ||
            Boolean(localStorage.getItem('ifilm_terms_accepted_date'))
        );
    });
    const [termsError, setTermsError] = useState(false);

    const handleToggleTerms = (checked: boolean) => {
        setTermsAccepted(checked);
        if (checked) {
            const now = new Date().toISOString();
            localStorage.setItem('ifilm_terms_accepted', 'true');
            localStorage.setItem('ifilm_terms_accepted_date', now);
            setTermsError(false);
            if (error.toLowerCase().includes('terms')) {
                setError('');
            }
        } else {
            localStorage.removeItem('ifilm_terms_accepted');
        }
    };

    useEffect(() => {
        // Capture referral code if present
        const ref = searchParams.get('ref');
        if (ref) {
            localStorage.setItem('referralCode', ref);
        }
    }, [searchParams]);

    // Auto-advance slides periodically
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % onboardingSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Bot Protection
        if (honeyPot) {
            console.log('Bot detected via honeypot');
            return;
        }

        setError('');
        setTermsError(false);

        // Enforce Terms of Service & Privacy Policy acceptance
        if (!termsAccepted) {
            setTermsError(true);
            const msg = 'Please tick the checkbox to agree to the Terms of Service & Privacy Policy.';
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoading(true);

        const redirectUrl = searchParams.get('redirect') || '/home';

        try {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                navigate(redirectUrl);
            } else if (view === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }

                const result = await createUserWithEmailAndPassword(auth, email, password);

                try {
                    await createUserProfile(result.user, { displayName: fullName });
                } catch (profileErr: any) {
                    console.warn('User profile initialization warning:', profileErr);
                }
                navigate(redirectUrl);
            } else {
                // Request Access
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
                    submittedAt: new Date().toISOString(),
                });

                // Internal and Email Notifications
                try {
                    const { notifyAdminsOfNewRequest } = await import('../services/notificationService');
                    await notifyAdminsOfNewRequest(fullName, email);
                } catch (notifErr) {
                    console.error('Failed to send in-app notification:', notifErr);
                }

                await triggerEmail(email, 'access_request_received', fullName);
                await triggerEmail('contact@ifilmdirectory.com', 'admin_access_alert', fullName, {
                    serviceType: role,
                    amount: email,
                });

                localStorage.removeItem('referralCode');
                setSubmitted(true);
                toast.success('Your access application has been submitted!');
            }
        } catch (err: any) {
            console.error('Submit Error:', err);
            let msg = err.message || 'Action failed';

            if (err.code === 'auth/invalid-credential') {
                msg = 'Incorrect email or password. If you are a new member, please use the "Sign Up" or "Request Access" tab.';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = 'This email is already registered. Please login instead.';
            } else if (err.code === 'auth/weak-password') {
                msg = 'Password should be at least 6 characters.';
            } else if (err.code === 'permission-denied') {
                msg = 'Firestore Permission Denied (Please verify your access).';
            }

            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (googleLoading) return;

        setError('');
        setTermsError(false);

        // Enforce Terms of Service & Privacy Policy acceptance for Google Sign-In
        if (!termsAccepted) {
            setTermsError(true);
            const msg = 'Please tick the checkbox to agree to the Terms of Service & Privacy Policy before signing in with Google.';
            setError(msg);
            toast.error('Please agree to the Terms of Service & Privacy Policy to continue.');
            return;
        }

        const redirectUrl = searchParams.get('redirect') || '/home';

        try {
            setError('');
            setGoogleLoading(true);

            const result = await signInWithPopup(auth, googleProvider);

            try {
                await createUserProfile(result.user);
            } catch (profileErr: any) {
                console.warn('User profile initialization warning:', profileErr);
            }
            navigate(redirectUrl);
        } catch (err: any) {
            console.error('Google Sign-In Error:', err);
            if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
                return;
            }

            if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked by your browser. Please allow popups for ifilmdirectory.com.');
            } else if (err.code === 'auth/unauthorized-domain') {
                setError('Domain unauthorized in Firebase Console. Please add ifilmdirectory.com.');
            } else {
                setError(`Google Sign-In Error: ${err.message || 'Authentication failed'}`);
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="relative min-h-[100dvh] w-full bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-amber-500 selection:text-black transition-colors">
            {/* Ambient Cinema Lighting Glows */}
            <div className="pointer-events-none fixed -top-40 left-1/4 w-[700px] h-[450px] bg-amber-500/10 blur-[160px] rounded-full z-0" />
            <div className="pointer-events-none fixed top-1/2 -right-40 w-[600px] h-[500px] bg-purple-500/5 blur-[160px] rounded-full z-0" />
            <div className="pointer-events-none fixed bottom-0 left-10 w-[600px] h-[400px] bg-blue-500/5 blur-[150px] rounded-full z-0" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full border-b border-zinc-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#090A0C]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div
                        onClick={() => navigate('/welcome')}
                        className="cursor-pointer group flex items-center gap-2"
                    >
                        <Logo size="lg" showText={true} />
                    </div>

                    <div className="hidden lg:flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Over 10,000+ Film Creators
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span>Auditions & Castings</span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span>Talent Directory</span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span>Showreels & Reviews</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Handy Day / Night Theme Toggle */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-zinc-700 dark:text-amber-400 border border-zinc-200 dark:border-white/10 transition-all active:scale-95 cursor-pointer shadow-sm select-none"
                            title={isDarkMode ? "Switch to Day Theme (Studio Light)" : "Switch to Night Theme (Cinematic Dark)"}
                            aria-label="Toggle theme"
                        >
                            <span className="material-symbols-outlined text-base sm:text-lg">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider font-display text-zinc-900 dark:text-white">
                                {isDarkMode ? 'Day' : 'Night'}
                            </span>
                        </button>

                        {currentUser ? (
                            <button
                                onClick={() => navigate('/home')}
                                className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Enter App</span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => scrollToAuthBox('login')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                        view === 'login' ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollToAuthBox('signup')}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-sm cursor-pointer"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Merged Hero & Auth Container */}
            <main className="relative z-10 flex-1 flex flex-col justify-center py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        
                        {/* LEFT COLUMN (7 COLS): Welcome Hero & Cinematic Feature Showcase */}
                        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 text-xs font-bold tracking-wide uppercase shadow-sm">
                                <span className="material-symbols-outlined text-sm">movie_filter</span>
                                The Global Film Industry Network
                            </div>

                            {/* Main Title */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-zinc-900 dark:text-white">
                                Where Cinema Creators,{' '}
                                <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                                    Cast & Crew
                                </span>{' '}
                                Connect.
                            </h1>

                            <p className="text-sm sm:text-base lg:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                                Join verified directors, actors, cinematographers, sound designers, studios, and production houses collaborate, cast, and launch feature projects.
                            </p>

                            {/* Active Feature Slide Deck (Interactive) */}
                            <div className="w-full max-w-xl space-y-3 pt-2">
                                <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
                                    {onboardingSlides.map((slide, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveSlide(idx)}
                                            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center truncate ${
                                                activeSlide === idx
                                                    ? 'bg-amber-500 text-black shadow-md'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                            }`}
                                        >
                                            {slide.tag}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/5 relative overflow-hidden transition-all text-left shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-xl ${onboardingSlides[activeSlide].iconColor}`}>
                                                {onboardingSlides[activeSlide].icon}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                                                {onboardingSlides[activeSlide].title}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                                            {onboardingSlides[activeSlide].badge}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {onboardingSlides[activeSlide].description}
                                    </p>
                                </div>
                            </div>

                            {/* 4 Feature Cards Grid */}
                            <div className="grid grid-cols-2 gap-3 w-full max-w-xl pt-2">
                                {featureHighlights.map((feat, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-start gap-2.5 text-left shadow-sm">
                                        <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-lg shrink-0 mt-0.5">
                                            {feat.icon}
                                        </span>
                                        <div>
                                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{feat.title}</h4>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN (5 COLS): The Auth Card (Login / Sign Up / Request Access) */}
                        <div id="auth-box" className="lg:col-span-5 w-full max-w-md mx-auto scroll-mt-24">
                            <div className="relative rounded-3xl bg-white dark:bg-[#121316]/95 border border-zinc-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-zinc-900 dark:text-white">
                                
                                {/* Current User Quick Switcher Banner */}
                                {currentUser && (
                                    <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                                        <div className="truncate pr-2">
                                            <span className="text-zinc-500 dark:text-zinc-400">Signed in as </span>
                                            <strong className="text-zinc-900 dark:text-white">{currentUser.displayName || currentUser.email}</strong>
                                        </div>
                                        <button
                                            onClick={() => navigate('/home')}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold shrink-0 hover:bg-emerald-400 transition-colors"
                                        >
                                            Feed
                                        </button>
                                    </div>
                                )}

                                {/* Auth Mode Segmented Control */}
                                <div className="flex h-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-black/40 p-1 border border-zinc-200 dark:border-white/10 mb-5">
                                    <button
                                        onClick={() => { setView('login'); setSubmitted(false); }}
                                        className={`flex h-full grow items-center justify-center rounded-lg px-2 text-xs font-extrabold transition-all ${
                                            view === 'login'
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => { setView('signup'); setSubmitted(false); }}
                                        className={`flex h-full grow items-center justify-center rounded-lg px-2 text-xs font-extrabold transition-all ${
                                            view === 'signup'
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Sign Up
                                    </button>
                                    <button
                                        onClick={() => { setView('request'); setSubmitted(false); }}
                                        className={`flex h-full grow items-center justify-center rounded-lg px-2 text-xs font-extrabold transition-all ${
                                            view === 'request'
                                                ? 'bg-amber-500 text-black shadow-md'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Request Access
                                    </button>
                                </div>

                                {/* Form Title & Subtitle */}
                                <div className="mb-5 text-left">
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                        {view === 'login' && 'Welcome Back'}
                                        {view === 'signup' && 'Create Creator Account'}
                                        {view === 'request' && 'Request Industry Invitation'}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        {view === 'login' && 'Enter your verified cinema credentials to continue.'}
                                        {view === 'signup' && 'Register your profile to connect with directors and gigs.'}
                                        {view === 'request' && 'Submit your work or union proof for manual editorial vetting.'}
                                    </p>
                                </div>

                                {/* Error Alert */}
                                {error && (
                                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-xs text-left flex items-start gap-2">
                                        <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                                        <span className="leading-snug">{error}</span>
                                    </div>
                                )}

                                {/* Submitted State for Request Access */}
                                {submitted ? (
                                    <div className="py-8 px-2 text-center space-y-4 animate-in zoom-in-95 duration-300">
                                        <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                                            <span className="material-symbols-outlined text-3xl">verified</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Application Received</h3>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-sm mx-auto">
                                            Thank you for applying. We are vetting your profile to maintain the highest industry standards. 
                                            <strong> Check your inbox and spam folder</strong> for your invitation code.
                                        </p>
                                        <button
                                            onClick={() => setView('login')}
                                            className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-all shadow-md"
                                        >
                                            Return to Sign In
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Mandatory Terms of Service & Privacy Policy Tick Option */}
                                        <div className={`p-3 rounded-2xl border transition-all mb-4 text-left ${
                                            termsError
                                                ? 'bg-amber-500/15 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                                                : termsAccepted
                                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                                : 'bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 hover:border-amber-500/30'
                                        }`}>
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    id="login-terms-tick"
                                                    checked={termsAccepted}
                                                    onChange={(e) => handleToggleTerms(e.target.checked)}
                                                    className="mt-0.5 size-4 rounded bg-white dark:bg-black/60 border-zinc-300 dark:border-white/20 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500 shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <span className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                                                        I agree to the{' '}
                                                        <Link
                                                            to="/terms"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-amber-500 dark:text-amber-400 hover:underline font-bold inline-flex items-center gap-0.5"
                                                        >
                                                            <span>Terms of Service</span>
                                                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                        </Link>{' '}
                                                        and{' '}
                                                        <Link
                                                            to="/privacy"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-amber-500 dark:text-amber-400 hover:underline font-bold inline-flex items-center gap-0.5"
                                                        >
                                                            <span>Privacy Policy</span>
                                                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                                        </Link>{' '}
                                                        (A property of 5M Collective Services Pvt. Ltd. / 5MC).
                                                    </span>
                                                    {termsError && (
                                                        <p className="text-[11px] text-amber-500 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">info</span>
                                                            <span>Please tick this box to approve before proceeding.</span>
                                                        </p>
                                                    )}
                                                    {termsAccepted && (
                                                         <p className="text-[10px] text-emerald-500 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                                             <span className="material-symbols-outlined text-xs">check_circle</span>
                                                             <span>Terms & Privacy Policy approved.</span>
                                                         </p>
                                                    )}
                                                </div>
                                            </label>
                                        </div>

                                        {/* Google 1-Click Button (for Login & Signup) */}
                                        {(view === 'login' || view === 'signup') && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={handleGoogleLogin}
                                                    disabled={googleLoading}
                                                    className="w-full h-11 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-800 dark:text-white flex items-center justify-center gap-2.5 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                                                >
                                                    {googleLoading ? (
                                                        <span className="material-symbols-outlined text-base animate-spin text-amber-500 dark:text-amber-400">progress_activity</span>
                                                    ) : (
                                                        <svg className="size-4" viewBox="0 0 24 24">
                                                            <path d="M21.9999 12.2158C21.9999 11.3934 21.9263 10.5898 21.7894 9.81818H12.2178V14.4076H17.7595C17.5218 15.8202 16.7118 17.0652 15.5327 17.8761V20.6695H19.4586C21.0859 19.1834 21.9999 16.9461 21.9999 14.2158V12.2158Z" fill="#4285F4" />
                                                            <path d="M12.2178 22.0001C15.1436 22.0001 17.6186 21.0501 19.4586 19.6695L15.5327 16.8761C14.5363 17.5455 13.2727 17.9546 12.2178 17.9546C10.0454 17.9546 8.16815 16.4955 7.49997 14.5455H3.44995V17.4182C5.23179 20.2546 8.48179 22.0001 12.2178 22.0001Z" fill="#34A853" />
                                                            <path d="M7.5 14.5454C7.25455 13.8409 7.10909 13.0909 7.10909 12.3181C7.10909 11.5454 7.25455 10.7954 7.5 10.0909V7.21814H3.45C2.54545 8.94086 2 10.5727 2 12.3181C2 14.0636 2.54545 15.6954 3.45 17.4181L7.5 14.5454Z" fill="#FBBC05" />
                                                            <path d="M12.2178 6.68182C13.7182 6.68182 14.9818 7.22727 15.9318 8.12273L19.5318 4.52273C17.6136 2.78636 15.1436 2 12.2178 2C8.48179 2 5.23179 3.74545 3.44995 6.58182L7.49997 9.45455C8.16815 7.50455 10.0454 6.68182 12.2178 6.68182Z" fill="#EA4335" />
                                                        </svg>
                                                    )}
                                                    <span>Continue with Google</span>
                                                </button>

                                                <div className="flex items-center gap-3 my-4">
                                                    <div className="h-px bg-zinc-200 dark:bg-white/10 flex-1" />
                                                    <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">or with email</span>
                                                    <div className="h-px bg-zinc-200 dark:bg-white/10 flex-1" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Standard Form */}
                                        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                                            {/* Full Name */}
                                            {(view === 'signup' || view === 'request') && (
                                                <div>
                                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={fullName}
                                                        onChange={(e) => setFullName(e.target.value)}
                                                        placeholder="e.g. Christopher Nolan"
                                                        required
                                                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                    />
                                                </div>
                                            )}

                                            {/* Role for Request Access */}
                                            {view === 'request' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                        Primary Cinema Craft / Role
                                                    </label>
                                                    <select
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value as any)}
                                                        className="w-full h-11 px-3 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                    >
                                                        <option value="actor">Actor / Model / Performer</option>
                                                        <option value="director">Director / Writer / Producer</option>
                                                        <option value="crew">Key Crew (Cinematography / Sound / Edit)</option>
                                                        <option value="influencer">Film Reviewer / Critic / Journalist</option>
                                                        <option value="content_creator">YouTuber / OTT Creator</option>
                                                        <option value="other">Studio / Facility / Other Craft</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* Portfolio Link for Request Access */}
                                            {view === 'request' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                        Work Profile Link (IMDb, Instagram, YouTube)
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={portfolioLink}
                                                        onChange={(e) => setPortfolioLink(e.target.value)}
                                                        placeholder="https://imdb.com/name/..."
                                                        required
                                                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                    />
                                                </div>
                                            )}

                                            {/* Union Card / ID Proof Uploads for Request Access */}
                                            {view === 'request' && (
                                                <div className="space-y-1.5">
                                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                        Union Card / Professional ID (Optional Photos)
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-2.5">
                                                        <div className={`relative flex items-center justify-center border border-dashed rounded-xl h-20 transition-all cursor-pointer overflow-hidden ${
                                                            unionCardFrontFile ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/30 hover:border-zinc-400 dark:hover:border-white/30'
                                                        }`}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setUnionCardFrontFile(e.target.files?.[0] || null)}
                                                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                                            />
                                                            {unionCardFrontFile ? (
                                                                <div className="flex flex-col items-center text-amber-500 dark:text-amber-400">
                                                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                                                    <span className="text-[10px] font-bold truncate max-w-[90px]">Front Attached</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-500">
                                                                    <span className="material-symbols-outlined text-lg">badge</span>
                                                                    <span className="text-[10px] font-medium mt-0.5">Front Side</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`relative flex items-center justify-center border border-dashed rounded-xl h-20 transition-all cursor-pointer overflow-hidden ${
                                                            unionCardBackFile ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-300 dark:border-white/15 bg-zinc-50 dark:bg-black/30 hover:border-zinc-400 dark:hover:border-white/30'
                                                        }`}>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setUnionCardBackFile(e.target.files?.[0] || null)}
                                                                className="absolute inset-0 opacity-0 z-10 cursor-pointer"
                                                            />
                                                            {unionCardBackFile ? (
                                                                <div className="flex flex-col items-center text-amber-500 dark:text-amber-400">
                                                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                                                    <span className="text-[10px] font-bold truncate max-w-[90px]">Back Attached</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center text-zinc-400 dark:text-zinc-500">
                                                                    <span className="material-symbols-outlined text-lg">credit_card</span>
                                                                    <span className="text-[10px] font-medium mt-0.5">Back Side</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Email Address */}
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="director@studio.com"
                                                    required
                                                    className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                />
                                            </div>

                                            {/* Password */}
                                            {(view === 'login' || view === 'signup') && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                            {view === 'signup' ? 'Create Password' : 'Password'}
                                                        </label>
                                                        {view === 'login' && (
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (!email.trim()) {
                                                                        setError('Please enter your email above to reset password.');
                                                                        return;
                                                                    }
                                                                    try {
                                                                        await sendPasswordResetEmail(auth, email.trim());
                                                                        toast.success(`Password reset link sent to ${email.trim()}`);
                                                                    } catch (err: any) {
                                                                        setError(err.message || 'Failed to send reset email.');
                                                                    }
                                                                }}
                                                                className="text-[11px] text-amber-500 dark:text-amber-400 hover:underline font-semibold"
                                                            >
                                                                Forgot Password?
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                            placeholder={view === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                                                            required
                                                            className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                                            aria-label="Toggle password visibility"
                                                        >
                                                            <span className="material-symbols-outlined text-base">
                                                                {showPassword ? 'visibility_off' : 'visibility'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Confirm Password (Signup only) */}
                                            {view === 'signup' && (
                                                <div>
                                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                        Confirm Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Re-enter password"
                                                        required
                                                        className="w-full h-11 px-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                                                    />
                                                </div>
                                            )}

                                            {/* Honeypot Bot Trap (invisible) */}
                                            <div className="absolute opacity-0 -z-10 h-0 w-0 overflow-hidden pointer-events-none">
                                                <input
                                                    type="text"
                                                    name="website_trap"
                                                    value={honeyPot}
                                                    onChange={(e) => setHoneyPot(e.target.value)}
                                                    tabIndex={-1}
                                                    autoComplete="off"
                                                />
                                            </div>

                                            {/* Submit Button */}
                                            <div className="pt-2">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                                                >
                                                    {loading ? (
                                                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                    ) : (
                                                        <>
                                                            <span>
                                                                {view === 'login' && 'Sign In to iFilmDirectory'}
                                                                {view === 'signup' && 'Create Free Account'}
                                                                {view === 'request' && 'Submit Request for Verification'}
                                                            </span>
                                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Quick Switch between Login & Signup */}
                                            <div className="pt-2 text-center">
                                                {view === 'login' ? (
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        Don't have an account?{' '}
                                                        <button
                                                            type="button"
                                                            onClick={() => scrollToAuthBox('signup')}
                                                            className="text-amber-500 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                                                        >
                                                            Sign up for free
                                                        </button>
                                                    </p>
                                                ) : view === 'signup' ? (
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        Already have an account?{' '}
                                                        <button
                                                            type="button"
                                                            onClick={() => scrollToAuthBox('login')}
                                                            className="text-amber-500 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                                                        >
                                                            Sign In
                                                        </button>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        Already registered?{' '}
                                                        <button
                                                            type="button"
                                                            onClick={() => scrollToAuthBox('login')}
                                                            className="text-amber-500 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                                                        >
                                                            Sign In
                                                        </button>
                                                    </p>
                                                )}
                                            </div>
                                        </form>
                                    </>
                                )}

                                {/* Legal Disclaimers & Links to Updated Terms */}
                                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-white/10 text-center space-y-2">
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        By signing in or creating an account, you agree to our{' '}
                                        <Link to="/terms" className="text-amber-500 dark:text-amber-400 hover:underline font-semibold">
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link to="/privacy" className="text-amber-500 dark:text-amber-400 hover:underline font-semibold">
                                            Privacy Policy
                                        </Link>.
                                    </p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                        A property of 5M Collective Services Pvt. Ltd. (5MC) • Hyderabad, India
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="relative z-10 w-full border-t border-zinc-200 dark:border-white/[0.06] bg-white/90 dark:bg-[#090A0C]/90 py-5 text-center text-xs text-zinc-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-[11px]">
                        © 2026 iFilmDirectory. A property of 5M Collective Services Pvt. Ltd. (5MC). All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-[11px]">
                        <Link to="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Privacy</Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Terms of Service</Link>
                        <span>•</span>
                        <a href="mailto:ifilmdirectory@gmail.com" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
