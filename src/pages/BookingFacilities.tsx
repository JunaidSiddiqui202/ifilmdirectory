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
        { id: 'All', label: 'All', icon: 'grid_view' },
        { id: 'Studio', label: 'Shooting Floors', icon: 'photo_camera' },
        { id: 'Dubbing', label: 'Dubbing Suites', icon: 'mic' },
        { id: 'Post-Production', label: 'Editing & VFX', icon: 'movie_edit' },
        { id: 'Equipment', label: 'Gear & Camera', icon: 'videocam' },
        { id: 'Location', label: 'Film Locations', icon: 'location_on' },
    ];

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoading(true);
            try {
                // Fetch all for now, client-side filter is fine for small lists
                const data = await facilityService.getFacilities();
                setFacilities(data);
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
            (activeCategory === 'Studio' && (typeLower.includes('floor') || typeLower.includes('stage'))) ||
            (activeCategory === 'Post-Production' && (typeLower.includes('vfx') || typeLower.includes('edit') || typeLower.includes('di')));

        const matchesSearch =
            (facility.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (facility.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            typeLower.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });


    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden pb-36 md:pb-24 font-display transition-colors">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto flex flex-col flex-1">
                {/* Cinema Header */}
                <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090A0C]/85 p-4 pb-3 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="md:hidden flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <HamburgerMenu />
                            <Logo size="sm" showText={true} />
                            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Facilities
                            </span>
                        </div>
                        <h1 className="hidden md:flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                            <span className="material-symbols-outlined text-amber-500 text-xl">apartment</span>
                            <span>Film Studios & Production Facilities</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowMap(true)}
                            className="flex items-center justify-center rounded-xl size-9 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20 transition-all"
                            title="Interactive Map"
                        >
                            <span className="material-symbols-outlined text-xl">map</span>
                        </button>
                    </div>
                </header>

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
                            placeholder="Search sound stages, camera gear, editing suites..."
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

                {/* Unified Category Filter Bar with Icons */}
                <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition-all border ${
                                    isActive
                                        ? 'bg-amber-500 text-black border-amber-500 shadow-sm shadow-amber-500/25'
                                        : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-white/10'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[17px] ${isActive ? 'text-black' : 'text-amber-500'}`}>
                                    {cat.icon}
                                </span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Popular Facilities Header */}
                <h2 className="text-zinc-900 dark:text-white text-base sm:text-lg font-bold leading-tight tracking-tight px-4 pb-3 pt-2">
                    Popular Facilities & Spaces
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                    {loading ? (
                        <div className="flex justify-center py-16 md:col-span-2">
                            <div className="size-9 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : filteredFacilities.length > 0 ? (
                        filteredFacilities.map((facility) => (
                            <div
                                key={facility.id}
                                onClick={() => navigate(`/booking/details/${facility.id}`)}
                                className="rounded-2xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] overflow-hidden p-3.5 shadow-sm hover:border-amber-500/25 transition-all group cursor-pointer flex flex-col justify-between"
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
                                        <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 text-xs">
                                            <span className="material-symbols-outlined text-amber-500 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="text-white text-xs font-bold">{facility.rating || 4.9}</span>
                                        </div>
                                        {facility.price && (
                                            <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-amber-500 text-black text-xs font-black shadow-md">
                                                {facility.price}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                                        {facility.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        {facility.location}
                                    </p>
                                </div>

                                <div className="pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] mt-3 flex items-center justify-between">
                                    <span className="text-xs text-zinc-400">
                                        Direct Booking
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/booking/details/${facility.id}`);
                                        }}
                                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                                    >
                                        <span>View Details</span>
                                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 md:col-span-2">
                            <span className="material-symbols-outlined text-5xl mb-3 text-zinc-500">
                                location_off
                            </span>
                            <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm">
                                No facilities found
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Map Discovery */}
            {showMap && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in"
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
