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
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // State for forms
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState('English');

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
            case 'contact-login': return 'Contact & Login Details';
            case 'subscription': return 'Subscription & Billing';
            case 'notifications': return 'Notifications';
            case 'change-password': return 'Change Password';
            case 'language': return 'Language';
            case 'help': return 'Help & Support';
            case 'about': return 'About iFilmDirectory';
            default: return 'Settings';
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            if (currentUser) {
                await updatePassword(currentUser, newPassword);
                setMessage('Password updated successfully');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (section) {
            case 'contact-login':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Email</p>
                            <p className="text-lg font-medium text-zinc-900 dark:text-white">{currentUser?.email}</p>
                        </div>
                        {profile?.username && (
                            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Username</p>
                                <p className="text-lg font-medium text-zinc-900 dark:text-white">@{profile.username}</p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    ifilmdirectory.com/profile/{profile.username}
                                </p>
                            </div>
                        )}
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">User ID</p>
                            <p className="text-sm font-mono text-zinc-900 dark:text-white break-all">{currentUser?.uid}</p>
                        </div>
                    </div>
                );
            case 'subscription':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
                            <h3 className="text-xl font-bold text-primary mb-2">Free Plan</h3>
                            <p className="text-zinc-600 dark:text-zinc-300 mb-4">You are currently on the free tier.</p>
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    Basic Profile
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    Limited Showreel Uploads
                                </li>
                                <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    Community Access
                                </li>
                            </ul>
                            <button className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors">
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="flex flex-col gap-2">
                        {['Email Notifications', 'Push Notifications', 'Marketing Emails', 'New Job Alerts'].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <span className="text-zinc-900 dark:text-white font-medium">{item}</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'change-password':
                return (
                    <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-white border-none focus:ring-2 focus:ring-primary"
                            required
                            minLength={6}
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-white border-none focus:ring-2 focus:ring-primary"
                            required
                            minLength={6}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                );
            case 'language':
                return (
                    <div className="flex flex-col gap-2">
                        {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Spanish'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setCurrentLanguage(lang)}
                                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${currentLanguage === lang
                                    ? 'bg-primary/10 border border-primary text-primary'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                <span className="font-medium">{lang}</span>
                                {currentLanguage === lang && (
                                    <span className="material-symbols-outlined">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                );
            case 'help':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Contact Support</h4>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
                                Need help? Our support team is available 24/7 to assist you with any issues.
                            </p>
                            <button className="text-primary font-medium hover:underline">support@ifilmdirectory.com</button>
                        </div>
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <h4 className="font-bold text-zinc-900 dark:text-white mb-2">FAQs</h4>
                            <div className="space-y-2">
                                <details className="group">
                                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-zinc-800 dark:text-zinc-200">
                                        <span>How do I upload a showreel?</span>
                                        <span className="transition group-open:rotate-180">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </span>
                                    </summary>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 group-open:animate-fadeIn">
                                        Go to your profile and click on the "Upload Showreel" button in the Showreels section.
                                    </p>
                                </details>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-700" />
                                <details className="group">
                                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-zinc-800 dark:text-zinc-200">
                                        <span>Is it free to use?</span>
                                        <span className="transition group-open:rotate-180">
                                            <span className="material-symbols-outlined">expand_more</span>
                                        </span>
                                    </summary>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 group-open:animate-fadeIn">
                                        Yes, iFilmDirectory offers a free tier with essential features for all film professionals.
                                    </p>
                                </details>
                            </div>
                        </div>
                    </div>
                );
            case 'about':
                return (
                    <div className="flex flex-col items-center gap-4 text-center py-8">
                        <Logo size="xl" showText={false} className="mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400">Version 1.0.0</p>
                        <p className="text-zinc-600 dark:text-zinc-300 max-w-xs">
                            The ultimate hub for film professionals to connect, collaborate, and create magic together.
                        </p>
                        <div className="mt-8 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                            <Link to="/terms" className="hover:text-primary">Terms of Service</Link>
                            <span>•</span>
                            <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link>
                        </div>
                    </div>
                );
            default:
                return <div>Section not found</div>;
        }
    };

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto flex flex-col flex-1 pb-12">
            {/* Top Bar */}
            <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 p-4 pb-2 justify-between backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-zinc-900 dark:text-white">arrow_back</span>
                </button>
                <h2 className="text-zinc-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                    {getTitle()}
                </h2>
                <div className="size-12" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm text-center ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message}
                    </div>
                )}
                {renderContent()}
            </div>
            </div>
        </div>
    );
}
