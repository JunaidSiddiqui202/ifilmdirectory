import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import PostMedia from '../components/PostMedia';
import { useNavigate } from 'react-router-dom';
import { facilityService, type Facility } from '../services/facilityService';
import MapDiscovery from '../components/MapDiscovery';

export default function BookingFacilities() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    const categories = [
        { id: 'All', label: 'All Spaces', icon: 'grid_view' },
        { id: 'Studio', label: 'Shooting Floors', icon: 'photo_camera' },
        { id: 'Dubbing', label: 'Dubbing & Dolby Atmos', icon: 'mic' },
        { id: 'Post-Production', label: 'Editing & VFX Suites', icon: 'movie_edit' },
        { id: 'Equipment', label: 'Camera & Cine Lighting', icon: 'videocam' },
        { id: 'Location', label: 'Film Sets & Estates', icon: 'location_on' },
    ];

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoading(true);
            try {
                const data = await facilityService.getFacilities();
                setFacilities(data || []);
            } catch (error) {
                console.error("Failed to load facilities", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    const filteredFacilities = facilities.filter((facility) => {
        const typeLower = (facility.type || '').toLowerCase();
        const matchesCategory =
            activeCategory === 'All' ||
            typeLower.includes(activeCategory.toLowerCase()) ||
            (activeCategory === 'Studio' && (typeLower.includes('floor') || typeLower.includes('stage') || typeLower.includes('studio'))) ||
            (activeCategory === 'Dubbing' && (typeLower.includes('sound') || typeLower.includes('dub') || typeLower.includes('audio') || typeLower.includes('mic'))) ||
            (activeCategory === 'Post-Production' && (typeLower.includes('vfx') || typeLower.includes('edit') || typeLower.includes('di') || typeLower.includes('color'))) ||
            (activeCategory === 'Equipment' && (typeLower.includes('gear') || typeLower.includes('camera') || typeLower.includes('lens') || typeLower.includes('light'))) ||
            (activeCategory === 'Location' && (typeLower.includes('location') || typeLower.includes('resort') || typeLower.includes('palace') || typeLower.includes('bungalow')));

        const matchesSearch =
            (facility.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (facility.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            typeLower.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden font-display selection:bg-amber-500/30 transition-colors">
            {/* Top Navigation */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                        <HamburgerMenu />
                        <Logo size="sm" showText={true} />
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                            <span className="material-symbols-outlined text-xl">apartment</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Film Studios & Production Facilities</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                    {facilities.length} Verified
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Pre-book sound stages, post suites, cine gear houses, and shoot sets across India
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => setShowMap(true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-base">map</span>
                        <span className="hidden sm:inline">Interactive Map</span>
                    </button>
                </div>
            </header>

            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 pb-28">
                {/* Hero Spotlight Header on Mobile / Tablet */}
                <div className="md:hidden mb-4">
                    <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>Film Studios & Gear</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                            {facilities.length}
                        </span>
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Sound stages, editing bays, and cine equipment
                    </p>
                </div>

                {/* Search Bar & Controls */}
                <div className="relative mb-5">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl pointer-events-none">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sound stages, camera gear, editing suites, lighting trucks, cities..."
                        className="w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 focus:border-amber-500 rounded-2xl pl-12 pr-10 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-sm dark:shadow-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-none mb-4">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all border ${
                                    isActive
                                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md shadow-amber-500/20'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-base ${isActive ? 'text-black' : 'text-amber-500 dark:text-amber-400'}`}>
                                    {cat.icon}
                                </span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Facilities Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                Loading Verified Film Facilities...
                            </p>
                        </div>
                    ) : filteredFacilities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredFacilities.map((facility) => (
                                <div
                                    key={facility.id}
                                    onClick={() => navigate(`/booking/details/${facility.id}`)}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 overflow-hidden p-4 shadow-sm hover:shadow-md dark:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Image Box */}
                                        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-black mb-3.5 border border-zinc-200/50 dark:border-white/5">
                                            <PostMedia
                                                src={facility.image || ''}
                                                fallbackType="COMPANY_LOGO"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                            {/* Type Pill */}
                                            <span className="absolute top-2.5 left-2.5 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-500/25">
                                                {facility.type}
                                            </span>

                                            {/* Rating */}
                                            <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-xs">
                                                <span className="material-symbols-outlined text-amber-400 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                <span className="text-white font-bold">{facility.rating || 4.9}</span>
                                            </div>

                                            {/* Price Tag */}
                                            {facility.price && (
                                                <span className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-black shadow-lg">
                                                    {facility.price}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                            {facility.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                                            <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                            {facility.location || 'Pan-India Production Hub'}
                                        </p>

                                        {/* Specs tags if available */}
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[11px] text-amber-500 dark:text-amber-400">verified</span>
                                                Cine Certified
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06]">
                                                Direct Inquiries
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.06] mt-4 flex items-center justify-between gap-2">
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                                            5MC Verified Facility
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/booking/details/${facility.id}`);
                                            }}
                                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                                        >
                                            <span>View Details</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-amber-500 dark:text-amber-400">location_off</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No facilities found matching "{searchQuery}"
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
                                Try adjusting your search query or switching to 'All Spaces' to explore all verified studios.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition-all"
                            >
                                Reset Search Filters
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Map Discovery Modal */}
            {showMap && (
                <div
                    className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md animate-in fade-in"
                    onClick={() => setShowMap(false)}
                >
                    <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
                        <MapDiscovery
                            profiles={facilities.map(f => ({
                                ...f,
                                uid: f.id,
                                displayName: f.name,
                                photoURL: f.image,
                                role: f.type
                            }))}
                            onClose={() => setShowMap(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
