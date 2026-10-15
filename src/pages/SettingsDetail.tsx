import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updatePassword } from 'firebase/auth';
import { getUserProfile, type UserProfile } from '../services/userService';
import Logo from '../components/Logo';

export default function SettingsDetail() {
    const { section } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // State for forms
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState('English');
    const [notificationStates, setNotificationStates] = useState({
        email: true,
        push: true,
        jobs: true,
        marketing: false
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (currentUser) {
                const data = await getUserProfile(currentUser.uid);
                if (data) {
                    setProfile(data);
                }
            }
        };
        fetchProfile();
    }, [currentUser]);

    const getTitle = () => {
        switch (section) {
            case 'contact-login': return 'Contact & Credentials';
            case 'subscription': return 'Membership & Studio Tiers';
            case 'notifications': return 'Alert Preferences';
            case 'change-password': return 'Password & Security';
            case 'language': return 'System Language';
            case 'help': return 'Concierge & Help Desk';
            case 'about': return 'About iFilmDirectory';
            default: return 'Settings Detail';
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            setMessageType('error');
            return;
        }
        setLoading(true);
        try {
            if (currentUser) {
                await updatePassword(currentUser, newPassword);
                setMessage('Security password updated successfully.');
                setMessageType('success');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            setMessage(error.message || 'Failed to update password');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (section) {
            case 'contact-login':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="p-5 bg-[#121316] border border-white/[0.08] rounded-2xl">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Primary Email
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                                    Verified
                                </span>
                            </div>
                            <p className="text-base font-semibold text-white">{currentUser?.email}</p>
                            <p className="text-[11px] text-zinc-500 mt-1">Used for casting notifications, project slates, and account recovery.</p>
                        </div>

                        <div className="p-5 bg-[#121316] border border-white/[0.08] rounded-2xl">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                                Public Directory Handle
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500 font-bold">@</span>
                                <p className="text-base font-semibold text-white">
                                    {profile?.username || currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'filmmaker'}
                                </p>
                            </div>
                            <p className="text-xs text-amber-500/80 font-mono mt-2 bg-amber-500/[0.06] border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
                                ifilmdirectory.com/profile/{profile?.username || 'filmmaker'}
                            </p>
                        </div>

                        <div className="p-5 bg-[#121316] border border-white/[0.08] rounded-2xl">
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                                Unique Production Identifier (UID)
                            </span>
                            <p className="text-xs font-mono text-zinc-300 break-all bg-black/40 p-3 rounded-xl border border-white/[0.04]">
                                {currentUser?.uid}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-2">
                                Provide this ID when querying priority support or linking studio facility bookings.
                            </p>
                        </div>
                    </div>
                );

            case 'subscription':
                return (
                    <div className="flex flex-col gap-6">
                        {/* Current Plan Badge */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#14161a] to-[#0d0e11] border border-amber-500/30 p-6 shadow-2xl">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-400 text-2xl">workspace_premium</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                                        Active Membership
                                    </span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                    Pro Creator
                                </span>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-1">
                                Professional Film Tier
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mb-6">
                                Unlocked direct messaging, verified portfolio credentials, 4K reel embeds, and unlimited production shortlists.
                            </p>

                            <div className="space-y-2.5 mb-6">
                                {[
                                    'Verified Gold Studio & Talent Badge',
                                    'Priority rank in Casting & Talent Directory searches',
                                    'Unlimited casting call submissions & direct messaging',
                                    'Host & book production facilities with zero platform surcharges',
                                    'Concierge production crew shortlist management'
                                ].map((perk, i) => (
                                    <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-300 font-medium">
                                        <span className="material-symbols-outlined text-emerald-400 text-base shrink-0">
                                            check_circle
                                        </span>
                                        <span>{perk}</span>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]">
                                Manage Billing & Invoices
                            </button>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="flex flex-col gap-3">
                        {[
                            {
                                id: 'jobs',
                                title: 'Casting & Job Alerts',
                                desc: 'Instant alerts when roles matching your craft or union guild are posted',
                                active: notificationStates.jobs,
                                toggle: () => setNotificationStates(prev => ({ ...prev, jobs: !prev.jobs }))
                            },
                            {
                                id: 'push',
                                title: 'Direct Messages & Slate Inquiries',
                                desc: 'Sound and banner alerts for new production chats and booking requests',
                                active: notificationStates.push,
                                toggle: () => setNotificationStates(prev => ({ ...prev, push: !prev.push }))
                            },
                            {
                                id: 'email',
                                title: 'Email Digests',
                                desc: 'Weekly roundup of shortlisted candidates, upcoming auditions, and industry news',
                                active: notificationStates.email,
                                toggle: () => setNotificationStates(prev => ({ ...prev, email: !prev.email }))
                            },
                            {
                                id: 'marketing',
                                title: 'Partner Equipment Discounts',
                                desc: 'Exclusive camera rental and studio gear offers from our verified facilities',
                                active: notificationStates.marketing,
                                toggle: () => setNotificationStates(prev => ({ ...prev, marketing: !prev.marketing }))
                            }
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-[#121316] border border-white/[0.08] rounded-2xl">
                                <div className="pr-4">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">{item.title}</h4>
                                    <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                                </div>
                                <button
                                    onClick={item.toggle}
                                    className="relative inline-flex items-center cursor-pointer shrink-0"
                                >
                                    <div className={`w-11 h-6 rounded-full transition-colors ${item.active ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                        <div className={`size-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${item.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                );

            case 'change-password':
                return (
                    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                        <div className="p-5 bg-[#121316] border border-white/[0.08] rounded-2xl space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    New Passcode / Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter minimum 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#14161a] border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Re-type new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#14161a] border border-white/[0.08] rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 active:scale-95"
                        >
                            {loading ? 'Updating Credentials...' : 'Update Password'}
                        </button>
                    </form>
                );

            case 'language':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { code: 'en', name: 'English', region: 'India & Global' },
                            { code: 'hi', name: 'हिंदी (Hindi)', region: 'Bollywood & North' },
                            { code: 'te', name: 'తెలుగు (Telugu)', region: 'Tollywood' },
                            { code: 'ta', name: 'தமிழ் (Tamil)', region: 'Kollywood' },
                            { code: 'mr', name: 'मराठी (Marathi)', region: 'Maharashtra' },
                            { code: 'ml', name: 'മലയാളം (Malayalam)', region: 'Mollywood' },
                            { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', region: 'Sandalwood' },
                            { code: 'bn', name: 'বাংলা (Bengali)', region: 'Tollywood East' },
                        ].map((lang) => (
                            <button
                                key={lang.name}
                                onClick={() => setCurrentLanguage(lang.name)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                                    currentLanguage === lang.name
                                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-md'
                                        : 'bg-[#121316] border-white/[0.08] text-zinc-300 hover:border-white/[0.15] hover:bg-white/[0.02]'
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-wide">{lang.name}</p>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">{lang.region}</p>
                                </div>
                                {currentLanguage === lang.name && (
                                    <span className="material-symbols-outlined text-amber-400 text-xl">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                );

            case 'help':
                return (
                    <div className="flex flex-col gap-4">
                        {/* Concierge Desk */}
                        <div className="p-5 bg-gradient-to-br from-amber-500/10 via-[#121316] to-[#14161a] border border-amber-500/30 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="material-symbols-outlined text-amber-400 text-2xl">headset_mic</span>
                                <h4 className="text-base font-bold text-white uppercase tracking-tight font-display">
                                    Direct Production Support
                                </h4>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                                Need emergency studio assistance, verification support, or profile escalation? Our cinema concierge team responds within 24 hours.
                            </p>
                            <a
                                href="mailto:support@ifilmdirectory.com"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">mail</span>
                                <span>support@ifilmdirectory.com</span>
                            </a>
                        </div>

                        {/* FAQs */}
                        <div className="p-5 bg-[#121316] border border-white/[0.08] rounded-2xl space-y-3">
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                Frequently Asked Questions
                            </h4>
                            {[
                                {
                                    q: 'How do I upload a verified showreel or video reference?',
                                    a: 'Go to your Profile page and select "Add Showreel". You can paste Vimeo, YouTube, or direct MP4 links with timestamp cue cards.'
                                },
                                {
                                    q: 'How do I obtain the Gold Verified Studio badge?',
                                    a: 'Submit your trade registration or guild accreditation card through the Profile verification tab. Review typically takes 1 business day.'
                                },
                                {
                                    q: 'How does client booking protection work for soundstages and gear?',
                                    a: 'All facility rentals through iFilmDirectory require mutual studio confirmation and contact verification to ensure legitimate production hires.'
                                }
                            ].map((faq, i) => (
                                <details key={i} className="group p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <summary className="flex justify-between items-center text-xs md:text-sm font-semibold text-zinc-200 cursor-pointer list-none select-none">
                                        <span>{faq.q}</span>
                                        <span className="material-symbols-outlined text-zinc-500 transition-transform duration-200 group-open:rotate-180">
                                            expand_more
                                        </span>
                                    </summary>
                                    <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed pl-1">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                );

            case 'about':
                return (
                    <div className="flex flex-col items-center gap-5 text-center py-8">
                        <div className="p-4 rounded-3xl bg-[#121316] border border-amber-500/30 shadow-2xl shadow-amber-500/10">
                            <Logo size="xl" showText={false} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider font-display">
                                iFilmDirectory
                            </h3>
                            <p className="text-xs text-amber-500 font-mono mt-0.5">Production Build 1.2.0</p>
                        </div>
                        <p className="text-xs text-zinc-300 max-w-sm leading-relaxed">
                            India’s premier verified cinematic network connecting actors, directors, technicians, union guilds, and facilities under one seamless digital directory.
                        </p>
                        
                        {/* Company Attribution */}
                        <div className="p-4 rounded-2xl bg-[#121316] border border-white/[0.08] max-w-sm w-full">
                            <p className="text-[11px] text-zinc-400 font-medium">
                                A registered property of:
                            </p>
                            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mt-1">
                                5M Collective Services Pvt. Ltd. (5MC)
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                All rights reserved © 2026 5MC. Designed for the Indian & global film fraternity.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-zinc-400 pt-2">
                            <Link to="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
                            <span className="text-zinc-600">•</span>
                            <Link to="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-12 text-zinc-500">
                        Section not found. Return to <Link to="/settings" className="text-amber-400 underline">Settings</Link>.
                    </div>
                );
        }
    };

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col bg-[#090A0C] text-zinc-100 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-300">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/3 w-[350px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 pb-16 px-4 md:px-6">
                {/* Top Bar */}
                <div className="sticky top-0 z-20 flex items-center justify-between py-4 bg-[#090A0C]/85 backdrop-blur-md border-b border-white/[0.06] -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-white transition-colors"
                        aria-label="Back to settings"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <h2 className="text-white text-base md:text-lg font-bold uppercase tracking-wider font-display text-center truncate px-2">
                        {getTitle()}
                    </h2>
                    <div className="size-10" />
                </div>

                {/* Toast Message */}
                {message && (
                    <div className={`mb-6 p-3.5 rounded-xl text-xs font-bold uppercase tracking-wide text-center border animate-in fade-in ${
                        messageType === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                        {message}
                    </div>
                )}

                {/* Subpage Content */}
                <div className="flex-1">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
