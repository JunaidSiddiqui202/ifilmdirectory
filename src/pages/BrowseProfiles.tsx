import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, followUser, unfollowUser, isFollowing } from '../services/userService';
import { guildService, type Guild } from '../services/guildService';
import { facilityService, type Facility } from '../services/facilityService';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import AddToProjectModal from '../components/AddToProjectModal';
import MapDiscovery from '../components/MapDiscovery';
import PostMedia from '../components/PostMedia';
import { useToast } from '../context/ToastContext';

export default function BrowseProfiles() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const toast = useToast();
    const [pillar, setPillar] = useState<'talent' | 'guilds' | 'studios'>('talent');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<'discover' | 'connections'>('discover');
    const [profiles, setProfiles] = useState<any[]>([]);
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [guildsLoading, setGuildsLoading] = useState(false);
    const [facilitiesLoading, setFacilitiesLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shortlistModalData, setShortlistModalData] = useState<any | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'directory'>('grid');

    const filters = ['All', 'Director', 'Cinematographer', 'Actor', 'Editor', 'Writer', 'Crew', 'Sound', 'Studio'];

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // In a real scalability scenario, this should be paginated (query(collection, limit(20)))
                // For now, we fetch all to enable client-side flexible filtering
                const users = await getAllUsers();

                const profilesWithFollow = await Promise.all(users.map(async (u) => {
                    const isFollowingUser = currentUser ? await isFollowing(currentUser.uid, u.uid) : false;
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
    }, []);

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

    // Handle Toggle Follow
    const handleToggleFollow = async (e: React.MouseEvent, targetProfile: any) => {
        e.stopPropagation();
        if (!currentUser) return toast.info("Please login to follow professionals!");
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

    const renderVerificationBadge = (tier?: 'gold' | 'blue' | 'gray') => {
        if (tier === 'gold') return <span title="Verified Production House" className="material-symbols-outlined text-amber-500 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        if (tier === 'blue') return <span title="Verified Professional" className="material-symbols-outlined text-sky-400 text-sm ml-0.5 select-none filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>;
        return null;
    };

    const filteredProfiles = profiles.filter((profile) => {
        if (activeTab === 'connections' && !profile.isFollowing) return false;
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = (profile.displayName || '').toLowerCase().includes(searchLower);
        const roleMatch = (profile.role || '').toLowerCase().includes(searchLower);
        const matchesSearch = nameMatch || roleMatch;
        const matchesFilter =
            activeFilter === 'All' || (profile.role || '').toLowerCase() === activeFilter.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const filteredGuilds = guilds.filter(g => {
        const q = searchQuery.toLowerCase();
        return (g.name || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q);
    });

    const filteredFacilities = facilities.filter(f => {
        const q = searchQuery.toLowerCase();
        return (f.name || '').toLowerCase().includes(q) || (f.location || '').toLowerCase().includes(q) || (f.type || '').toLowerCase().includes(q);
    });

    const handleProfileClick = (profile: any) => {
        const role = (profile.role || '').toLowerCase();
        if (role === 'studio' || role === 'service') {
            navigate(`/business/${profile.uid}`);
        } else {
            navigate(`/profile/${profile.uid}`);
        }
    };

    return (
        <div className="relative flex h-auto min-h-[100dvh] w-full flex-col overflow-x-hidden pb-36 md:pb-24 bg-background-light dark:bg-[#090A0C] transition-colors">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col flex-1">
                {/* Cinema Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090A0C]/85 p-4 pb-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <HamburgerMenu />
                            <Logo size="sm" showText={true} />
                            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Discover
                            </span>
                        </div>
                        <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                            <span className="material-symbols-outlined text-amber-500 text-xl">explore</span>
                            <span>Discover Industry Directory</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {pillar === 'talent' && (
                            <button
                                onClick={() => setViewMode(prev => prev === 'grid' ? 'directory' : 'grid')}
                                className={`flex items-center justify-center rounded-xl size-9 transition-all ${
                                    viewMode === 'directory'
                                        ? 'bg-amber-500 text-black shadow-sm font-bold'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white'
                                }`}
                                title={viewMode === 'grid' ? "Switch to Directory List" : "Switch to Grid View"}
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {viewMode === 'grid' ? 'list' : 'grid_view'}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowMap(true)}
                            className="flex items-center justify-center rounded-xl size-9 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 transition-all"
                            title="Interactive Map"
                        >
                            <span className="material-symbols-outlined text-xl">map</span>
                        </button>
                        {pillar === 'talent' && (
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="flex items-center justify-center rounded-xl size-9 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-white transition-all"
                                title="Filters"
                            >
                                <span className="material-symbols-outlined text-xl">tune</span>
                            </button>
                        )}
                    </div>
                </header>

                {/* 3-Pillar Segment Switcher */}
                <div className="px-4 pt-3 pb-1">
                    <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5">
                        <button
                            onClick={() => { setPillar('talent'); setSearchQuery(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                pillar === 'talent'
                                    ? 'bg-amber-500 text-black font-extrabold shadow-sm shadow-amber-500/25'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            <span>Key Talent</span>
                        </button>
                        <button
                            onClick={() => { setPillar('guilds'); setSearchQuery(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                pillar === 'guilds'
                                    ? 'bg-amber-500 text-black font-extrabold shadow-sm shadow-amber-500/25'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            <span>Film Guilds</span>
                        </button>
                        <button
                            onClick={() => { setPillar('studios'); setSearchQuery(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                pillar === 'studios'
                                    ? 'bg-amber-500 text-black font-extrabold shadow-sm shadow-amber-500/25'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">videocam</span>
                            <span>Studios & Gear</span>
                        </button>
                    </div>
                </div>

                {/* Universal Search Bar */}
                <div className="px-4 py-2.5">
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-zinc-400 dark:text-zinc-500 text-xl pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                pillar === 'talent'
                                    ? "Search directors, DPs, actors, editors..."
                                    : pillar === 'guilds'
                                    ? "Search film guilds, unions & societies..."
                                    : "Search sound stages, camera rentals, studios..."
                            }
                            className="w-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
                            >
                                <span className="material-symbols-outlined text-base">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Filters for Talent */}
                {pillar === 'talent' && (
                    <>
                        <div className="flex gap-2 px-4 py-1 border-b border-black/[0.04] dark:border-white/[0.04] mb-2">
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`pb-2 text-xs font-bold transition-colors border-b-2 ${
                                    activeTab === 'discover'
                                        ? 'border-amber-500 text-amber-500'
                                        : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                }`}
                            >
                                All Filmmakers
                            </button>
                            <button
                                onClick={() => setActiveTab('connections')}
                                className={`pb-2 text-xs font-bold transition-colors border-b-2 ${
                                    activeTab === 'connections'
                                        ? 'border-amber-500 text-amber-500'
                                        : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                }`}
                            >
                                My Circle ({profiles.filter(p => p.isFollowing).length})
                            </button>
                        </div>

                        {/* Category Pills */}
                        <div className="flex gap-2 px-4 py-1 overflow-x-auto no-scrollbar mb-2">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                        activeFilter === filter
                                            ? 'bg-amber-500 text-black font-bold shadow-sm'
                                            : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-white/5'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Pillar 1: TALENT CONTENT */}
                {pillar === 'talent' && (
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Loading cinema talent...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                            <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                            <p className="text-sm text-red-500">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 px-4 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="py-16 px-4">
                            <EmptyState
                                message={activeTab === 'connections' ? "No connections in your circle" : "No filmmakers found"}
                                subMessage={activeTab === 'connections' ? "Discover and follow creators to build your filmmaking circle!" : "Try adjusting your search query or role filter"}
                                icon={activeTab === 'connections' ? "group_off" : "person_search"}
                                actionLabel={activeTab === 'connections' ? "Browse All" : "Clear Filters"}
                                onAction={activeTab === 'connections' ? () => setActiveTab('discover') : () => { setSearchQuery(''); setActiveFilter('All'); }}
                            />
                        </div>
                    ) : (
                        <div className={`px-4 pt-1 ${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4' : 'flex flex-col divide-y divide-black/[0.04] dark:divide-white/[0.06]'}`}>
                            {filteredProfiles.map((profile) => (
                                viewMode === 'grid' ? (
                                    <div
                                        key={profile.uid}
                                        onClick={() => handleProfileClick(profile)}
                                        className="rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] p-3 shadow-sm hover:border-amber-500/25 transition-all group cursor-pointer flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-black mb-2.5">
                                                <PostMedia
                                                    src={profile.photoURL || ''}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShortlistModalData(profile);
                                                        }}
                                                        className="size-7 rounded-full bg-black/60 backdrop-blur-sm text-white hover:text-amber-500 flex items-center justify-center transition-transform hover:scale-110"
                                                        title="Add to Project"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">playlist_add</span>
                                                    </button>
                                                    {currentUser?.uid !== profile.uid && (
                                                        <button
                                                            onClick={(e) => handleToggleFollow(e, profile)}
                                                            className={`size-7 rounded-full backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 ${
                                                                profile.isFollowing
                                                                    ? 'bg-amber-500 text-black'
                                                                    : 'bg-black/60 text-white hover:text-amber-500'
                                                            }`}
                                                            title={profile.isFollowing ? "Following" : "Follow"}
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                {profile.isFollowing ? 'check' : 'person_add'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col text-left">
                                                <h3 className="text-zinc-900 dark:text-white text-sm font-bold truncate flex items-center gap-1 group-hover:text-amber-500 transition-colors">
                                                    {profile.displayName || 'Filmmaker'}
                                                    {renderVerificationBadge(profile.verification_tier)}
                                                </h3>
                                                <div className="mt-1 mb-1.5">
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 inline-block truncate max-w-full">
                                                        {profile.role || 'Professional'}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-500 dark:text-zinc-400 text-xs truncate flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                    {profile.location || 'Location set'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-2.5 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                                            <span className="text-xs text-zinc-400">
                                                {profile.experience?.length ? `${profile.experience.length} Projects` : 'Available'}
                                            </span>
                                            <span className="text-xs font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform flex items-center">
                                                View <span className="material-symbols-outlined text-xs">chevron_right</span>
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        key={profile.uid}
                                        onClick={() => handleProfileClick(profile)}
                                        className="flex gap-3.5 py-3 items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 px-2 rounded-xl transition-colors"
                                    >
                                        <div className="size-12 rounded-full overflow-hidden shrink-0 bg-black border border-black/5 dark:border-white/10">
                                            <PostMedia src={profile.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1">
                                                    {profile.displayName || 'Filmmaker'}
                                                    {renderVerificationBadge(profile.verification_tier)}
                                                </h3>
                                                {profile.isFollowing && (
                                                    <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                                                        Following
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-amber-500 capitalize mt-0.5">
                                                {profile.role || 'Film Professional'}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                {profile.location || 'Location set'} {profile.experience?.length ? `• ${profile.experience.length} Credits` : ''}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-zinc-400 text-lg">chevron_right</span>
                                    </div>
                                )
                            ))}
                        </div>
                    )
                )}

                {/* Pillar 2: FILM GUILDS CONTENT */}
                {pillar === 'guilds' && (
                    guildsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Loading film guilds...</p>
                        </div>
                    ) : filteredGuilds.length === 0 ? (
                        <div className="py-16 px-4">
                            <EmptyState
                                message="No guilds found"
                                subMessage="Try searching with a different keyword like Directing, Camera, or Acting"
                                icon="groups"
                                actionLabel="Clear Search"
                                onAction={() => setSearchQuery('')}
                            />
                        </div>
                    ) : (
                        <div className="px-4 pt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {filteredGuilds.map((guild) => (
                                <div
                                    key={guild.id}
                                    onClick={() => navigate('/guilds')}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] p-4 shadow-sm hover:border-amber-500/25 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="size-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                                                <span className="material-symbols-outlined text-2xl">
                                                    {guild.icon || 'groups'}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-black/5 dark:border-white/5">
                                                {guild.category}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                            {guild.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                                            {guild.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm text-amber-500">group</span>
                                            {guild.memberCount || 120} Members
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/guilds');
                                            }}
                                            className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-xs font-bold transition-all"
                                        >
                                            Enter Guild
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Pillar 3: STUDIOS & GEAR CONTENT */}
                {pillar === 'studios' && (
                    facilitiesLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Loading studios & equipment...</p>
                        </div>
                    ) : filteredFacilities.length === 0 ? (
                        <div className="py-16 px-4">
                            <EmptyState
                                message="No studios or facilities found"
                                subMessage="Try searching for Sound Stages, Camera Rentals, or Post-Production"
                                icon="videocam"
                                actionLabel="Clear Search"
                                onAction={() => setSearchQuery('')}
                            />
                        </div>
                    ) : (
                        <div className="px-4 pt-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {filteredFacilities.map((facility) => (
                                <div
                                    key={facility.id}
                                    onClick={() => navigate(`/booking/details/${facility.id}`)}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.06] p-3.5 shadow-sm hover:border-amber-500/25 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-3">
                                            <PostMedia
                                                src={facility.image || ''}
                                                fallbackType="COMPANY_LOGO"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-xs font-semibold text-amber-500 border border-amber-500/20">
                                                {facility.type}
                                            </span>
                                            {facility.price && (
                                                <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-amber-500 text-black text-xs font-black shadow-md">
                                                    {facility.price}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                            {facility.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            {facility.location}
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-400">
                                            <span className="material-symbols-outlined text-amber-500 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-zinc-900 dark:text-white">{facility.rating || 4.9}</span>
                                            <span className="text-zinc-500">({facility.reviews || 40})</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/booking/details/${facility.id}`);
                                            }}
                                            className="px-3 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-amber-500 hover:text-black text-zinc-900 dark:text-white text-xs font-bold transition-all"
                                        >
                                            Inquire
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Bottom Navigation */}
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
                        // Optional: show toast
                    }}
                />
            )}
            {/* Map Discovery View */}
            {showMap && (
                <MapDiscovery
                    profiles={filteredProfiles}
                    onClose={() => setShowMap(false)}
                />
            )}

            {/* Filter Modal */}
            {showFilterModal && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setShowFilterModal(false)}
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Filter Profiles</h3>
                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">close</span>
                            </button>
                        </div>

                        {/* Filter Content */}
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {/* Role Filters */}
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wider">Filter by Role</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {filters.map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                setActiveFilter(filter);
                                                setShowFilterModal(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-xl transition-all ${activeFilter === filter
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            <span className="text-sm font-bold">{filter}</span>
                                            {activeFilter === filter && (
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <button
                                    onClick={() => {
                                        setActiveFilter('All');
                                        setSearchQuery('');
                                        setShowFilterModal(false);
                                    }}
                                    className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
