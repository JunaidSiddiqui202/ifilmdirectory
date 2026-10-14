import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostMedia from '../components/PostMedia';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import ImageUploadModal from '../components/ImageUploadModal';
import ProfileEnhancementModal from '../components/ProfileEnhancementModal';
import EditProfileModal from '../components/EditProfileModal';
import ExperienceModal, { type ExperienceItem } from '../components/ExperienceModal';
import { type EnhancedProfile } from '../services/aiService';
import VerificationModal from '../components/VerificationModal';
import { useAuth } from '../context/AuthContext';
import {
    getUserProfile,
    updateUserProfile,
    type UserProfile as UserProfileType,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowersCount,
    getFollowingCount,
    getUserByUsername
} from '../services/userService';
import GalleryUploadModal from '../components/GalleryUploadModal';
import PrivacySettingsModal from '../components/PrivacySettingsModal';
import FollowListModal from '../components/FollowListModal';

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
        verification: { isVerified: true, status: 'verified' }
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
        verification: { isVerified: true, status: 'verified' }
    },
    // Move previous mock users to avoid conflict
    'u1': {
        uid: 'u1',
        displayName: 'Aarav Sharma',
        role: 'Actor',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
        email: 'aarav@example.com',
        createdAt: new Date().toISOString()
    },
    'u2': {
        uid: 'u2',
        displayName: 'Priya Patel',
        role: 'Director',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
        email: 'priya@example.com',
        createdAt: new Date().toISOString()
    },
    '3': {
        uid: '3',
        displayName: 'Rohan Das',
        role: 'Sound Designer',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
        email: 'rohan@example.com',
        createdAt: new Date().toISOString()
    },
    '4': {
        uid: '4',
        displayName: 'Ananya Reddy',
        role: 'Cinematographer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
        email: 'ananya@example.com',
        createdAt: new Date().toISOString()
    },
    '5': {
        uid: '5',
        displayName: 'Sameer Khan',
        role: 'Editor',
        photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop',
        email: 'sameer@example.com',
        createdAt: new Date().toISOString()
    },
    '6': {
        uid: '6',
        displayName: 'Isha Gupta',
        role: 'Writer',
        photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
        email: 'isha@example.com',
        createdAt: new Date().toISOString()
    },
    '7': {
        uid: '7',
        displayName: 'Karan Johar',
        role: 'Producer',
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
        verification: { isVerified: true, status: 'verified' }
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
        verification: { isVerified: true, status: 'verified' }
    }
};

export default function UserProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
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
    const [activeTab, setActiveTab] = useState('Portfolio');
    const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
    const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');

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
                        setProfile(null);
                    }

                    // Fetch followers/following using the actual UID from the profile
                    const actualUid = data?.uid || uid;
                    const [followers, following, isFollowingUser] = await Promise.all([
                        getFollowersCount(actualUid),
                        getFollowingCount(actualUid),
                        !isMe && currentUser ? isFollowing(currentUser.uid, actualUid) : Promise.resolve(false)
                    ]);
                    setFollowersCount(followers);
                    setFollowingCount(following);
                    setFollowed(isFollowingUser);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                if (id && mockProfiles[id]) {
                    setProfile(mockProfiles[id] as UserProfileType);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, currentUser, isMe]);

    const handleToggleFollow = async () => {
        if (!currentUser) return navigate('/login');
        if (!profile?.uid) return;

        try {
            if (followed) {
                await unfollowUser(currentUser.uid, profile.uid);
                setFollowed(false);
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                await followUser(currentUser.uid, profile.uid);
                setFollowed(true);
                setFollowersCount(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };

    const handleSaveProfileImage = async (url: string) => {
        if (currentUser && profile) {
            try {
                await updateUserProfile(currentUser.uid, { photoURL: url });
                setProfile({ ...profile, photoURL: url });
            } catch (error) {
                console.error("Error updating profile image:", error);
            }
        }
    };

    const handleProfileEnhancement = async (enhancedData: EnhancedProfile) => {
        if (currentUser && profile) {
            try {
                const updatedProfile = {
                    ...profile,
                    displayName: profile.displayName, // Keep original name
                    role: enhancedData.headline as any,
                    bio: enhancedData.bio.standard, // Use standard bio version
                    // Note: AI does not currently return physicalAttributes or structured experience with dates
                };

                await updateUserProfile(currentUser.uid, updatedProfile);
                setProfile(updatedProfile);

                alert('Profile enhanced successfully!');
            } catch (error) {
                console.error("Error updating profile:", error);
            }
        }
    };

    const handleSaveProfile = async (updatedProfile: UserProfileType) => {
        if (!currentUser) return;

        try {
            console.log(`[UserProfile] Saving profile for UID: ${currentUser.uid}`, updatedProfile);
            await updateUserProfile(currentUser.uid, updatedProfile);
            console.log('[UserProfile] Profile save call completed');

            // Force refresh the profile from Firebase
            const freshProfile = await getUserProfile(currentUser.uid);
            if (freshProfile) {
                setProfile(freshProfile);
                console.log('[UserProfile] Profile refreshed from Firestore:', freshProfile);
                alert(`✅ Profile for "${freshProfile.displayName || 'You'}" updated successfully!`);
            } else {
                setProfile(updatedProfile);
                alert('✅ Profile updated! (Visual update complete)');
            }
        } catch (error: any) {
            console.error("Error updating profile:", error);
            alert(`❌ Failed to update profile: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSaveExperience = async (item: ExperienceItem) => {
        if (!currentUser || !profile) return;

        const currentExperience = profile.experience || [];
        let updatedExperience;

        const existingIndex = currentExperience.findIndex(e => e.id === item.id);
        if (existingIndex >= 0) {
            updatedExperience = [...currentExperience];
            updatedExperience[existingIndex] = item;
        } else {
            updatedExperience = [...currentExperience, item];
        }

        try {
            const updatedProfile = { ...profile, experience: updatedExperience };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Error saving experience:", error);
            alert("Failed to save experience.");
        }
    };

    const handleDeleteExperience = async (id: string) => {
        if (!currentUser || !profile) return;

        const updatedExperience = (profile.experience || []).filter(e => e.id !== id);

        try {
            const updatedProfile = { ...profile, experience: updatedExperience };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Error deleting experience:", error);
            alert("Failed to delete experience.");
        }
    };

    const handleSaveGalleryPhoto = async (url: string) => {
        if (!currentUser || !profile) return;
        const updatedGallery = [...(profile.gallery || []), url];
        try {
            const updatedProfile = { ...profile, gallery: updatedGallery };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Error saving gallery photo:", error);
        }
    };

    const handleSavePrivacySettings = async (settings: UserProfileType['privacySettings']) => {
        if (!currentUser || !profile) return;
        try {
            const updatedProfile = { ...profile, privacySettings: settings };
            await updateUserProfile(currentUser.uid, updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Error saving privacy settings:", error);
            throw error;
        }
    };

    if (loading) {
        return <div className="flex min-h-[100dvh] items-center justify-center text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark">Loading...</div>;
    }

    if (!profile) {
        return (
            <div className="flex min-h-[100dvh] flex-col items-center justify-center text-zinc-900 dark:text-white bg-background-light dark:bg-background-dark gap-4">
                <span className="material-symbols-outlined text-6xl text-zinc-400">person_off</span>
                <p className="text-xl font-bold">User not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-primary hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }



    const isAdminUser = isMe && currentUser && (['junaid202@gmail.com', 'junaid202@hotmail.com'].includes(currentUser.email || '') || (profile?.role as string) === 'admin' || profile?.adminRole === 'super_admin');

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#090A0C] font-display text-white antialiased pb-36 md:pb-24">
            <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col flex-1">
            {/* Top Navigation Bar: Mobile only (Desktop uses sidebar + direct profile header) */}
            <div className="md:hidden flex items-center justify-between p-4 bg-[#090A0C]/90 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-[#121316] border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <Logo size="sm" showText={true} />
                    </div>
                </div>
                <button className="p-2 rounded-xl bg-[#121316] border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">share</span>
                </button>
            </div>

            {/* Profile Info Section: Vertical on mobile, Instagram-Desktop horizontal layout on md: */}
            <div className="flex flex-col md:flex-row md:items-start md:gap-10 lg:gap-14 px-6 pt-3 md:pt-10 pb-6 md:pb-8">
                {/* Profile Image (Centered on mobile, left column on desktop) */}
                <div className="relative mb-4 md:mb-0 shrink-0 self-center md:self-start">
                    <div className="size-32 sm:size-36 md:size-40 lg:size-44 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
                        <PostMedia
                            src={profile?.photoURL || ''}
                            fallbackType={profile?.role === 'actor' ? 'ACTOR' : 'GENERAL'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {isMe && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="absolute bottom-1 right-1 size-9 md:size-10 rounded-full bg-amber-500 border-2 border-[#090A0C] text-black shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                            title="Edit photo"
                        >
                            <span className="material-symbols-outlined text-lg md:text-xl font-bold">edit</span>
                        </button>
                    )}
                </div>

                {/* Profile Details Column */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                    {/* Top Row: Name, Verification Badge & Desktop Action Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-3.5 w-full">
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            {!isMe && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="hidden md:flex p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors mr-1"
                                    title="Back"
                                >
                                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                                </button>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                <span>{profile?.displayName || 'Anonymous User'}</span>
                                {(profile?.verification_tier === 'gold' || profile?.verification_tier === 'blue') && (
                                    <span className="material-symbols-outlined text-amber-500 text-2xl filled">verified</span>
                                )}
                            </h1>
                        </div>

                        {/* Desktop Only: Inline Action Buttons (matching Instagram Desktop header) */}
                        <div className="hidden md:flex items-center gap-2.5 mt-2 md:mt-0 flex-wrap">
                            {isMe ? (
                                <>
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/10 active:scale-95"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setIsEnhanceModalOpen(true)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-110 transition-all shadow-md shadow-purple-500/20 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                        AI Enhance
                                    </button>
                                    <button
                                        onClick={() => {
                                            const text = encodeURIComponent(`Check out my professional profile on iFilmDirectory: ${window.location.href}`);
                                            window.open(`https://wa.me/?text=${text}`, '_blank');
                                        }}
                                        className="p-2 rounded-xl bg-[#22c55e] hover:bg-[#1eb054] text-white transition-all shadow-sm active:scale-95"
                                        title="Share on WhatsApp"
                                    >
                                        <span className="material-symbols-outlined text-lg">share</span>
                                    </button>
                                    {isAdminUser && (
                                        <button
                                            onClick={() => navigate('/-admin')}
                                            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                            Admin
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleToggleFollow}
                                        className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                                            followed
                                                ? 'bg-zinc-800 text-white border border-white/10 hover:bg-zinc-700'
                                                : 'bg-amber-500 text-black hover:bg-amber-400 shadow-sm shadow-amber-500/25'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{followed ? 'person_check' : 'person_add'}</span>
                                        <span>{followed ? 'Following' : 'Follow'}</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/chat/${profile.uid}`)}
                                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all border border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">mail</span>
                                        <span>Message</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats Row (Credits/Media, Followers, Following) */}
                    <div className="flex justify-center md:justify-start gap-8 md:gap-10 w-full mb-4">
                        <div className="text-center md:text-left">
                            <span className="font-extrabold text-base md:text-lg text-white">
                                {(profile?.gallery?.length || 0) + (profile?.experience?.length || 0)}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium ml-1.5">Credits</span>
                        </div>
                        <div
                            className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setFollowListType('followers'); setIsFollowListModalOpen(true); }}
                        >
                            <span className="font-extrabold text-base md:text-lg text-white">{followersCount}</span>
                            <span className="text-xs text-zinc-400 font-medium ml-1.5">Followers</span>
                        </div>
                        <div
                            className="text-center md:text-left cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setFollowListType('following'); setIsFollowListModalOpen(true); }}
                        >
                            <span className="font-extrabold text-base md:text-lg text-white">{followingCount}</span>
                            <span className="text-xs text-zinc-400 font-medium ml-1.5">Following</span>
                        </div>
                    </div>

                    {/* Role & Location & Bio */}
                    <div className="space-y-1.5 mb-5 md:mb-0 max-w-xl">
                        <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {profile?.role || 'Film Professional'}
                            </span>
                            {profile?.location && (
                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                                    {profile.location}
                                </span>
                            )}
                        </div>
                        {profile?.bio && (
                            <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                                {profile.bio}
                            </p>
                        )}
                    </div>

                    {/* Mobile Only: Vertical Action Buttons Stack (Untouched on mobile!) */}
                    <div className="flex md:hidden flex-col gap-2.5 w-full max-w-sm mt-3">
                        {isMe ? (
                            <>
                                <button
                                    onClick={() => setIsEditProfileModalOpen(true)}
                                    className="w-full h-11 rounded-xl bg-white/10 text-white font-bold text-sm flex items-center justify-center hover:bg-white/15 transition-all border border-white/10"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => setIsEnhanceModalOpen(true)}
                                    className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-md shadow-purple-500/20"
                                >
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                    AI Enhance Profile
                                </button>
                                <button
                                    onClick={() => {
                                        const text = encodeURIComponent(`Check out my professional profile on iFilmDirectory: ${window.location.href}`);
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="w-full h-11 rounded-xl bg-[#22c55e] text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">share</span>
                                    Invite Friends via WhatsApp
                                </button>

                                {isAdminUser && (
                                    <button
                                        onClick={() => navigate('/-admin')}
                                        className="w-full h-11 rounded-xl bg-[#111827] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all border border-white/10"
                                    >
                                        <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                        Admin Management
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleToggleFollow}
                                    className={`w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        followed
                                            ? 'bg-zinc-800 text-white border border-white/10'
                                            : 'bg-amber-500 text-black hover:bg-amber-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">{followed ? 'person_check' : 'person_add'}</span>
                                    {followed ? 'Following' : 'Follow'}
                                </button>
                                <button
                                    onClick={() => navigate(`/chat/${profile.uid}`)}
                                    className="w-full h-11 rounded-xl bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10"
                                >
                                    <span className="material-symbols-outlined">mail</span>
                                    Message
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation: Centered on desktop with icons, matching Instagram desktop */}
            <div className="border-t border-white/10 mt-4 md:mt-6 overflow-x-auto no-scrollbar">
                <div className="flex w-full md:justify-center min-w-max px-4 gap-2 md:gap-8">
                    {[
                        { id: 'Portfolio', label: 'Portfolio', icon: 'grid_on' },
                        { id: 'Availability', label: 'Availability', icon: 'event_available' },
                        { id: 'About', label: 'About', icon: 'person' },
                        { id: 'Contact', label: 'Contact', icon: 'alternate_email' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 md:px-6 py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-all relative ${
                                activeTab === tab.id
                                    ? 'text-white border-t-2 border-amber-500 -mt-[1px]'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 bg-[#090A0C] min-h-[400px]">
                {activeTab === 'Portfolio' && (
                    <div className="p-6 pb-32 flex flex-col gap-10">
                        {/* Showreels Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Showreels</h2>
                                <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold cursor-pointer">
                                    Privacy
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(profile?.gallery || []).slice(0, 4).map((url, idx) => (
                                    <div key={idx} className="flex flex-col gap-3">
                                        <div className="aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm border border-white/5">
                                            <PostMedia src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                                <div className="size-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                                    <span className="material-symbols-outlined text-white text-2xl filled">play_arrow</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-1">
                                            <h3 className="font-bold text-base md:text-lg text-white truncate">{idx === 0 ? 'Drama Reel 2023' : idx === 1 ? 'Action Sequence' : 'Showreel Feature'}</h3>
                                            <p className="text-zinc-400 text-xs md:text-sm font-medium">{idx === 0 ? 'My Showreel' : 'Compilation'}</p>
                                        </div>
                                    </div>
                                ))}
                                {(profile?.gallery || []).length === 0 && (
                                    <div className="col-span-full py-12 bg-zinc-900/50 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 gap-2">
                                        <span className="material-symbols-outlined text-zinc-400 text-4xl">movie</span>
                                        <p className="text-zinc-400 font-bold italic">No showreels added yet</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Photos Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Photos</h2>
                                <button
                                    onClick={() => setIsGalleryModalOpen(true)}
                                    className="flex items-center gap-1.5 text-amber-500 text-sm font-bold hover:brightness-90 transition-all"
                                >
                                    Add Photos
                                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                                </button>
                            </div>
                            <div className="flex md:grid md:grid-cols-4 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                                {(profile?.gallery || []).length > 0 ? (
                                    profile.gallery?.map((url, idx) => (
                                        <div key={idx} className="w-[140px] md:w-full aspect-square shrink-0 rounded-2xl overflow-hidden bg-zinc-900 shadow-sm border border-white/10 group">
                                            <PostMedia src={url} className="w-full h-full object-cover grayscale active:grayscale-0 md:grayscale-0 md:group-hover:scale-105 transition-all duration-300" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="w-full md:col-span-4 py-10 bg-zinc-900/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-800">
                                        <p className="text-zinc-400 font-bold italic">No photos added</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Skills Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Skills</h2>
                                <button
                                    onClick={() => setIsEditProfileModalOpen(true)}
                                    className="flex items-center gap-1.5 text-amber-500 text-sm font-bold hover:brightness-90 transition-all"
                                >
                                    Edit
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2.5">
                                {(profile?.skills || ['MONOLOGUE', 'STUNT WORK', 'IMPROVISATION', 'CLASSICAL DANCE', 'VOICE ACTING']).map((skill, idx) => {
                                    const colors = [
                                        { bg: 'bg-[#ebf0ff]/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
                                        { bg: 'bg-[#fdf2f8]/10', text: 'text-pink-400', border: 'border-pink-500/20' },
                                        { bg: 'bg-[#ecfdf5]/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
                                        { bg: 'bg-[#f0f9ff]/10', text: 'text-sky-400', border: 'border-sky-500/20' },
                                        { bg: 'bg-[#f5f3ff]/10', text: 'text-purple-400', border: 'border-purple-500/20' },
                                    ];
                                    const color = colors[idx % colors.length];
                                    return (
                                        <span
                                            key={skill}
                                            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${color.bg} ${color.text} ${color.border}`}
                                        >
                                            {skill}
                                        </span>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Recent Projects</h2>
                                <button
                                    onClick={() => setIsExperienceModalOpen(true)}
                                    className="flex items-center gap-1.5 text-amber-500 text-sm font-bold hover:brightness-90 transition-all"
                                >
                                    Add New
                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                </button>
                            </div>
                            <div className="flex flex-col gap-4">
                                {(profile?.experience || []).length > 0 ? (
                                    profile.experience?.map((exp) => (
                                        <div
                                            key={exp.id}
                                            onClick={() => isMe && (setEditingExperience(exp), setIsExperienceModalOpen(true))}
                                            className="flex gap-5 p-4 rounded-2xl bg-[#121316] border border-white/10 items-center cursor-pointer group hover:border-amber-500/40 transition-all shadow-sm"
                                        >
                                            <div className="w-14 h-18 bg-zinc-800 rounded-xl shrink-0 overflow-hidden flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-zinc-400 text-3xl">
                                                    {exp.type === 'movie' ? 'movie' : exp.type === 'tv' ? 'tv' : 'theaters'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-lg font-bold truncate group-hover:text-amber-500 transition-colors text-white">{exp.title}</h3>
                                                    <span className="text-sm font-bold text-zinc-400">{exp.year}</span>
                                                </div>
                                                <p className="text-amber-500 font-bold uppercase tracking-wider text-xs">{exp.role}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-800">
                                        <p className="text-zinc-400 font-bold italic">No projects listed</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Under Production Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Under Production</h2>
                                {isMe && (
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="flex items-center gap-1.5 text-amber-500 text-sm font-bold hover:brightness-90 transition-all"
                                    >
                                        Manage
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(profile?.underProductionProjects || []).length > 0 ? (
                                    profile.underProductionProjects?.map((project) => (
                                        <div key={project.id} className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-white line-clamp-1">{project.title}</h3>
                                                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30 shrink-0">
                                                    {project.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">{project.role}</p>
                                            {project.description && (
                                                <p className="text-sm text-zinc-400 line-clamp-2 italic">"{project.description}"</p>
                                            )}
                                            {project.expectedRelease && (
                                                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                                                    <span className="material-symbols-outlined text-sm">event</span>
                                                    Expected: {project.expectedRelease}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-800">
                                        <p className="text-zinc-400 font-bold italic">No under-production works listed</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Past Works Section */}
                        <section>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-2xl font-bold text-white">Past Works</h2>
                                {isMe && (
                                    <button
                                        onClick={() => setIsEditProfileModalOpen(true)}
                                        className="flex items-center gap-1.5 text-amber-500 text-sm font-bold hover:brightness-90 transition-all"
                                    >
                                        Manage
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-4">
                                {(profile?.pastProjects || []).length > 0 ? (
                                    profile.pastProjects?.map((project) => (
                                        <div key={project.id} className="flex gap-5 p-5 rounded-2xl bg-[#121316] border border-white/10 items-center shadow-sm">
                                            <div className="w-14 h-14 bg-zinc-800 rounded-full shrink-0 flex items-center justify-center border border-white/10">
                                                <span className="material-symbols-outlined text-zinc-400 text-3xl">history</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="text-lg font-bold truncate text-white">{project.title}</h3>
                                                    <span className="text-sm font-bold text-zinc-400">{project.year}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-sm font-bold text-amber-500 uppercase tracking-widest">{project.role}</p>
                                                    {project.link && (
                                                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline flex items-center gap-0.5">
                                                            View <span className="material-symbols-outlined text-xs">open_in_new</span>
                                                        </a>
                                                    )}
                                                </div>
                                                {project.description && (
                                                    <p className="text-sm text-zinc-400 mt-2 line-clamp-1">{project.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 bg-zinc-900/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-zinc-800">
                                        <p className="text-zinc-400 font-bold italic">No past works listed</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'About' && (
                    <div className="p-6 pb-32 flex flex-col gap-8">
                        {/* Biography */}
                        <section>
                            <h2 className="text-xl font-bold mb-3">Biography</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans whitespace-pre-wrap">
                                {profile?.bio || "No biography provided."}
                            </p>
                        </section>

                        {/* Additional Details */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile?.location && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Base Location</h4>
                                    <p className="font-medium">{profile.location}</p>
                                </div>
                            )}
                            {profile?.physicalAttributes?.languages && profile.physicalAttributes.languages.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Languages</h4>
                                    <p className="font-medium">{profile.physicalAttributes.languages.join(', ')}</p>
                                </div>
                            )}
                        </section>

                        {/* Physical attributes for actors */}
                        {profile?.role === 'actor' && profile.physicalAttributes && (
                            <section>
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Physical Attributes</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {profile.physicalAttributes.height && (
                                        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Height</p>
                                            <p className="font-bold">{profile.physicalAttributes.height}</p>
                                        </div>
                                    )}
                                    {profile.physicalAttributes.weight && (
                                        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Weight</p>
                                            <p className="font-bold">{profile.physicalAttributes.weight}</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'Availability' && (
                    <div className="p-6 pb-32 flex flex-col gap-6">
                        <section>
                            <h2 className="text-xl font-bold mb-4">Work Availability</h2>
                            <div className={`p-6 rounded-2xl border flex flex-col gap-4 shadow-sm ${profile?.availabilityStatus === 'available'
                                ? 'bg-green-500/5 border-green-500/20'
                                : profile?.availabilityStatus === 'busy'
                                    ? 'bg-red-500/5 border-red-500/20'
                                    : 'bg-primary/5 border-primary/20'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined text-3xl ${profile?.availabilityStatus === 'available' ? 'text-green-500' : 'text-primary'
                                        }`}>
                                        {profile?.availabilityStatus === 'available' ? 'event_available' : 'schedule'}
                                    </span>
                                    <div>
                                        <p className="font-black text-xl capitalize">
                                            {profile?.availabilityStatus?.replace('_', ' ') || 'Available'}
                                        </p>
                                        <p className="text-sm font-medium opacity-60">Status updated recently</p>
                                    </div>
                                </div>

                                {profile?.statusMessage && (
                                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl italic text-lg text-center border border-black/5 dark:border-white/5">
                                        "{profile.statusMessage}"
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'Contact' && (
                    <div className="p-6 pb-32">
                        {/* Contact & Socials */}
                        <section id="contact" className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Email */}
                            <a
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1c242e] text-[#4f6374] dark:text-[#9dabb8] border border-zinc-200 dark:border-zinc-800 hover:text-primary hover:border-primary transition-all shadow-sm"
                                href={`mailto:${profile?.email || ''}`}
                            >
                                <span className="material-symbols-outlined">mail</span>
                                <span className="text-xs font-sans font-medium">Email</span>
                            </a>

                            {/* Website */}
                            {profile?.socialLinks?.website && (
                                <a
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1c242e] text-[#4f6374] dark:text-[#9dabb8] border border-zinc-200 dark:border-zinc-800 hover:text-primary hover:border-primary transition-all shadow-sm"
                                    href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="material-symbols-outlined">language</span>
                                    <span className="text-xs font-sans font-medium">Website</span>
                                </a>
                            )}

                            {/* IMDb */}
                            {profile?.socialLinks?.imdb && (
                                <a
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1c242e] text-[#4f6374] dark:text-[#9dabb8] border border-zinc-200 dark:border-zinc-800 hover:text-primary hover:border-primary transition-all shadow-sm"
                                    href={profile.socialLinks.imdb.startsWith('http') ? profile.socialLinks.imdb : `https://www.imdb.com/name/${profile.socialLinks.imdb}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="material-symbols-outlined">movie</span>
                                    <span className="text-xs font-sans font-medium">IMDb</span>
                                </a>
                            )}

                            {/* Share */}
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: profile?.displayName || 'iFilmDirectory Profile',
                                            text: `Check out my film professional profile on iFilmDirectory!`,
                                            url: window.location.href
                                        });
                                    } else {
                                        const text = encodeURIComponent(`Check out my professional profile on iFilmDirectory: ${window.location.href}`);
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }
                                }}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-[#1c242e] text-[#4f6374] dark:text-[#9dabb8] border border-zinc-200 dark:border-zinc-800 hover:text-primary hover:border-primary transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined">share</span>
                                <span className="text-xs font-sans font-medium">Share</span>
                            </button>

                            {/* Other Socials */}
                            {profile?.socialLinks?.instagram && (
                                <a href={profile.socialLinks.instagram.startsWith('http') ? profile.socialLinks.instagram : `https://instagram.com/${profile.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="col-span-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold font-sans shadow-md hover:opacity-90 transition-all">
                                    View on Instagram
                                </a>
                            )}
                            {profile?.socialLinks?.twitter && (
                                <a href={profile.socialLinks.twitter.startsWith('http') ? profile.socialLinks.twitter : `https://twitter.com/${profile.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="col-span-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl font-bold font-sans shadow-md hover:opacity-90 transition-all">
                                    View on X (Twitter)
                                </a>
                            )}
                        </section>
                    </div>
                )}
            </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Existing Modals */}
            <ImageUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onSave={handleSaveProfileImage} />
            <ProfileEnhancementModal isOpen={isEnhanceModalOpen} onClose={() => setIsEnhanceModalOpen(false)} currentProfile={profile} onApply={handleProfileEnhancement} />
            {profile && <EditProfileModal isOpen={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} profile={profile} onSave={handleSaveProfile} />}
            {profile && <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} profile={profile} onSave={handleSaveProfile} />}
            <ExperienceModal isOpen={isExperienceModalOpen} onClose={() => setIsExperienceModalOpen(false)} onSave={handleSaveExperience} onDelete={handleDeleteExperience} itemToEdit={editingExperience} />
            <GalleryUploadModal isOpen={isGalleryModalOpen} onClose={() => setIsGalleryModalOpen(false)} onSave={handleSaveGalleryPhoto} />
            <PrivacySettingsModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} privacySettings={profile.privacySettings} onSave={handleSavePrivacySettings} />
            {profile && <FollowListModal isOpen={isFollowListModalOpen} onClose={() => setIsFollowListModalOpen(false)} userId={profile.uid} type={followListType} />}
        </div>
    );
}
