import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Logo from '../components/Logo';

const onboardingSlides = [
    {
        icon: 'work',
        title: 'Find Your Next Role',
        description: 'Access exclusive job listings and audition calls from top production houses.',
    },
    {
        icon: 'groups',
        title: 'Connect with Professionals',
        description: 'Build your network with directors, technicians, and artists across the industry.',
    },
    {
        icon: 'star',
        title: 'Showcase Your Talent',
        description: 'Create a professional profile and portfolio to get discovered.',
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

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark font-display overflow-y-auto">
            <div className="flex flex-1 flex-col justify-between p-6 w-full max-w-md mx-auto">
                {/* Logo Section */}
                <div className="flex justify-center pt-12 pb-4">
                    <Logo size="3xl" showText={false} />
                </div>

                {/* Carousel Section */}
                <div className="flex-grow flex flex-col justify-center">
                    <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar text-center">
                        {onboardingSlides.map((slide, index) => (
                            <div
                                key={index}
                                className="flex w-full flex-none snap-center flex-col items-center justify-center text-center px-4 transition-transform duration-500"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 mb-6">
                                    <span className="material-symbols-outlined text-5xl text-primary">{slide.icon}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">{slide.title}</h2>
                                <p className="text-base text-text-subtle-light dark:text-text-subtle-dark max-w-sm">{slide.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Page Indicators */}
                    <div className="flex w-full flex-row items-center justify-center gap-3 py-8">
                        {onboardingSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-2 rounded-full transition-all ${currentSlide === index ? 'w-6 bg-primary' : 'w-2 bg-primary/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="pb-6 space-y-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="flex min-w-[84px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 flex-1 w-full bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                        <span className="truncate">Sign Up / Get Started</span>
                    </button>
                    <div className="flex items-center justify-center text-center">
                        <p className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark">
                            Already have an account?{' '}
                            <button onClick={() => navigate('/login')} className="font-bold text-primary hover:underline">
                                Log In
                            </button>
                        </p>
                    </div>

                    {/* Footer with Privacy & Terms Links */}
                    <div className="pt-4 text-center">
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
        </div>
    );
}
