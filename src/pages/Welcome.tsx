import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Logo from '../components/Logo';

const onboardingSlides = [
    {
        icon: 'work',
        tag: 'CASTINGS & GIGS',
        title: 'Find Your Next Role',
        description: 'Access exclusive job listings, audition notices, and crew calls from verified production houses.',
        accent: 'from-amber-500/20 to-orange-500/10',
        iconColor: 'text-amber-400',
        badge: 'Live Openings Daily',
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
        desc: 'Real-time industry updates, trade analysis, box office reports, and creator spotlights.',
    },
    {
        icon: 'forum',
        title: 'Guilds & Forums',
        desc: 'Join private departmental communities to discuss craft, rates, and collaborative projects.',
    },
];

export default function Welcome() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        // Capture referral code if present
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            console.log('Referral code found:', ref);
            localStorage.setItem('referralCode', ref);
        }
    }, []);

    // Auto-advance mobile carousel every 4.5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % onboardingSlides.length);
        }, 4500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-[100dvh] w-full bg-[#090A0C] text-white font-display overflow-x-hidden flex flex-col justify-between selection:bg-amber-500 selection:text-black">
            {/* Ambient Cinema Lighting Glows */}
            <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-amber-500/10 blur-[150px] rounded-full z-0" />
            <div className="pointer-events-none fixed top-1/3 -right-40 w-[600px] h-[500px] bg-purple-500/5 blur-[160px] rounded-full z-0" />
            <div className="pointer-events-none fixed bottom-0 -left-40 w-[600px] h-[400px] bg-blue-500/5 blur-[150px] rounded-full z-0" />

            {/* Top Navigation Bar */}
            <header className="relative z-20 w-full border-b border-white/[0.06] bg-[#090A0C]/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Brand Logo */}
                    <div
                        onClick={() => navigate('/welcome')}
                        className="cursor-pointer group flex items-center gap-2"
                    >
                        <Logo size="lg" showText={true} />
                    </div>

                    {/* Desktop Center Badges */}
                    <div className="hidden lg:flex items-center gap-6 text-xs text-zinc-400 font-medium">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            Over 10,000+ Film Creators
                        </span>
                        <span className="text-zinc-500">•</span>
                        <span>Auditions</span>
                        <span className="text-zinc-500">•</span>
                        <span>Talent Directory</span>
                        <span className="text-zinc-500">•</span>
                        <span>Showreels</span>
                    </div>

                    {/* Auth CTA Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex flex-col justify-center">
                {/* HERO SECTION */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        {/* LEFT COLUMN: Hero Pitch & CTAs */}
                        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wide uppercase shadow-sm">
                                <span className="material-symbols-outlined text-sm">movie_filter</span>
                                The Global Film Industry Network
                            </div>

                            {/* Main Title */}
                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                                Where Cinema Creators,{' '}
                                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                                    Cast & Crew
                                </span>{' '}
                                Connect.
                            </h1>

                            {/* Subtitle */}
                            <p className="text-sm sm:text-base lg:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed">
                                The ultimate ecosystem uniting directors, actors, cinematographers, writers, and production houses. Discover verified casting calls, book studio facilities, and put your showreel directly in front of the industry.
                            </p>

                            {/* Action Buttons */}
                            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3.5 pt-2">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <span>Join Directory — Get Started</span>
                                    <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
                                        arrow_forward
                                    </span>
                                </button>
                                <button
                                    onClick={() => navigate('/showcase')}
                                    className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-sm sm:text-base transition-all hover:border-white/20 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-amber-400">play_circle</span>
                                    <span>Explore Showcase Feed</span>
                                </button>
                            </div>

                            {/* Trust Signals & Avatars */}
                            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-zinc-400">
                                <div className="flex -space-x-2">
                                    <div className="size-8 rounded-full border-2 border-[#090A0C] bg-amber-600/40 flex items-center justify-center text-[10px] font-bold text-amber-300">
                                        DIR
                                    </div>
                                    <div className="size-8 rounded-full border-2 border-[#090A0C] bg-blue-600/40 flex items-center justify-center text-[10px] font-bold text-blue-300">
                                        ACT
                                    </div>
                                    <div className="size-8 rounded-full border-2 border-[#090A0C] bg-purple-600/40 flex items-center justify-center text-[10px] font-bold text-purple-300">
                                        DOP
                                    </div>
                                    <div className="size-8 rounded-full border-2 border-[#090A0C] bg-emerald-600/40 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                                        PROD
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-zinc-200">
                                        10,000+ Film Craftsmen Across 50+ Departments
                                    </p>
                                    <p className="text-zinc-500 text-[11px]">
                                        Free verified creator profile • Direct applications • No brokerage
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Desktop Feature Cards / Mobile Carousel */}
                        <div className="lg:col-span-5 w-full">
                            {/* DESKTOP VIEW (lg+): 3 Interactive Stack Cards */}
                            <div className="hidden lg:flex flex-col gap-3.5">
                                {onboardingSlides.map((slide, idx) => (
                                    <div
                                        key={idx}
                                        className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-amber-500/40 hover:bg-white/[0.05] transition-all duration-300 group shadow-lg"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`size-12 rounded-xl bg-gradient-to-br ${slide.accent} border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                                <span className={`material-symbols-outlined text-2xl ${slide.iconColor}`}>
                                                    {slide.icon}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                                                        {slide.tag}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                                                        {slide.badge}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                                    {slide.title}
                                                </h3>
                                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                                    {slide.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* MOBILE VIEW (sm & md): Smooth Touch Carousel */}
                            <div className="lg:hidden w-full max-w-sm mx-auto flex flex-col items-center">
                                <div className="w-full relative overflow-hidden rounded-2xl p-6 bg-white/[0.03] border border-white/[0.08] shadow-xl text-center min-h-[220px] flex flex-col justify-center items-center">
                                    <div className="size-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
                                        <span className="material-symbols-outlined text-3xl">
                                            {onboardingSlides[currentSlide].icon}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                                        {onboardingSlides[currentSlide].tag}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {onboardingSlides[currentSlide].title}
                                    </h3>
                                    <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                                        {onboardingSlides[currentSlide].description}
                                    </p>
                                </div>

                                {/* Carousel Dot Indicators */}
                                <div className="flex items-center gap-2 mt-4">
                                    {onboardingSlides.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentSlide(index)}
                                            aria-label={`Go to slide ${index + 1}`}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                currentSlide === index ? 'w-6 bg-amber-500' : 'w-2 bg-white/20'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DESKTOP HIGHLIGHTS GRID */}
                <section className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full border-t border-white/[0.05]">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {featureHighlights.map((feat, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-amber-400 text-2xl mb-2">
                                    {feat.icon}
                                </span>
                                <h4 className="text-sm font-bold text-white mb-1">{feat.title}</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#090A0C]/90 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <p>© 2026 iFilmDirectory. Built for Cinema Creators.</p>
                    <div className="flex items-center gap-6 text-zinc-400">
                        <Link to="/privacy" className="hover:text-amber-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-amber-400 transition-colors">
                            Terms of Service
                        </Link>
                        <span>•</span>
                        <Link to="/login" className="hover:text-amber-400 transition-colors">
                            Member Sign In
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
