import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { getAllUsers, followUser, unfollowUser, isFollowing, getAvailabilityConfig } from '../services/userService';
import { guildService, type Guild } from '../services/guildService';
import { facilityService, type Facility } from '../services/facilityService';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import AddToProjectModal from '../components/AddToProjectModal';
import MapDiscovery from '../components/MapDiscovery';
import PostMedia from '../components/PostMedia';
import AvailabilityAvatar from '../components/AvailabilityAvatar';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';

import { CURATED_CINEMA_TALENT } from '../constants/curatedTalent';

export default function BrowseProfiles() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const toast = useToast();

    // Primary Pillar: 'talent' | 'guilds' | 'studios'
    const [pillar, setPillar] = useState<'talent' | 'guilds' | 'studios'>('talent');

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState(initialQuery);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null && q !== searchQuery) {
            setSearchQuery(q);
        }
    }, [searchParams]);
    const [activeCraft, setActiveCraft] = useState('All');
    const [activeLocation, setActiveLocation] = useState('All');
    const [availabilityOnly, setAvailabilityOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<'discover' | 'connections'>('discover');

    // Data States
    const [profiles, setProfiles] = useState<any[]>([]);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [guildsLoading, setGuildsLoading] = useState(false);
    const [facilitiesLoading, setFacilitiesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Interactive Modals
    const [shortlistModalData, setShortlistModalData] = useState<any | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'directory'>('grid');

    const craftOptions = [
        { label: 'All Crafts', value: 'All', icon: 'auto_awesome' },
        { label: 'Directors', value: 'Director', icon: 'movie' },
        { label: 'Cinematographers', value: 'Cinematographer', icon: 'videocam' },
        { label: 'Actors', value: 'Actor', icon: 'theater_comedy' },
        { label: 'Writers', value: 'Writer', icon: 'edit_note' },
        { label: 'Editors & Color', value: 'Editor', icon: 'content_cut' },
        { label: 'Sound & Music', value: 'Sound', icon: 'graphic_eq' },
        { label: 'Art & Crew', value: 'Crew', icon: 'construction' }
    ];

    const regionalHubs = [
        { label: 'All India', value: 'All' },
        { label: 'Mumbai (Bollywood)', value: 'Mumbai' },
        { label: 'Hyderabad (Tollywood)', value: 'Hyderabad' },
        { label: 'Chennai (Kollywood)', value: 'Chennai' },
        { label: 'Bangalore (Sandalwood)', value: 'Bangalore' },
        { label: 'Kochi (Mollywood)', value: 'Kochi' },
        { label: 'Delhi / NCR', value: 'Delhi' }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const liveUsers = await getAllUsers();
                
                // Merge live Firestore users with curated sample directory profiles to ensure a rich experience
                const liveUids = new Set(liveUsers.map(u => u.uid));
                const supplemental = CURATED_CINEMA_TALENT.filter(p => !liveUids.has(p.uid as string));
                const combined = [...liveUsers, ...supplemental];

                const profilesWithFollow = await Promise.all(combined.map(async (u) => {
                    const isFollowingUser = currentUser ? await isFollowing(currentUser.uid, u.uid as string).catch(() => false) : false;
                    return { ...u, isFollowing: isFollowingUser };
                }));

                setProfiles(profilesWithFollow);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch profiles:", err);
                setError("Failed to load profiles. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentUser]);

    // Lazy load guilds and facilities when respective pillar is active
    useEffect(() => {
        if (pillar === 'guilds' && guilds.length === 0) {
            setGuildsLoading(true);
            guildService.getAllGuilds().then((g: any) => {
                setGuilds(g);
                setGuildsLoading(false);
            }).catch((e: any) => {
                console.error("Failed to load guilds", e);
                setGuildsLoading(false);
            });
        } else if (pillar === 'studios' && facilities.length === 0) {
            setFacilitiesLoading(true);
            facilityService.getFacilities().then((f: any) => {
                setFacilities(f);
                setFacilitiesLoading(false);
            }).catch((e: any) => {
                console.error("Failed to load facilities", e);
                setFacilitiesLoading(false);
            });
        }
    }, [pillar, guilds.length, facilities.length]);

    // Handle Follow / Unfollow
    const handleToggleFollow = async (e: React.MouseEvent, targetProfile: any) => {
        e.stopPropagation();
        if (!currentUser) {
            openAuthModal('Sign in to follow filmmakers & talent');
            return;
        }
        if (currentUser.uid === targetProfile.uid) return;

        const isCurrentlyFollowing = targetProfile.isFollowing;
        const originalProfiles = [...profiles];

        setProfiles(prev => prev.map(p =>
            p.uid === targetProfile.uid ? { ...p, isFollowing: !isCurrentlyFollowing } : p
        ));

        try {
            if (isCurrentlyFollowing) {
                await unfollowUser(currentUser.uid, targetProfile.uid);
                toast.info(`Unfollowed ${targetProfile.displayName || 'user'}`);
            } else {
                await followUser(currentUser.uid, targetProfile.uid);
                toast.success(`Following ${targetProfile.displayName || 'user'}`);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            setProfiles(originalProfiles);
            toast.error("Failed to update follow status.");
        }
    };

    // Quick Direct Message
    const handleDirectMessage = (e: React.MouseEvent, profile: any) => {
        e.stopPropagation();
        if (!currentUser) {
            openAuthModal(`Sign in to message ${profile.displayName || 'this professional'}`);
            return;
        }
        navigate(`/chat/${profile.uid}`);
    };

    // Add to project shortlist
    const handleShortlist = (e: React.MouseEvent, profile: any) => {
        e.stopPropagation();
        if (!currentUser) {
            openAuthModal('Sign in to shortlist talent for production projects');
            return;
        }
        setShortlistModalData(profile);
    };

    const renderVerificationBadge = (tier?: string) => {
        if (tier === 'gold') {
            return (
                <span title="Gold Verified • Industry Guild / Studio" className="material-symbols-outlined text-amber-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                </span>
            );
        }
        if (tier === 'blue') {
            return (
                <span title="Blue Verified • Certified Cinema Professional" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                </span>
            );
        }
        return null;
    };

    // Filter & Rank Profiles
    const filteredProfiles = useMemo(() => {
        const list = profiles.filter((profile) => {
            if (activeTab === 'connections' && !profile.isFollowing) return false;

            // Filter out obvious test/junk accounts from public showcase
            const name = (profile.displayName || '').trim();
            const lowerName = name.toLowerCase();
            if (
                lowerName.startsWith('test') ||
                lowerName.startsWith('dummy') ||
                lowerName === 'asdf' ||
                lowerName === 'qwerty' ||
                lowerName.includes('test user') ||
                lowerName.includes('vege c') ||
                lowerName.includes('dart jet') ||
                lowerName.includes('dart') ||
                (name.length < 2 && !profile.photoURL) ||
                (!profile.bio && !profile.role && !profile.photoURL && (!profile.skills || profile.skills.length === 0))
            ) {
                return false;
            }

            // Search query
            const searchLower = searchQuery.toLowerCase().trim();
            if (searchLower) {
                const nameMatch = (profile.displayName || '').toLowerCase().includes(searchLower);
                const roleMatch = (profile.role || '').toLowerCase().includes(searchLower);
                const locationMatch = (profile.location || '').toLowerCase().includes(searchLower);
                const skillsMatch = (profile.skills || []).some((s: string) => s.toLowerCase().includes(searchLower));
                const bioMatch = (profile.bio || '').toLowerCase().includes(searchLower);
                if (!nameMatch && !roleMatch && !locationMatch && !skillsMatch && !bioMatch) {
                    return false;
                }
            }

            // Craft Filter
            if (activeCraft !== 'All') {
                const r = (profile.role || '').toLowerCase();
                const target = activeCraft.toLowerCase();
                if (target === 'sound') {
                    if (!r.includes('sound') && !r.includes('music') && !r.includes('foley') && !r.includes('composer')) return false;
                } else if (target === 'editor') {
                    if (!r.includes('editor') && !r.includes('colorist') && !r.includes('vfx')) return false;
                } else if (target === 'crew') {
                    if (!r.includes('crew') && !r.includes('art') && !r.includes('production') && !r.includes('gaffer') && !r.includes('stunt')) return false;
                } else {
                    if (!r.includes(target)) return false;
                }
            }

            // Regional Location Filter
            if (activeLocation !== 'All') {
                const loc = (profile.location || '').toLowerCase();
                if (!loc.includes(activeLocation.toLowerCase())) return false;
            }

            // Availability Filter
            if (availabilityOnly) {
                const avail = getAvailabilityConfig(profile.availabilityStatus);
                if (avail.code !== 'available') return false;
            }

            // Verified Only
            if (verifiedOnly) {
                const tier = profile.verification_tier || profile.user_details?.verification_tier;
                if (!tier || (tier !== 'gold' && tier !== 'blue')) return false;
            }

            return true;
        });

        // Rank profiles: Complete, high-credibility profiles with real credits and verification rank first
        return list.sort((a, b) => {
            const scoreProfile = (p: any) => {
                let score = 0;
                const tier = p.verification_tier || p.user_details?.verification_tier;
                if (tier === 'gold') score += 50;
                else if (tier === 'blue') score += 30;
                
                // Photo exists and is not default
                if (p.photoURL && !p.photoURL.includes('default') && !p.photoURL.includes('ui-avatars')) score += 20;
                
                // Substantial bio
                if (p.bio && p.bio.length > 20) score += 15;
                
                // Experience/credits
                if (p.experience && p.experience.length > 0) score += Math.min(p.experience.length * 5, 20);
                
                // Skills listed
                if (p.skills && p.skills.length > 0) score += 10;
                
                // Role specified
                if (p.role && p.role !== 'Filmmaker') score += 5;

                return score;
            };

            return scoreProfile(b) - scoreProfile(a);
        });
    }, [profiles, activeTab, searchQuery, activeCraft, activeLocation, availabilityOnly, verifiedOnly]);

    const filteredGuilds = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return guilds;
        return guilds.filter(g =>
            (g.name || '').toLowerCase().includes(q) ||
            (g.description || '').toLowerCase().includes(q) ||
            (g.category || '').toLowerCase().includes(q)
        );
    }, [guilds, searchQuery]);

    const filteredFacilities = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return facilities.filter(f => {
            if (activeLocation !== 'All') {
                if (!(f.location || '').toLowerCase().includes(activeLocation.toLowerCase())) return false;
            }
            if (!q) return true;
            return (
                (f.name || '').toLowerCase().includes(q) ||
                (f.location || '').toLowerCase().includes(q) ||
                (f.type || '').toLowerCase().includes(q) ||
                (f.description || '').toLowerCase().includes(q)
            );
        });
    }, [facilities, searchQuery, activeLocation]);


    const activeFilterCount = (activeCraft !== 'All' ? 1 : 0) + (activeLocation !== 'All' ? 1 : 0) + (availabilityOnly ? 1 : 0) + (verifiedOnly ? 1 : 0);

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-36 md:pb-24 overflow-x-hidden font-display select-none transition-colors">
            <SEO
                title="Filmmaker & Talent Directory | Actors, Directors & Crew"
                description="Search the comprehensive film industry directory. Connect with verified actors, directors, cinematographers, editors, and production crew across Tollywood, Bollywood, Kollywood, and Pan-India cinema."
                keywords={[
                    'film directory',
                    'actors directory',
                    'casting directory',
                    'film directors list',
                    'cinematographers',
                    'film crew hire',
                    'south cinema filmmakers',
                    'tollywood artists',
                    'bollywood crew',
                    'indian cinema directory'
                ]}
            />
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1 px-4 sm:px-6">

                {/* 1. CINEMA DIRECTORY TOP HEADER (Mobile View) */}
                <header className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 py-3 -mx-4 px-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={toggleDarkMode}
                            className="flex md:hidden size-9 rounded-xl items-center justify-center bg-white dark:bg-[#121316] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 active:scale-95 transition-all"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                        {pillar === 'talent' && (
                            <button
                                onClick={() => setViewMode(prev => prev === 'grid' ? 'directory' : 'grid')}
                                className={`size-9 rounded-xl flex items-center justify-center transition-all ${
                                    viewMode === 'directory'
                                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                                        : 'bg-white dark:bg-[#121316] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                                title={viewMode === 'grid' ? "Switch to Directory List" : "Switch to Grid View"}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {viewMode === 'grid' ? 'format_list_bulleted' : 'grid_view'}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowMap(true)}
                            className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center active:scale-95 transition-all"
                            title="Interactive Map Discovery"
                        >
                            <span className="material-symbols-outlined text-xl">map</span>
                        </button>
                        {pillar === 'talent' && (
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className={`size-9 rounded-xl flex items-center justify-center relative transition-all ${
                                    activeFilterCount > 0
                                        ? 'bg-amber-500 text-zinc-950 font-bold'
                                        : 'bg-white dark:bg-[#121316] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10'
                                }`}
                                title="Filters"
                            >
                                <span className="material-symbols-outlined text-xl">tune</span>
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 size-4 bg-amber-500 text-zinc-950 font-black text-[9px] rounded-full flex items-center justify-center shadow-xs">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                </header>

                {/* 2. DESKTOP HERO & SPOTLIGHT BANNER */}
                <div className="hidden md:flex flex-col gap-3 pt-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5 mb-1">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                Certified Cinema Directory & Production Network
                            </span>
                            <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                                <span>Talent Directory</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 tracking-normal">
                                    {pillar === 'talent' ? `${filteredProfiles.length} Verified Creatives` : pillar === 'guilds' ? `${guilds.length} Guilds` : `${facilities.length} Studios`}
                                </span>
                            </h1>
                        </div>

                        {/* Top Right Desktop Controls */}
                        <div className="flex items-center gap-2.5">

                            {pillar === 'talent' && (
                                <div className="flex items-center bg-white dark:bg-[#121316] p-1 rounded-xl border border-zinc-200 dark:border-white/10 shadow-xs">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            viewMode === 'grid'
                                                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-base ${viewMode === 'grid' ? 'text-zinc-950 font-bold' : ''}`}>grid_view</span>
                                        <span>Grid</span>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('directory')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            viewMode === 'directory'
                                                ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span className={`material-symbols-outlined text-base ${viewMode === 'directory' ? 'text-zinc-950 font-bold' : ''}`}>format_list_bulleted</span>
                                        <span>Directory</span>
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setShowMap(true)}
                                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-base">map</span>
                                <span>Interactive Map</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. THREE-PILLAR MASTER SWITCHER (Talent • Film Guilds • Studios & Gear) */}
                <div className="pt-3 pb-3">
                    <div className="grid grid-cols-3 bg-zinc-100 dark:bg-[#121316] p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm dark:shadow-lg gap-1">
                        <button
                            onClick={() => { setPillar('talent'); setSearchQuery(''); }}
                            className={`py-2 sm:py-2.5 px-1 sm:px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 min-w-0 overflow-hidden ${
                                pillar === 'talent'
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base shrink-0">person</span>
                            <span className="truncate"><span className="hidden sm:inline">Key </span>Talent</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${pillar === 'talent' ? 'bg-white/20 text-white font-black' : 'bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'}`}>
                                {profiles.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setPillar('guilds'); setSearchQuery(''); }}
                            className={`py-2 sm:py-2.5 px-1 sm:px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 min-w-0 overflow-hidden ${
                                pillar === 'guilds'
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base shrink-0">groups</span>
                            <span className="truncate"><span className="hidden sm:inline">Film </span>Guilds</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${pillar === 'guilds' ? 'bg-white/20 text-white font-black' : 'bg-white/10 text-zinc-300'}`}>
                                {guilds.length || 18}
                            </span>
                        </button>

                        <button
                            onClick={() => { setPillar('studios'); setSearchQuery(''); }}
                            className={`py-2 sm:py-2.5 px-1 sm:px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 min-w-0 overflow-hidden ${
                                pillar === 'studios'
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm sm:text-base shrink-0">videocam</span>
                            <span className="truncate">Studios<span className="hidden sm:inline"> & Gear</span></span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${pillar === 'studios' ? 'bg-white/20 text-white font-black' : 'bg-white/10 text-zinc-300'}`}>
                                {facilities.length || 34}
                            </span>
                        </button>
                    </div>
                </div>

                {/* 4. UNIVERSAL SEARCH & QUICK FILTER BAR */}
                <div className="space-y-3 pb-3">
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-zinc-500 text-xl pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                pillar === 'talent'
                                    ? "Search directors, cinematographers, actors, editors, skills (e.g. Alexa 35)..."
                                    : pillar === 'guilds'
                                    ? "Search cinema associations, unions & societies (WICA, SWA, FWICE)..."
                                    : "Search sound stages, camera rental houses, dubbing suites..."
                            }
                            className="w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-2xl pl-11 pr-10 py-3 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500/50 transition-all shadow-sm dark:shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        )}
                    </div>

                    {/* Regional Cinema Hub Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 shrink-0 flex items-center gap-1 pl-1">
                            <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                            <span>Hub:</span>
                        </span>
                        {regionalHubs.map((hub) => (
                            <button
                                key={hub.value}
                                onClick={() => setActiveLocation(hub.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                                    activeLocation === hub.value
                                        ? 'bg-amber-500 text-white font-bold shadow-md'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5 shadow-xs'
                                }`}
                            >
                                {hub.label}
                            </button>
                        ))}
                    </div>

                    {/* Pillar 1 Specific Controls: Tabs + Craft Chips + Toggles */}
                    {pillar === 'talent' && (
                        <div className="space-y-2.5 pt-1">
                            {/* All Filmmakers vs My Circle */}
                            <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-white/5 pb-2">
                                <div className="flex gap-3 sm:gap-4 shrink-0">
                                    <button
                                        onClick={() => setActiveTab('discover')}
                                        className={`pb-1 text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative ${
                                            activeTab === 'discover'
                                                ? 'text-amber-600 dark:text-amber-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 dark:after:bg-amber-400 font-extrabold'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        All Filmmakers
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('connections')}
                                        className={`pb-1 text-xs sm:text-sm font-bold whitespace-nowrap transition-all relative ${
                                            activeTab === 'connections'
                                                ? 'text-amber-600 dark:text-amber-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 dark:after:bg-amber-400 font-extrabold'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                    >
                                        My Circle ({profiles.filter(p => p.isFollowing).length})
                                    </button>
                                </div>

                                {/* Quick Toggle Pills */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => setAvailabilityOnly(prev => !prev)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                            availabilityOnly
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10'
                                        }`}
                                    >
                                        <span className={`size-1.5 rounded-full ${availabilityOnly ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`} />
                                        <span>Available for Projects</span>
                                    </button>

                                    <button
                                        onClick={() => setVerifiedOnly(prev => !prev)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                                            verifiedOnly
                                                ? 'bg-amber-500 text-white shadow-sm'
                                                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[13px] filled">verified</span>
                                        <span>Verified Only</span>
                                    </button>
                                </div>
                            </div>

                            {/* Craft Carousel Pills */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {craftOptions.map((craft) => (
                                    <button
                                        key={craft.value}
                                        onClick={() => setActiveCraft(craft.value)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                                            activeCraft === craft.value
                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold shadow-md'
                                                : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5 shadow-xs'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{craft.icon}</span>
                                        <span>{craft.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. PILLAR 1: TALENT DIRECTORY STREAM */}
                {pillar === 'talent' && (
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
                                Loading Verified Cinema Directory...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white dark:bg-[#121316] rounded-2xl border border-red-500/20 shadow-sm">
                            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                            <p className="text-sm text-red-500 font-semibold">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="py-16 px-4 bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/5 my-4 shadow-sm">
                            <EmptyState
                                message={activeTab === 'connections' ? "No connections in your circle yet" : "No film professionals found"}
                                subMessage={activeTab === 'connections' ? "Discover and follow filmmakers across India to build your production circle!" : "Try adjusting your craft role, location filter, or search query."}
                                icon={activeTab === 'connections' ? "group_off" : "person_search"}
                                actionLabel={activeTab === 'connections' ? "Browse All Filmmakers" : "Reset All Filters"}
                                onAction={() => {
                                    setSearchQuery('');
                                    setActiveCraft('All');
                                    setActiveLocation('All');
                                    setAvailabilityOnly(false);
                                    setVerifiedOnly(false);
                                    setActiveTab('discover');
                                }}
                            />
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            /* CINEMATIC GRID VIEW */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4 pt-1">
                                {filteredProfiles.map((profile) => {
                                    const tier = profile.verification_tier || profile.user_details?.verification_tier;
                                    const avail = getAvailabilityConfig(profile.availabilityStatus);
                                    const profileHref = (profile.role || '').toLowerCase() === 'studio' || (profile.role || '').toLowerCase() === 'service' 
                                        ? `/business/${profile.uid}` 
                                        : `/profile/${profile.uid}`;

                                    return (
                                        <article
                                            key={profile.uid}
                                            className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.07] hover:border-amber-500/40 p-3 sm:p-3.5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg dark:shadow-md dark:hover:shadow-amber-500/10"
                                        >
                                            <Link 
                                                to={profileHref} 
                                                className="absolute inset-0 z-0 rounded-2xl" 
                                                aria-label={`View profile of ${profile.displayName || 'Filmmaker'}`} 
                                            />
                                            <div>
                                                {/* Headshot / Portfolio Visual */}
                                                <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-black mb-3 border border-white/10 group-hover:border-amber-500/30 transition-colors pointer-events-none">
                                                    <PostMedia
                                                        src={profile.photoURL || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                                                    {/* Top Left: Location Badge on Photo */}
                                                    <div className="absolute top-2 left-2 flex items-center pointer-events-none z-10 max-w-[60%]">
                                                        <span className="truncate flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[10px] text-zinc-200 shadow-xs">
                                                            <span className="material-symbols-outlined text-[11px] text-amber-400 shrink-0">location_on</span>
                                                            <span className="truncate">{profile.location || 'India'}</span>
                                                        </span>
                                                    </div>

                                                    {/* Top Right Quick Actions (Shortlist & Follow) */}
                                                    <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-auto z-10">
                                                        <button
                                                            onClick={(e) => handleShortlist(e, profile)}
                                                            className="size-7 rounded-lg bg-black/70 hover:bg-amber-500 hover:text-white text-white border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110"
                                                            title="Add to Project Shortlist"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">playlist_add</span>
                                                        </button>

                                                        {currentUser?.uid !== profile.uid && (
                                                            <button
                                                                onClick={(e) => handleToggleFollow(e, profile)}
                                                                className={`size-7 rounded-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 border ${
                                                                    profile.isFollowing
                                                                        ? 'bg-amber-500 text-white border-amber-500 font-bold'
                                                                        : 'bg-black/70 text-white border-white/10 hover:text-amber-400'
                                                                }`}
                                                                title={profile.isFollowing ? "Following" : "Follow"}
                                                            >
                                                                <span className="material-symbols-outlined text-[15px]">
                                                                    {profile.isFollowing ? 'check' : 'person_add'}
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Bottom: LinkedIn-style Availability Ribbon Overlay on Photo (Single, Non-repeating) */}
                                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                                                        <span className={`text-xs sm:text-[10px] font-black px-2.5 sm:px-2 py-1 sm:py-0.5 rounded-lg sm:rounded-md backdrop-blur-md flex items-center gap-1.5 border shadow-md tracking-wide uppercase ${
                                                            avail.code === 'available'
                                                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20'
                                                                : avail.code === 'working'
                                                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/40 shadow-amber-500/20'
                                                                : 'bg-zinc-950/90 text-zinc-300 border-white/20'
                                                        }`}>
                                                            <span className={`size-2.5 sm:size-2 rounded-full ${avail.dotColor} ${avail.code === 'available' ? 'animate-pulse' : ''}`} />
                                                            <span>#{avail.code === 'available' ? 'AVAILABLE' : avail.code === 'working' ? 'UPCOMING' : 'UNAVAILABLE'}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Profile Details */}
                                                <div className="space-y-1 relative z-0 pointer-events-none">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h3 className="text-zinc-900 dark:text-white text-sm font-bold truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1">
                                                            <span className="truncate">{profile.displayName || 'Filmmaker'}</span>
                                                            {renderVerificationBadge(tier)}
                                                        </h3>
                                                    </div>

                                                    {/* Primary Craft Pill */}
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 truncate capitalize">
                                                            {profile.role || 'Cinema Professional'}
                                                        </span>
                                                    </div>

                                                    {/* Experience Credits / Skills */}
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 pt-0.5">
                                                        {profile.experience?.length
                                                            ? `${profile.experience.length} Notable Credits`
                                                            : profile.skills?.length
                                                            ? profile.skills.slice(0, 2).join(' • ')
                                                            : (tier === 'gold' || profile.guild ? 'Certified Guild Member' : 'Cinema Practitioner')}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between gap-1.5 relative z-10">
                                                <button
                                                    onClick={(e) => handleDirectMessage(e, profile)}
                                                    className="flex-1 py-1 px-2 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                                                    title="Send Direct Message"
                                                >
                                                    <span className="material-symbols-outlined text-xs">chat</span>
                                                    <span>Chat</span>
                                                </button>

                                                <Link
                                                    to={profileHref}
                                                    className="py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold flex items-center justify-center gap-0.5 transition-all"
                                                >
                                                    <span>View</span>
                                                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                </Link>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            /* PRODUCTION DIRECTORY LIST VIEW (High-density scannability for line producers) */
                            <div className="flex flex-col divide-y divide-zinc-200 dark:divide-white/5 bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-sm dark:shadow-xl">
                                {filteredProfiles.map((profile) => {
                                    const tier = profile.verification_tier || profile.user_details?.verification_tier;
                                    const avail = getAvailabilityConfig(profile.availabilityStatus);
                                    const profileHref = (profile.role || '').toLowerCase() === 'studio' || (profile.role || '').toLowerCase() === 'service' 
                                        ? `/business/${profile.uid}` 
                                        : `/profile/${profile.uid}`;

                                    return (
                                        <div
                                            key={profile.uid}
                                            className="relative p-3.5 sm:p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                        >
                                            <Link 
                                                to={profileHref} 
                                                className="absolute inset-0 z-0" 
                                                aria-label={`View profile of ${profile.displayName || 'Filmmaker'}`} 
                                            />
                                            <div className="flex items-center gap-3.5 min-w-0 relative z-0 pointer-events-none">
                                                {/* Avatar with LinkedIn-Style Cinema Availability Ribbon */}
                                                <AvailabilityAvatar
                                                    src={profile.photoURL || ''}
                                                    alt={profile.displayName || 'Filmmaker'}
                                                    status={profile.availabilityStatus}
                                                    size="md"
                                                    shape="circle"
                                                    className="group-hover:scale-105 transition-transform"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors truncate flex items-center gap-1">
                                                            <span>{profile.displayName || 'Filmmaker'}</span>
                                                            {renderVerificationBadge(tier)}
                                                        </h3>
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 capitalize">
                                                            {profile.role || 'Cinema Professional'}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${avail.badgeBg} ${avail.badgeText} ${avail.badgeBorder}`}>
                                                            <span className={`size-1.5 rounded-full ${avail.dotColor}`} />
                                                            <span>{avail.label}</span>
                                                        </span>
                                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                                            {profile.location || 'India'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                                                        {profile.bio || (profile.experience?.length ? `${profile.experience.length} Production Credits` : (tier === 'gold' || profile.guild ? 'Certified Guild Member' : 'Cinema Practitioner'))}
                                                    </p>

                                                    {/* Skills Tags */}
                                                    {profile.skills && profile.skills.length > 0 && (
                                                        <div className="hidden sm:flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                            {profile.skills.slice(0, 3).map((skill: string, i: number) => (
                                                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button Strip */}
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 relative z-10 pointer-events-auto">
                                                <button
                                                    onClick={(e) => handleDirectMessage(e, profile)}
                                                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                                                    title="Message"
                                                >
                                                    <span className="material-symbols-outlined text-sm">chat</span>
                                                    <span className="hidden sm:inline">Message</span>
                                                </button>

                                                <button
                                                    onClick={(e) => handleShortlist(e, profile)}
                                                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 text-xs font-semibold flex items-center gap-1 transition-all"
                                                    title="Add to Project Shortlist"
                                                >
                                                    <span className="material-symbols-outlined text-sm">playlist_add</span>
                                                    <span className="hidden sm:inline">Shortlist</span>
                                                </button>

                                                {currentUser?.uid !== profile.uid && (
                                                    <button
                                                        onClick={(e) => handleToggleFollow(e, profile)}
                                                        className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                                            profile.isFollowing
                                                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                                : 'bg-white/5 text-zinc-300 border-white/10 hover:text-amber-400'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            {profile.isFollowing ? 'check' : 'person_add'}
                                                        </span>
                                                        <span className="hidden sm:inline ml-1">
                                                            {profile.isFollowing ? 'Following' : 'Follow'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )
                )}

                {/* 6. PILLAR 2: FILM GUILDS & ASSOCIATIONS */}
                {pillar === 'guilds' && (
                    guildsLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 tracking-wide uppercase">
                                Loading Film Guilds & Unions...
                            </p>
                        </div>
                    ) : filteredGuilds.length === 0 ? (
                        <div className="py-16 px-4 bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/5 my-4 shadow-sm">
                            <EmptyState
                                message="No guilds or unions found"
                                subMessage="Try searching with a different term like Directing, Camera, Writers, or Workers."
                                icon="groups"
                                actionLabel="Clear Search"
                                onAction={() => setSearchQuery('')}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                            {filteredGuilds.map((guild) => (
                                <div
                                    key={guild.id}
                                    onClick={() => navigate('/guilds')}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 p-4 shadow-sm hover:shadow-lg dark:shadow-md dark:hover:shadow-amber-500/10 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                                                <span className="material-symbols-outlined text-2xl">
                                                    {guild.icon || 'groups'}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10">
                                                {guild.category}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug">
                                            {guild.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                                            {guild.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>{guild.memberCount || 140} Active Members</span>
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/guilds');
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <span>Enter Guild</span>
                                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* 7. PILLAR 3: STUDIOS, SOUNDSTAGES & GEAR RENTALS */}
                {pillar === 'studios' && (
                    facilitiesLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide uppercase">
                                Loading Studios & Equipment Facilities...
                            </p>
                        </div>
                    ) : filteredFacilities.length === 0 ? (
                        <div className="py-16 px-4 bg-white dark:bg-[#121316] rounded-2xl border border-zinc-200 dark:border-white/5 my-4 shadow-sm">
                            <EmptyState
                                message="No studios or camera houses found"
                                subMessage="Try searching for Sound Stage, Alexa 35, Dubbing, or Chroma Floor in your preferred city."
                                icon="videocam"
                                actionLabel="Clear Search"
                                onAction={() => { setSearchQuery(''); setActiveLocation('All'); }}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                            {filteredFacilities.map((facility) => (
                                <div
                                    key={facility.id}
                                    onClick={() => navigate(`/booking/details/${facility.id}`)}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 p-3.5 shadow-sm hover:shadow-lg dark:shadow-md dark:hover:shadow-amber-500/10 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-black mb-3 border border-zinc-200 dark:border-white/10">
                                            <PostMedia
                                                src={facility.image || ''}
                                                fallbackType="COMPANY_LOGO"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-white/10 uppercase tracking-wider">
                                                {facility.type}
                                            </span>

                                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 shadow-md">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                Available
                                            </span>
                                        </div>

                                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                                            {facility.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                            <span>{facility.location}</span>
                                        </p>
                                    </div>

                                    <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                                            <span className="material-symbols-outlined text-amber-500 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-zinc-900 dark:text-white font-bold">{facility.rating || 4.9}</span>
                                            <span className="text-zinc-500 dark:text-zinc-400">({facility.reviews || 42} reviews)</span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/booking/details/${facility.id}`);
                                            }}
                                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1"
                                        >
                                            <span className="text-white">Inquire</span>
                                            <span className="material-symbols-outlined text-xs text-white">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Bottom Navigation Dock */}
            <BottomNav />

            {/* Shortlist Modal */}
            {shortlistModalData && (
                <AddToProjectModal
                    userId={shortlistModalData.uid}
                    userName={shortlistModalData.displayName}
                    userPhoto={shortlistModalData.photoURL}
                    userRole={shortlistModalData.role || 'Industry Pro'}
                    onClose={() => setShortlistModalData(null)}
                    onSuccess={() => {
                        toast.success(`Shortlisted ${shortlistModalData.displayName || 'talent'} to project!`);
                        setShortlistModalData(null);
                    }}
                />
            )}

            {/* Map Discovery View Modal */}
            {showMap && (
                <MapDiscovery
                    profiles={filteredProfiles}
                    onClose={() => setShowMap(false)}
                />
            )}

            {/* Advanced Filters Drawer (Mobile) */}
            {showFilterModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in"
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        className="w-full max-w-lg bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/10 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">tune</span>
                                    <span>Filter Cinema Directory</span>
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Refine by craft role, cinema hub, and availability</p>
                            </div>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
                            {/* Role Filters */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5">
                                    Craft Role
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {craftOptions.map((craft) => (
                                        <button
                                            key={craft.value}
                                            onClick={() => setActiveCraft(craft.value)}
                                            className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all border ${
                                                activeCraft === craft.value
                                                    ? 'bg-amber-500 text-white border-transparent font-bold'
                                                    : 'bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base">{craft.icon}</span>
                                                <span>{craft.label}</span>
                                            </span>
                                            {activeCraft === craft.value && (
                                                <span className="material-symbols-outlined text-sm">check</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location Filters */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5">
                                    Production Hub / City
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {regionalHubs.map((hub) => (
                                        <button
                                            key={hub.value}
                                            onClick={() => setActiveLocation(hub.value)}
                                            className={`p-2.5 rounded-xl text-xs font-semibold transition-all text-left border ${
                                                activeLocation === hub.value
                                                    ? 'bg-amber-500 text-white border-transparent font-bold'
                                                    : 'bg-zinc-100 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20'
                                            }`}
                                        >
                                            {hub.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-white/5">
                                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 cursor-pointer">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Available for Projects Only</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={availabilityOnly}
                                        onChange={(e) => setAvailabilityOnly(e.target.checked)}
                                        className="rounded text-amber-500 focus:ring-amber-500 size-4 bg-zinc-100 dark:bg-black/40 border-zinc-300 dark:border-white/20"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 cursor-pointer">
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 text-base filled">verified</span>
                                        <span>Verified Pros & Studios Only</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={verifiedOnly}
                                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                                        className="rounded text-amber-500 focus:ring-amber-500 size-4 bg-zinc-100 dark:bg-black/40 border-zinc-300 dark:border-white/20"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex items-center gap-3 shrink-0 bg-slate-50 dark:bg-[#0e0f12]">
                            <button
                                onClick={() => {
                                    setActiveCraft('All');
                                    setActiveLocation('All');
                                    setAvailabilityOnly(false);
                                    setVerifiedOnly(false);
                                    setSearchQuery('');
                                    setShowFilterModal(false);
                                }}
                                className="flex-1 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/10 font-bold text-xs transition-all"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xs transition-all shadow-md"
                            >
                                Apply Filters ({activeFilterCount})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
