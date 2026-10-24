import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostMedia from '../components/PostMedia';
import AvailabilityAvatar from '../components/AvailabilityAvatar';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import HamburgerMenu from '../components/HamburgerMenu';
import MediaUploadModal from '../components/MediaUploadModal';
import ProfileEnhancementModal from '../components/ProfileEnhancementModal';
import CalendarAndAvailability from '../components/CalendarAndAvailability';
import EditProfileModal from '../components/EditProfileModal';
import ExperienceModal, { type ExperienceItem } from '../components/ExperienceModal';
import { type EnhancedProfile } from '../services/aiService';
import VerificationModal from '../components/VerificationModal';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useTheme } from '../context/ThemeContext';
import {
    getUserProfile,
    updateUserProfile,
    type UserProfile as UserProfileType,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowersCount,
    getFollowingCount,
    getUserByUsername,
    hasAdminPrivileges,
    getAvailabilityConfig
} from '../services/userService';

import PrivacySettingsModal from '../components/PrivacySettingsModal';
import FollowListModal from '../components/FollowListModal';
import AddToProjectModal from '../components/AddToProjectModal';
import { useToast } from '../context/ToastContext';
import SEO, { PersonStructuredData, BreadcrumbStructuredData } from '../components/SEO';
import { findCuratedTalent } from '../constants/curatedTalent';

// Mock Profiles for fallback
const mockProfiles: Record<string, any> = {
    // Map Firestore IDs (1, 2) to Studios
    '1': {
        uid: '1',
        displayName: 'Annapurna Studios',
        role: 'studio',
        photoURL: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=400&fit=crop',
        email: 'contact@annapurnastudios.com',
        bio: 'Premier film production facility in Hyderabad with state-of-the-art equipment and world-class infrastructure. Established in 1976, we have been the backbone of Telugu cinema for decades.',
        location: 'Hyderabad, Telangana',
        availabilityStatus: 'available',
        statusMessage: 'Available for Bookings',
        serviceDetails: {
            servicesOffered: ['Film Production', 'Post-Production', 'VFX Studio', 'Sound Mixing', 'Color Grading', 'Equipment Rental'],
            equipment: ['ARRI Alexa', 'RED Camera', 'Dolby Atmos Theater', '4K DI Suite', 'Green Screen Studio', 'Outdoor Sets']
        },
        createdAt: new Date().toISOString(),
        verification: { isVerified: true, status: 'verified', isMobileVerified: true, isEmailVerified: true }
    },
    '2': {
        uid: '2',
        displayName: 'Suresh Productions',
        role: 'studio',
        photoURL: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=400&fit=crop',
        email: 'info@sureshproductions.com',
        bio: 'One of India\'s largest and most prestigious film production companies. Founded in 1964, we have produced over 50 blockbuster films and continue to set industry standards.',
        location: 'Hyderabad, Telangana',
        availabilityStatus: 'available',
        statusMessage: 'Accepting New Projects',
        serviceDetails: {
            servicesOffered: ['Film Production', 'Distribution', 'Post-Production', 'Dubbing Studio', 'Preview Theater'],
            equipment: ['Sony Venice', 'Panavision Cameras', '7.1 Surround Sound', 'Editing Suites', 'DI Theater', 'Recording Studios']
        },
        createdAt: new Date().toISOString(),
        verification: { isVerified: true, status: 'verified', isMobileVerified: true, isEmailVerified: true }
    },
    // Move previous mock users to avoid conflict
    'u1': {
        uid: 'u1',
        displayName: 'Aarav Sharma',
        role: 'actor',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
        email: 'aarav@example.com',
        createdAt: new Date().toISOString()
    },
    'u2': {
        uid: 'u2',
        displayName: 'Priya Patel',
        role: 'director',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
        email: 'priya@example.com',
        createdAt: new Date().toISOString()
    },
    '3': {
        uid: '3',
        displayName: 'Rohan Das',
        role: 'sound_designer',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
        email: 'rohan@example.com',
        createdAt: new Date().toISOString()
    },
    '4': {
        uid: '4',
        displayName: 'Ananya Reddy',
        role: 'cinematographer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
        email: 'ananya@example.com',
        createdAt: new Date().toISOString()
    },
    '5': {
        uid: '5',
        displayName: 'Sameer Khan',
        role: 'editor',
        photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
        email: 'sameer@example.com',
        createdAt: new Date().toISOString()
    },
    '6': {
        uid: '6',
        displayName: 'Isha Gupta',
        role: 'writer',
        photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
        email: 'isha@example.com',
        createdAt: new Date().toISOString()
    },
    '7': {
        uid: '7',
        displayName: 'Karan Johar',
        role: 'producer',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        email: 'karan@example.com',
        createdAt: new Date().toISOString()
    },
    // Keeping string IDs for direct links too
    'annapurna-studios': {
        uid: 'annapurna-studios',
        displayName: 'Annapurna Studios',
        role: 'studio',
        photoURL: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=400&fit=crop',
        email: 'contact@annapurnastudios.com',
        bio: 'Premier film production facility in Hyderabad with state-of-the-art equipment and world-class infrastructure. Established in 1976, we have been the backbone of Telugu cinema for decades.',
        location: 'Hyderabad, Telangana',
        availabilityStatus: 'available',
        statusMessage: 'Available for Bookings',
        serviceDetails: {
            servicesOffered: ['Film Production', 'Post-Production', 'VFX Studio', 'Sound Mixing', 'Color Grading', 'Equipment Rental'],
            equipment: ['ARRI Alexa', 'RED Camera', 'Dolby Atmos Theater', '4K DI Suite', 'Green Screen Studio', 'Outdoor Sets']
        },
        createdAt: new Date().toISOString(),
        verification: { isVerified: true, status: 'verified', isMobileVerified: true, isEmailVerified: true }
    },
    'suresh-productions': {
        uid: 'suresh-productions',
        displayName: 'Suresh Productions',
        role: 'studio',
        photoURL: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=400&fit=crop',
        email: 'info@sureshproductions.com',
        bio: 'One of India\'s largest and most prestigious film production companies. Founded in 1964, we have produced over 50 blockbuster films and continue to set industry standards.',
        location: 'Hyderabad, Telangana',
        availabilityStatus: 'available',
        statusMessage: 'Accepting New Projects',
        serviceDetails: {
            servicesOffered: ['Film Production', 'Distribution', 'Post-Production', 'Dubbing Studio', 'Preview Theater'],
            equipment: ['Sony Venice', 'Panavision Cameras', '7.1 Surround Sound', 'Editing Suites', 'DI Theater', 'Recording Studios']
        },
        createdAt: new Date().toISOString(),
        verification: { isVerified: true, status: 'verified', isMobileVerified: true, isEmailVerified: true }
    }
};

export default function UserProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const toast = useToast();
    const [profile, setProfile] = useState<UserProfileType | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
    const [editingExperience, setEditingExperience] = useState<ExperienceItem | null>(null);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followed, setFollowed] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Portfolio');
    const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
    const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');
    const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false);

    const isMe = !id || (currentUser && (id === currentUser.uid || profile?.uid === currentUser.uid));

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                let uid = id;
                if (!uid && currentUser) {
                    uid = currentUser.uid;
                }

                if (uid) {
                    // Check if the ID looks like a username (contains hyphens or is lowercase alphanumeric)
                    const isUsername = /^[a-z0-9-]+$/.test(uid) && uid.includes('-');

                    let data: UserProfileType | null = null;

                    if (isUsername) {
                        // Try to fetch by username first
                        data = await getUserByUsername(uid);
                    } else {
                        // Fetch by UID
                        data = await getUserProfile(uid);
                    }

                    if (data) {
                        setProfile(data);
                    } else if (mockProfiles[uid]) {
                        // If not found in Firebase, check mock profiles
                        setProfile(mockProfiles[uid] as UserProfileType);
                    } else {
                        // Check curated talent profiles
                        const curated = findCuratedTalent(uid);
                        if (curated) {
                            setProfile(curated as UserProfileType);
                        } else {
                            setProfile(null);
                        }
                    }

                    // Fetch followers/following using the actual UID from the profile
                    const actualUid = data?.uid || uid;
                    const [followers, following, isFollowingUser] = await Promise.all([
                        getFollowersCount(actualUid).catch(() => 0),
                        getFollowingCount(actualUid).catch(() => 0),
                        !isMe && currentUser ? isFollowing(currentUser.uid, actualUid).catch(() => false) : Promise.resolve(false)
                    ]);
                    setFollowersCount(followers);
                    setFollowingCount(following);
                    setFollowed(isFollowingUser);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (id) {
                    if (mockProfiles[id]) {
                        setProfile(mockProfiles[id] as UserProfileType);
                    } else {
                        const curated = findCuratedTalent(id);
                        if (curated) {
                            setProfile(curated as UserProfileType);
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, currentUser, isMe]);

    const handleToggleFollow = async () => {
        if (!currentUser) return openAuthModal('Sign in to follow creators & professionals');
        if (!profile?.uid || isFollowLoading) return;

        if (!navigator.onLine) {
            toast.error("You are offline. Please check your internet connection.");
            return;
        }

        setIsFollowLoading(true);
        try {
            if (followed) {
                await unfollowUser(currentUser.uid, profile.uid);
                setFollowed(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
                toast.info(`Unfollowed ${profile.displayName || 'user'}`);
            } else {
                await followUser(currentUser.uid, profile.uid);
                setFollowed(true);
                setFollowersCount(prev => prev + 1);
                toast.success(`Following ${profile.displayName || 'user'}`);
            }
        } catch (error: unknown) {
            console.error("Error toggling follow:", error);
            const err = error as { message?: string };
            toast.error(err?.message?.includes('network') 
                ? "Network error. Please try again." 
                : "Failed to update follow status.");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleSaveProfileImage = async (url: string) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot update profile photo while offline.");
            return;
        }
        try {
            await updateUserProfile(currentUser.uid, { photoURL: url });
            setProfile({ ...profile, photoURL: url });
            toast.success("Profile photo updated successfully!");
        } catch (error) {
            console.error("Error updating profile image:", error);
            toast.error("Failed to update profile photo.");
        }
    };

    const handleProfileEnhancement = async (enhancedData: EnhancedProfile) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot apply AI enhancement while offline.");
            return;
        }
        try {
            const updatedProfile: any = {
                ...profile,
                displayName: profile.displayName, // Keep original name
                role: (enhancedData.headline?.toLowerCase() || profile.role),
                customRole: enhancedData.headline,
                bio: enhancedData.bio.standard, // Use standard bio version
            };

            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile as UserProfileType);
            toast.success('Profile enhanced with AI successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error('Failed to apply AI profile enhancement.');
        }
    };

    const handleSaveProfile = async (updatedProfile: UserProfileType) => {
        if (!currentUser) return;
        if (!navigator.onLine) {
            toast.error("You are offline. Changes cannot be saved right now.");
            return;
        }

        try {
            await updateUserProfile(currentUser.uid, updatedProfile);

            // Force refresh the profile from Firebase
            const freshProfile = await getUserProfile(currentUser.uid);
            if (freshProfile) {
                setProfile(freshProfile);
                toast.success(`Profile for "${freshProfile.displayName || 'You'}" updated successfully!`);
            } else {
                setProfile(updatedProfile);
                toast.success('Profile updated successfully!');
            }
        } catch (error: unknown) {
            console.error("Error updating profile:", error);
            const err = error as { message?: string };
            toast.error(`Failed to update profile: ${err.message || 'Unknown error'}`);
        }
    };

    const handleSaveExperience = async (item: ExperienceItem) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot save experience while offline.");
            return;
        }

        const currentExperience = profile.experience || [];
        let updatedExperience;

        const existingIndex = currentExperience.findIndex(e => e.id === item.id);
        const isEditing = existingIndex >= 0;
        if (isEditing) {
            updatedExperience = [...currentExperience];
            updatedExperience[existingIndex] = item;
        } else {
            updatedExperience = [...currentExperience, item];
        }

        try {
            const updatedProfile = { ...profile, experience: updatedExperience };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
            toast.success(isEditing ? "Experience updated successfully!" : "Experience added successfully!");
        } catch (error) {
            console.error("Error saving experience:", error);
            toast.error("Failed to save experience.");
        }
    };

    const handleDeleteExperience = async (id: string) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot delete experience while offline.");
            return;
        }

        const updatedExperience = (profile.experience || []).filter(e => e.id !== id);

        try {
            const updatedProfile = { ...profile, experience: updatedExperience };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
            toast.success("Experience deleted.");
        } catch (error) {
            console.error("Error deleting experience:", error);
            toast.error("Failed to delete experience.");
        }
    };

    const handleSaveGalleryPhoto = async (url: string) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot add photo while offline.");
            return;
        }
        const updatedGallery = [...(profile.gallery || []), url];
        try {
            const updatedProfile = { ...profile, gallery: updatedGallery };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
            toast.success("Photo added to gallery successfully!");
        } catch (error) {
            console.error("Error saving gallery photo:", error);
            toast.error("Failed to add photo to gallery.");
        }
    };

    const handleSavePrivacySettings = async (settings: UserProfileType['privacySettings']) => {
        if (!currentUser || !profile) return;
        if (!navigator.onLine) {
            toast.error("Cannot update privacy settings while offline.");
            return;
        }
        try {
            const updatedProfile = { ...profile, privacySettings: settings };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
            toast.success("Privacy settings updated successfully!");
        } catch (error) {
            console.error("Error saving privacy settings:", error);
            toast.error("Failed to update privacy settings.");
            throw error;
        }
    };

    const handleShareProfile = () => {
        if (navigator.share) {
            navigator.share({
                title: profile?.displayName || 'iFilmDirectory Profile',
                text: `Check out ${profile?.displayName || 'this'}'s professional profile on iFilmDirectory!`,
                url: window.location.href
            }).catch(() => {});
        } else {
            const text = encodeURIComponent(`Check out my professional profile on iFilmDirectory: ${window.location.href}`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    if (loading) {
        return <div className="flex min-h-[100dvh] items-center justify-center text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark">Loading...</div>;
    }

    if (!profile) {
        return (
            <div className="flex min-h-[100dvh] flex-col items-center justify-center text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark px-4 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-white/10 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">person_off</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">Profile Not Available</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
                    This profile may have been updated, set to private, or does not exist. Discover verified Indian filmmakers, directors, cinematographers, and actors in our directory.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/browse-profiles')}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base">explore</span>
                        <span>Browse Film Profiles</span>
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-800 dark:text-white font-semibold text-sm transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }



    const isAdminUser = isMe && currentUser && hasAdminPrivileges(profile, currentUser.email);

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden bg-slate-50 dark:bg-[#090A0C] font-display text-zinc-900 dark:text-white antialiased pb-28 md:pb-16 transition-colors">
            {profile && (
                <>
                    <SEO
                        title={`${profile.displayName || 'Filmmaker Profile'} - ${profile.role?.replace('_', ' ') || 'Film Professional'}`}
                        description={profile.bio ? profile.bio.slice(0, 160) : `${profile.displayName || 'Filmmaker'} - ${profile.role || 'Film Professional'} based in ${profile.location || 'India'}. Connect on iFilmDirectory.`}
                        image={profile.photoURL || '/logo.png'}
                        type="profile"
                        keywords={[
                            profile.displayName,
                            profile.role,
                            profile.location,
                            'film profile',
                            'cinema talent',
                            'film crew'
                        ].filter(Boolean) as string[]}
                    />
                    <PersonStructuredData
                        name={profile.displayName || 'Filmmaker'}
                        jobTitle={profile.role || 'Film Professional'}
                        image={profile.photoURL || 'https://ifilmdirectory.com/logo.png'}
                        url={typeof window !== 'undefined' ? window.location.href : `https://ifilmdirectory.com/profile/${profile.uid}`}
                        description={profile.bio || undefined}
                        knowsAbout={profile.skills || undefined}
                    />
                    <BreadcrumbStructuredData
                        items={[
                            { name: 'Home', url: '/' },
                            { name: 'Talent Directory', url: '/browse-profiles' },
                            { name: profile.displayName || 'Profile', url: `/profile/${profile.uid}` }
                        ]}
                    />
                </>
            )}
            <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col flex-1 px-0 sm:px-4">
            {/* Top Navigation Bar: Mobile only */}
            <div className="md:hidden flex items-center justify-between p-3.5 bg-white/95 dark:bg-[#090A0C]/90 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-2.5">
                    <button 
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/browse-profiles');
                            }
                        }} 
                        className="size-9 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center active:scale-95"
                        title="Go back"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <Logo size="sm" showText={true} />
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={toggleDarkMode}
                        className="flex md:hidden size-9 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 transition-colors items-center justify-center active:scale-95"
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button
                        onClick={handleShareProfile}
                        className="size-9 rounded-xl bg-zinc-100 dark:bg-[#121316] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center active:scale-95"
                        title="Share Profile"
                    >
                        <span className="material-symbols-outlined text-lg">share</span>
                    </button>
                    <HamburgerMenu />
                </div>
            </div>

            {/* Cinematic Hero Header Card */}
            <div className="relative w-full rounded-none sm:rounded-3xl overflow-hidden bg-white dark:bg-[#111317] border-0 sm:border border-zinc-200 dark:border-white/10 shadow-xl mb-6">
                {/* Cinematic Backdrop / Film Banner */}
                <div className="relative h-36 sm:h-48 md:h-56 w-full overflow-hidden bg-gradient-to-r from-zinc-900 via-amber-950/40 to-zinc-950">
                    {profile?.gallery && profile.gallery.length > 0 ? (
                        <img 
                            src={profile.gallery[0]} 
                            alt="Cover backdrop" 
                            className="w-full h-full object-cover opacity-25 filter blur-xs scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-zinc-900 to-black" />
                    )}
                    {/* Film grain / filmstrip overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#111317] via-transparent to-black/40" />
                    
                    {/* Top right quick actions on desktop */}
                    <div className="absolute top-4 right-4 hidden md:flex items-center gap-2 z-10">
                        <button
                            onClick={handleShareProfile}
                            className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                            title="Share Profile"
                        >
                            <span className="material-symbols-outlined text-lg">share</span>
                        </button>
                        <button
                            onClick={() => {
                                const text = encodeURIComponent(`Check out ${profile?.displayName || 'this filmmaker'}'s portfolio on iFilmDirectory: ${window.location.href}`);
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}
                            className="p-2.5 rounded-xl bg-[#22c55e]/90 hover:bg-[#22c55e] backdrop-blur-md text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                            title="Share on WhatsApp"
                        >
                            <span className="material-symbols-outlined text-lg">chat</span>
                        </button>
                    </div>

                    {/* Back button on desktop within banner */}
                    <div className="absolute top-4 left-4 hidden md:flex items-center z-10">
                        <button
                            onClick={() => {
                                if (window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/browse-profiles');
                                }
                            }}
                            className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white font-semibold text-xs transition-all border border-white/15 flex items-center gap-1.5 shadow-lg active:scale-95"
                            title="Back to Previous Page"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            <span>Back</span>
                        </button>
                    </div>
                </div>

                {/* Profile Avatar & Details Section */}
                <div className="px-5 sm:px-8 pb-6 -mt-16 sm:-mt-20 md:-mt-24 relative z-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                        {/* Avatar & Main Identity */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                            {/* Profile Image with LinkedIn-Style Cinema Availability Ribbon */}
                            <div className="relative shrink-0">
                                <div className="p-1 rounded-full bg-white dark:bg-[#111317] shadow-2xl ring-4 ring-black/5 dark:ring-white/10">
                                    <AvailabilityAvatar
                                        src={profile?.photoURL || ''}
                                        alt={profile?.displayName || 'User'}
                                        status={profile?.availabilityStatus}
                                        size="2xl"
                                        shape="circle"
                                        fallbackType={profile?.role === 'actor' ? 'ACTOR' : 'GENERAL'}
                                        className="shadow-2xl"
                                    />
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="absolute top-1 right-1 size-9 sm:size-10 rounded-full bg-amber-500 hover:bg-amber-400 border-2 border-white dark:border-[#111317] text-black shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-30"
                                        title="Change profile photo"
                                    >
                                        <span className="material-symbols-outlined text-lg sm:text-xl font-bold">photo_camera</span>
                                    </button>
                                )}
                            </div>

                            {/* Name, Verified Badge & Roles */}
                            <div className="space-y-1.5 pb-1">
                                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                        <span>{profile?.displayName || 'Anonymous User'}</span>
                                        {(profile?.verification_tier === 'gold' || profile?.verification_tier === 'blue' || profile?.verification?.isVerified) && (
                                            <button
                                                onClick={() => isMe && setIsVerificationModalOpen(true)}
                                                className={`inline-flex items-center ${isMe ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                                                title={isMe ? "Click to view verification details" : "Verified Film Professional"}
                                            >
                                                <span className="material-symbols-outlined text-amber-500 text-2xl filled shrink-0 drop-shadow-sm">verified</span>
                                            </button>
                                        )}
                                    </h1>
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap pt-0.5">
                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                        {profile?.role || 'Film Professional'}
                                    </span>
                                    {profile?.location && (
                                        <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1 bg-zinc-100 dark:bg-white/5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-white/5">
                                            <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                                            {profile.location}
                                        </span>
                                    )}
                                    {profile && (() => {
                                        const avail = getAvailabilityConfig(profile.availabilityStatus);
                                        return (
                                            <button
                                                type="button"
                                                onClick={() => isMe && setIsEditProfileModalOpen(true)}
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border shadow-2xs transition-all ${avail.badgeBg} ${avail.badgeText} ${avail.badgeBorder} ${isMe ? 'cursor-pointer hover:scale-105' : ''}`}
                                                title={isMe ? `Click to edit status: ${avail.statusText}` : `Status: ${avail.statusText}`}
                                            >
                                                <span className={`size-1.5 rounded-full ${avail.dotColor} ${avail.code === 'available' ? 'animate-pulse' : ''}`} />
                                                <span>{avail.label}</span>
                                                {isMe && <span className="material-symbols-outlined text-xs opacity-70">edit</span>}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden md:flex items-center gap-2.5 pb-1 flex-wrap justify-end">
                            {isMe ? (
                                <>
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-900 dark:text-white font-bold text-xs transition-all border border-zinc-200 dark:border-white/10 active:scale-95 flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setIsEnhanceModalOpen(true)}
                                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                                        AI Enhance
                                    </button>
                                    {!profile?.verification?.isVerified && (
                                        <button
                                            onClick={() => setIsVerificationModalOpen(true)}
                                            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 active:scale-95 shadow-sm"
                                            title="Apply for Verified Badge"
                                        >
                                            <span className="material-symbols-outlined text-base">verified</span>
                                            {profile?.verification?.status === 'pending' ? 'Pending' : 'Get Verified'}
                                        </button>
                                    )}
                                    {isAdminUser && (
                                        <button
                                            onClick={() => navigate('/-admin')}
                                            className="px-3.5 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-zinc-300 dark:border-white/10"
                                        >
                                            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                            Admin
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleToggleFollow}
                                        disabled={isFollowLoading}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                                            isFollowLoading
                                                ? 'opacity-60 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                                : followed
                                                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-white dark:border-white/10 dark:hover:bg-zinc-700 active:scale-95'
                                                    : 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/25 active:scale-95'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-base ${isFollowLoading ? 'animate-spin' : ''}`}>
                                            {isFollowLoading ? 'sync' : (followed ? 'person_check' : 'person_add')}
                                        </span>
                                        <span>{isFollowLoading ? 'Updating...' : (followed ? 'Following' : 'Follow')}</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal(`Sign in to message ${profile.displayName || 'this creator'}`);
                                                return;
                                            }
                                            navigate(`/chat/${profile.uid}`);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-900 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-white/10 shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-base">mail</span>
                                        <span>Message</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal(`Sign in to add ${profile.displayName || 'this creator'} to your project`);
                                                return;
                                            }
                                            setIsAddToProjectOpen(true);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 shadow-sm"
                                        title="Add to Production Project"
                                    >
                                        <span className="material-symbols-outlined text-base">playlist_add</span>
                                        <span>Shortlist to Project</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats & Bio Card Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-zinc-200 dark:border-white/10">
                        {/* Bio snippet */}
                        <div className="md:col-span-2">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">About Filmmaker</h4>
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
                                {profile?.bio || "Cinema professional on iFilmDirectory. Available for film productions, casting, and collaborations."}
                            </p>
                        </div>

                        {/* Stats Pills */}
                        <div className="flex items-center justify-around md:justify-end gap-3 bg-zinc-50 dark:bg-black/30 p-3 rounded-2xl border border-zinc-200 dark:border-white/5">
                            <div className="text-center px-2">
                                <span className="block font-black text-lg sm:text-xl text-zinc-900 dark:text-white">
                                    {(profile?.gallery?.length || 0) + (profile?.experience?.length || 0)}
                                </span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Credits</span>
                            </div>
                            <div className="h-8 w-px bg-zinc-200 dark:bg-white/10" />
                            <div
                                className="text-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => { setFollowListType('followers'); setIsFollowListModalOpen(true); }}
                            >
                                <span className="block font-black text-lg sm:text-xl text-zinc-900 dark:text-white">{followersCount}</span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Followers</span>
                            </div>
                            <div className="h-8 w-px bg-zinc-200 dark:bg-white/10" />
                            <div
                                className="text-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => { setFollowListType('following'); setIsFollowListModalOpen(true); }}
                            >
                                <span className="block font-black text-lg sm:text-xl text-zinc-900 dark:text-white">{followingCount}</span>
                                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">Following</span>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Only: Action Buttons */}
                    <div className="flex md:hidden flex-col gap-2.5 w-full mt-5 pt-4 border-t border-zinc-200 dark:border-white/10">
                        {isMe ? (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-200 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setIsEnhanceModalOpen(true)}
                                        className="h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-110 transition-all shadow-md shadow-purple-500/20"
                                    >
                                        <span className="material-symbols-outlined text-base">auto_awesome</span>
                                        AI Enhance
                                    </button>
                                </div>
                                {!profile?.verification?.isVerified && (
                                    <button
                                        onClick={() => setIsVerificationModalOpen(true)}
                                        className="w-full h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">verified</span>
                                        {profile?.verification?.status === 'pending' ? 'Verification Pending Review' : 'Get Verified Badge'}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const text = encodeURIComponent(`Check out my professional profile on iFilmDirectory: ${window.location.href}`);
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="w-full h-11 rounded-xl bg-[#22c55e] text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-lg">share</span>
                                    Share on WhatsApp
                                </button>
                                {isAdminUser && (
                                    <button
                                        onClick={() => navigate('/-admin')}
                                        className="w-full h-11 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-[#111827] text-zinc-800 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-zinc-300 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                                        Admin Management
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleToggleFollow}
                                    disabled={isFollowLoading}
                                    className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        isFollowLoading
                                            ? 'opacity-60 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                                            : followed
                                                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-white dark:border-white/10 active:scale-95'
                                                : 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
                                    }`}
                                >
                                    <span className={`material-symbols-outlined ${isFollowLoading ? 'animate-spin' : ''}`}>
                                        {isFollowLoading ? 'sync' : (followed ? 'person_check' : 'person_add')}
                                    </span>
                                    <span>{isFollowLoading ? 'Updating...' : (followed ? 'Following' : 'Follow')}</span>
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal(`Sign in to message ${profile.displayName || 'this creator'}`);
                                                return;
                                            }
                                            navigate(`/chat/${profile.uid}`);
                                        }}
                                        className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-white/10 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">mail</span>
                                        Message
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal(`Sign in to add ${profile.displayName || 'this creator'} to your project`);
                                                return;
                                            }
                                            setIsAddToProjectOpen(true);
                                        }}
                                        className="h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/30"
                                    >
                                        <span className="material-symbols-outlined text-base">playlist_add</span>
                                        Shortlist
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tab Navigation: Centered with cinematic pills */}
                <div className="border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20 overflow-x-auto no-scrollbar">
                    <div className="flex w-full md:justify-center min-w-max px-4 gap-2 sm:gap-4 py-2">
                        {[
                            { id: 'Portfolio', label: 'Portfolio', icon: 'grid_on' },
                            { id: 'About', label: 'Filmography & About', icon: 'person' },
                            { id: 'Availability', label: 'Calendar & Availability', icon: 'calendar_month' },
                            { id: 'Contact', label: 'Contact', icon: 'alternate_email' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 scale-102'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5'
                                }`}
                            >
                                <span className="material-symbols-outlined text-base sm:text-lg">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-h-[400px]">
                {activeTab === 'Portfolio' && (
                    <div className="flex flex-col gap-8 pb-10">
                        {/* Showreels Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                        <span className="material-symbols-outlined text-xl">movie</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Featured Showreels</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Showcase reels, teasers, and performance clips</p>
                                    </div>
                                </div>
                                {isMe ? (
                                    <button
                                        onClick={() => setIsPrivacyModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-colors border border-amber-500/20"
                                        title="Manage portfolio privacy"
                                    >
                                        <span className="material-symbols-outlined text-base">lock</span>
                                        <span>Privacy</span>
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 text-xs font-semibold">
                                        <span className="material-symbols-outlined text-sm">public</span>
                                        Public
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {(profile?.gallery || []).slice(0, 4).map((url, idx) => (
                                    <div key={idx} className="flex flex-col gap-2.5 group">
                                        <div
                                            onClick={() => navigate('/showreels')}
                                            className="aspect-video bg-zinc-950 rounded-2xl overflow-hidden relative cursor-pointer shadow-md border border-zinc-200 dark:border-white/10 group-hover:border-amber-500/50 transition-all"
                                            title="Watch Showreel"
                                        >
                                            <PostMedia src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108 opacity-90 group-hover:opacity-100" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-all">
                                                <div className="size-11 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center border border-white/25 text-white group-hover:bg-amber-500 group-hover:text-black group-hover:scale-110 transition-all shadow-xl">
                                                    <span className="material-symbols-outlined text-2xl filled">play_arrow</span>
                                                </div>
                                            </div>
                                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
                                                HD Reel
                                            </span>
                                        </div>
                                        <div className="px-1">
                                            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                {idx === 0 ? 'Director Reel 2024' : idx === 1 ? 'Dramatic Scene Cut' : 'Cinematography Highlight'}
                                            </h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Showreel Compilation</p>
                                        </div>
                                    </div>
                                ))}
                                {(profile?.gallery || []).length === 0 && (
                                    <div className="col-span-full py-12 bg-zinc-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/10 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-4xl">movie</span>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">No showreels added yet</p>
                                        {isMe && (
                                            <button 
                                                onClick={() => setIsGalleryModalOpen(true)}
                                                className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-sm"
                                            >
                                                Upload Reel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Photos Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                        <span className="material-symbols-outlined text-xl">photo_library</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Production Gallery</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Headshots, set photos, and production stills</p>
                                    </div>
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsGalleryModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all border border-amber-500/30"
                                    >
                                        <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                                        <span>Add Photo</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {(profile?.gallery || []).length > 0 ? (
                                    profile.gallery?.map((url, idx) => (
                                        <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-white/10 group relative">
                                            <PostMedia src={url} className="w-full h-full object-cover group-hover:scale-108 transition-all duration-500" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Still #{idx + 1}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 bg-zinc-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/10 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-3xl">photo_camera</span>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">No photos added yet</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Skills Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                        <span className="material-symbols-outlined text-xl">stars</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Core Competencies & Skills</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Verified skill proficiencies & crafts</p>
                                    </div>
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        <span>Edit</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {(profile?.skills || ['MONOLOGUE', 'STUNT WORK', 'IMPROVISATION', 'CLASSICAL DANCE', 'VOICE ACTING']).map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 hover:border-amber-500/50 hover:text-amber-500 transition-all shadow-xs"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Recent Experience Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                        <span className="material-symbols-outlined text-xl">theaters</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Filmography & Credits</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Feature films, web series, and commercials</p>
                                    </div>
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsExperienceModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all border border-amber-500/30"
                                    >
                                        <span className="material-symbols-outlined text-base">add_circle</span>
                                        <span>Add Credit</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(profile?.experience || []).length > 0 ? (
                                    profile.experience?.map((exp) => (
                                        <div
                                            key={exp.id}
                                            onClick={() => isMe && (setEditingExperience(exp), setIsExperienceModalOpen(true))}
                                            className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 items-center cursor-pointer group hover:border-amber-500/40 transition-all shadow-xs"
                                        >
                                            <div className="size-14 bg-amber-500/10 rounded-2xl shrink-0 flex items-center justify-center border border-amber-500/20 text-amber-500 group-hover:scale-105 transition-transform">
                                                <span className="material-symbols-outlined text-3xl">
                                                    {exp.type === 'movie' ? 'movie' : exp.type === 'tv' ? 'tv' : 'theaters'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h3 className="text-base font-bold truncate group-hover:text-amber-500 transition-colors text-zinc-900 dark:text-white">{exp.title}</h3>
                                                    <span className="text-xs font-black text-amber-500 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 ml-2 shrink-0">{exp.year}</span>
                                                </div>
                                                <p className="text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">{exp.role}</p>
                                                {exp.description && (
                                                    <p className="text-zinc-500 text-xs line-clamp-1 mt-1">{exp.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 bg-zinc-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/10 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-3xl">theaters</span>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">No filmography credits listed yet</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Under Production Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                                        <span className="material-symbols-outlined text-xl">schedule</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Under Production</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Active upcoming film and OTT projects</p>
                                    </div>
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        <span>Manage</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(profile?.underProductionProjects || []).length > 0 ? (
                                    profile.underProductionProjects?.map((project) => (
                                        <div key={project.id} className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 border border-purple-500/20 shadow-xs">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-black text-zinc-900 dark:text-white line-clamp-1">{project.title}</h3>
                                                <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30 shrink-0">
                                                    {project.status}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">{project.role}</p>
                                            {project.description && (
                                                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">"{project.description}"</p>
                                            )}
                                            {project.expectedRelease && (
                                                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                                                    <span className="material-symbols-outlined text-sm text-purple-400">event</span>
                                                    Target Release: {project.expectedRelease}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 bg-zinc-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/10 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-3xl">pending_actions</span>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">No under-production works listed</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Past Works Section */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                        <span className="material-symbols-outlined text-xl">history_edu</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Key Career Milestones</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Notable releases and collaborations</p>
                                    </div>
                                </div>
                                {isMe && (
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all border border-zinc-200 dark:border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">edit</span>
                                        <span>Manage</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(profile?.pastProjects || []).length > 0 ? (
                                    profile.pastProjects?.map((project) => (
                                        <div key={project.id} className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 items-start shadow-xs">
                                            <div className="size-11 bg-zinc-200 dark:bg-white/5 rounded-xl shrink-0 flex items-center justify-center text-zinc-500 mt-0.5">
                                                <span className="material-symbols-outlined text-xl">history</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-base font-bold truncate text-zinc-900 dark:text-white">{project.title}</h3>
                                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-2">{project.year}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-xs font-black text-amber-500 uppercase tracking-wider">{project.role}</p>
                                                    {project.link && (
                                                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-500 hover:underline flex items-center gap-0.5">
                                                            View <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                                {project.description && (
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2">{project.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-10 bg-zinc-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-white/10 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-3xl">history</span>
                                        <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm">No past milestones listed</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'About' && (
                    <div className="flex flex-col gap-6 pb-10">
                        {/* Biography Card */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Biography & Background</h2>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap text-sm sm:text-base">
                                {profile?.bio || "No biography provided yet. Cinema professionals can detail their creative journeys, awards, education, and career vision."}
                            </p>
                        </section>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                                <div className="flex items-center gap-2.5 mb-2">
                                    <div className="size-8 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20">
                                        <span className="material-symbols-outlined text-lg">pin_drop</span>
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Location & Operations</h3>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Base City</h4>
                                    <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{profile?.location || 'Not Specified'}</p>
                                </div>
                                {profile?.physicalAttributes?.languages && profile.physicalAttributes.languages.length > 0 && (
                                    <div className="space-y-1 pt-2">
                                        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Languages Spoken</h4>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {profile.physicalAttributes.languages.map((lang: string) => (
                                                <span key={lang} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Physical attributes for actors */}
                            {profile?.role === 'actor' && profile.physicalAttributes ? (
                                <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                            <span className="material-symbols-outlined text-lg">accessibility_new</span>
                                        </div>
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">Physical Profile</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {profile.physicalAttributes.height && (
                                            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/5">
                                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Height</p>
                                                <p className="font-bold text-base text-zinc-900 dark:text-white mt-0.5">{profile.physicalAttributes.height}</p>
                                            </div>
                                        )}
                                        {profile.physicalAttributes.weight && (
                                            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/5">
                                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Weight</p>
                                                <p className="font-bold text-base text-zinc-900 dark:text-white mt-0.5">{profile.physicalAttributes.weight}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            ) : (
                                <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-center">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                            <span className="material-symbols-outlined text-lg">verified_user</span>
                                        </div>
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">Profile Trust & Verification</h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                        This profile is indexed on iFilmDirectory. Contact details and portfolio links are verified by the production board.
                                    </p>
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Availability' && (
                    <div className="flex flex-col gap-6 pb-10">
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                    <span className="material-symbols-outlined text-xl">event_available</span>
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Work Availability Status</h2>
                                    <p className="text-xs text-zinc-500 font-medium">Real-time schedule for film productions and shoots</p>
                                </div>
                            </div>
                            {(() => {
                                const avail = getAvailabilityConfig(profile?.availabilityStatus);
                                return (
                                    <div className={`p-6 rounded-2xl border flex flex-col gap-5 shadow-xs ${
                                        avail.code === 'available'
                                            ? 'bg-emerald-500/5 border-emerald-500/20'
                                            : avail.code === 'working'
                                            ? 'bg-amber-500/5 border-amber-500/20'
                                            : 'bg-zinc-500/5 border-zinc-500/20'
                                    }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                    avail.code === 'available'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                        : avail.code === 'working'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                                        : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
                                                }`}>
                                                    <span className="material-symbols-outlined text-3xl">
                                                        {avail.icon}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-black text-xl text-zinc-900 dark:text-white flex items-center gap-2">
                                                            <span>{avail.dotEmoji}</span>
                                                            <span>{avail.label}</span>
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                        Status: <span className="text-zinc-800 dark:text-zinc-200">{avail.statusText}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {isMe ? (
                                                <button
                                                    onClick={() => setIsEditProfileModalOpen(true)}
                                                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-900 dark:text-white font-bold text-xs transition-all border border-zinc-200 dark:border-white/10 shrink-0 self-start sm:self-center shadow-xs"
                                                >
                                                    Update Status
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (!currentUser) {
                                                            openAuthModal(`Sign in to contact ${profile?.displayName || 'this creator'}`);
                                                            return;
                                                        }
                                                        navigate(`/chat/${profile?.uid}`);
                                                    }}
                                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 self-start sm:self-center shadow-xs ${
                                                        avail.code === 'unavailable'
                                                            ? 'bg-zinc-100 dark:bg-white/5 text-zinc-500 border border-zinc-200 dark:border-white/10 cursor-not-allowed'
                                                            : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                                                    }`}
                                                >
                                                    {avail.code === 'available'
                                                        ? 'Book for Production'
                                                        : avail.code === 'working'
                                                        ? 'Send Project Enquiry'
                                                        : 'Currently Unavailable'}
                                                </button>
                                            )}
                                        </div>

                                        {profile?.statusMessage && (
                                            <div className="bg-white/80 dark:bg-black/40 p-4 rounded-xl italic text-sm text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/5">
                                                "{profile.statusMessage}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </section>

                        {/* Interactive Shoot Schedule & Booking Calendar */}
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <CalendarAndAvailability isEditable={Boolean(isMe)} showHeader={false} />
                        </section>
                    </div>
                )}

                {activeTab === 'Contact' && (
                    <div className="flex flex-col gap-6 pb-10">
                        <section className="bg-white dark:bg-[#111317] p-5 sm:p-7 rounded-3xl border border-zinc-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center gap-2.5 mb-6">
                                <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Direct Channels & Links</h2>
                                    <p className="text-xs text-zinc-500 font-medium">Connect directly for casting, bookings, and collaborations</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                                {/* Email */}
                                {profile?.email ? (
                                    <a
                                        className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-zinc-50 dark:bg-black/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500 transition-all shadow-xs group"
                                        href={`mailto:${profile.email}`}
                                    >
                                        <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">mail</span>
                                        </div>
                                        <span className="text-xs font-bold">Email</span>
                                    </a>
                                ) : !isMe && profile?.uid ? (
                                    <button
                                        onClick={() => {
                                            if (!currentUser) {
                                                openAuthModal(`Sign in to message ${profile.displayName || 'this creator'}`);
                                                return;
                                            }
                                            navigate(`/chat/${profile.uid}`);
                                        }}
                                        className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-zinc-50 dark:bg-black/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500 transition-all shadow-xs group"
                                    >
                                        <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">chat</span>
                                        </div>
                                        <span className="text-xs font-bold">Message</span>
                                    </button>
                                ) : null}

                                {/* Website */}
                                {profile?.socialLinks?.website && (
                                    <a
                                        className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-zinc-50 dark:bg-black/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500 transition-all shadow-xs group"
                                        href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="size-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">language</span>
                                        </div>
                                        <span className="text-xs font-bold">Website</span>
                                    </a>
                                )}

                                {/* IMDb */}
                                {profile?.socialLinks?.imdb && (
                                    <a
                                        className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-zinc-50 dark:bg-black/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500 transition-all shadow-xs group"
                                        href={profile.socialLinks.imdb.startsWith('http') ? profile.socialLinks.imdb : `https://www.imdb.com/name/${profile.socialLinks.imdb}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <div className="size-11 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">movie</span>
                                        </div>
                                        <span className="text-xs font-bold">IMDb</span>
                                    </a>
                                )}

                                {/* Share */}
                                <button
                                    onClick={handleShareProfile}
                                    className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-zinc-50 dark:bg-black/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500 transition-all shadow-xs group"
                                >
                                    <div className="size-11 rounded-xl bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-2xl">share</span>
                                    </div>
                                    <span className="text-xs font-bold">Share Link</span>
                                </button>
                            </div>

                            {/* Additional Social Handles */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                {profile?.socialLinks?.instagram && (
                                    <a 
                                        href={profile.socialLinks.instagram.startsWith('http') ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-xs shadow-md hover:opacity-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-base">photo_camera</span>
                                        View on Instagram
                                    </a>
                                )}
                                {profile?.socialLinks?.twitter && (
                                    <a 
                                        href={profile.socialLinks.twitter.startsWith('http') ? profile.socialLinks.twitter : `https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-2xl font-bold text-xs shadow-md hover:opacity-90 transition-all border border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-base">tag</span>
                                        View on X (Twitter)
                                    </a>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Consolidated Media Upload Modals */}
            <MediaUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSave={handleSaveProfileImage}
                variant="avatar"
                aspectRatio={1}
            />
            <MediaUploadModal
                isOpen={isGalleryModalOpen}
                onClose={() => setIsGalleryModalOpen(false)}
                onSave={handleSaveGalleryPhoto}
                variant="gallery"
            />
            <ProfileEnhancementModal isOpen={isEnhanceModalOpen} onClose={() => setIsEnhanceModalOpen(false)} currentProfile={profile} onApply={handleProfileEnhancement} />
            {profile && <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} profile={profile} onSave={handleSaveProfile} />}
            {profile && <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} profile={profile} onSave={handleSaveProfile} />}
            <ExperienceModal isOpen={isExperienceModalOpen} onClose={() => setIsExperienceModalOpen(false)} onSave={handleSaveExperience} onDelete={handleDeleteExperience} itemToEdit={editingExperience} />
            <PrivacySettingsModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} privacySettings={profile.privacySettings} onSave={handleSavePrivacySettings} />
            {profile && <FollowListModal isOpen={isFollowListModalOpen} onClose={() => setIsFollowListModalOpen(false)} userId={profile.uid} type={followListType} />}
            {isAddToProjectOpen && profile && (
                <AddToProjectModal
                    userId={profile.uid}
                    userName={profile.displayName || 'Cinema Talent'}
                    userPhoto={profile.photoURL || undefined}
                    userRole={profile.role || 'Film Professional'}
                    onClose={() => setIsAddToProjectOpen(false)}
                    onSuccess={() => {
                        toast.success(`Shortlisted ${profile.displayName} to project!`);
                        setIsAddToProjectOpen(false);
                    }}
                />
            )}
        </div>
    );
}
