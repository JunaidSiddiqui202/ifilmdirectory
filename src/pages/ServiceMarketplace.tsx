import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilityService, type Facility } from '../services/facilityService';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import Logo from '../components/Logo';
import PostMedia from '../components/PostMedia';
import SEO from '../components/SEO';
import { useTheme } from '../context/ThemeContext';

interface CategoryOption {
    id: string;
    label: string;
    icon: string;
}

export default function ServiceMarketplace() {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('All');

    const categories: CategoryOption[] = [
        { id: 'All', label: 'All Services', icon: 'grid_view' },
        { id: 'Studio', label: 'Studios & Floors', icon: 'photo_camera' },
        { id: 'Equipment', label: 'Camera & Lighting', icon: 'videocam' },
        { id: 'Post-Production', label: 'Dubbing & VFX', icon: 'movie_edit' },
        { id: 'Vanity Van', label: 'Vanity & Caravans', icon: 'directions_bus' },
        { id: 'Location', label: 'Sets & Heritage Locations', icon: 'location_on' },
    ];

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoading(true);
            try {
                // Fetch all and let client handle fast multi-dimensional search + filter
                const data = await facilityService.getFacilities();
                setFacilities(data || []);
            } catch (err) {
                console.error('Failed to load services', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFacilities();
    }, []);

    // Filter facilities based on category, search, and city/location
    const filteredFacilities = facilities.filter((service) => {
        const typeLower = (service.type || '').toLowerCase();
        const matchesCategory =
            activeCategory === 'All' ||
            typeLower === activeCategory.toLowerCase() ||
            (activeCategory === 'Studio' && (typeLower.includes('studio') || typeLower.includes('floor') || typeLower.includes('sound stage'))) ||
            (activeCategory === 'Equipment' && (typeLower.includes('equipment') || typeLower.includes('camera') || typeLower.includes('lens') || typeLower.includes('lighting'))) ||
            (activeCategory === 'Post-Production' && (typeLower.includes('post') || typeLower.includes('dubbing') || typeLower.includes('vfx') || typeLower.includes('sound') || typeLower.includes('edit'))) ||
            (activeCategory === 'Vanity Van' && (typeLower.includes('van') || typeLower.includes('caravan') || typeLower.includes('makeup'))) ||
            (activeCategory === 'Location' && (typeLower.includes('location') || typeLower.includes('set') || typeLower.includes('palace') || typeLower.includes('haveli')));

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            (service.name || '').toLowerCase().includes(q) ||
            (service.location || '').toLowerCase().includes(q) ||
            (service.description || '').toLowerCase().includes(q) ||
            typeLower.includes(q) ||
            (service.amenities || []).some(a => a.toLowerCase().includes(q));

        const matchesLocation =
            selectedLocation === 'All' ||
            (service.location || '').toLowerCase().includes(selectedLocation.toLowerCase());

        return matchesCategory && matchesSearch && matchesLocation;
    });

    const locations = ['All', 'Hyderabad', 'Mumbai', 'Chennai', 'Bengaluru'];

    return (
        <div className="relative min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white overflow-x-hidden font-display selection:bg-amber-500/30 transition-colors">
            <SEO
                title="Service Marketplace | Cinema Equipment, Studios & Production Services"
                description="Film production service marketplace: book verified cinema sound stages, camera packages, vanity vans, dubbing suites, and film shoot locations."
                keywords={[
                    'film equipment rental',
                    'cinema camera rental',
                    'service marketplace',
                    'arri alexa rental',
                    'red camera package',
                    'film lighting rental',
                    'vanity van rental',
                    'film production services',
                    'shooting floor booking'
                ]}
            />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="md:hidden flex items-center gap-2.5">
                        <HamburgerMenu />
                        <div className="cursor-pointer select-none" onClick={() => navigate('/home')}>
                            <Logo size="sm" showText={true} />
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                            <span className="material-symbols-outlined text-xl">handshake</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                                <span>Service Marketplace</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold">
                                    {facilities.length} Verified Services
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Book vetted shooting floors, camera packages, vanity vans, and production facilities
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleDarkMode}
                        aria-label="Toggle Theme"
                        className="size-9 rounded-xl bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors"
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isDarkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                    <button
                        onClick={() => navigate('/booking/facilities')}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-all"
                    >
                        <span className="material-symbols-outlined text-base text-amber-500">domain</span>
                        <span>Facilities View</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 px-4 md:px-8 py-6 pb-28">
                {/* Mobile Page Heading */}
                <div className="md:hidden mb-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                            <span>Service Marketplace</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                                {facilities.length} Verified
                            </span>
                        </h1>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Rent cinema equipment, booking sound floors & production crews
                    </p>
                </div>

                {/* Search & Location Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xl pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search camera gear, studios, lighting packages, sound stages, cities..."
                            className="w-full bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/20 focus:border-amber-500 rounded-2xl pl-12 pr-10 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                title="Clear search"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        )}
                    </div>

                    {/* Quick City Dropdown / Pill */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 sm:py-0">
                        {locations.map((loc) => {
                            const isSelected = selectedLocation === loc;
                            return (
                                <button
                                    key={loc}
                                    onClick={() => setSelectedLocation(loc)}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${isSelected
                                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 font-bold shadow-sm'
                                        : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300'
                                        }`}
                                >
                                    {loc === 'All' ? 'All Cities' : loc}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-none mb-4">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition-all border ${isActive
                                    ? 'bg-amber-500 text-zinc-950 font-black border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                                    : 'bg-white dark:bg-[#121316] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-base ${isActive ? 'text-zinc-950' : 'text-amber-500 dark:text-amber-400'}`}>
                                    {cat.icon}
                                </span>
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Marketplace Services Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="size-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <p className="mt-3 text-xs font-bold text-zinc-400 uppercase tracking-wide">
                                Loading Verified Film Services...
                            </p>
                        </div>
                    ) : filteredFacilities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredFacilities.map((service) => (
                                <div
                                    key={service.id}
                                    onClick={() => navigate(`/booking/details/${service.id}`)}
                                    className="rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 overflow-hidden p-3.5 shadow-sm hover:shadow-lg dark:shadow-xl transition-all group cursor-pointer flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Image Container */}
                                        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-black mb-3 border border-zinc-200/50 dark:border-white/5">
                                            <PostMedia
                                                src={service.image || ''}
                                                fallbackType="FILM_SET"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                            {/* Type Pill */}
                                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-amber-400 border border-amber-500/25">
                                                {service.type}
                                            </span>

                                            {/* Rating Pill */}
                                            <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-xs">
                                                <span className="material-symbols-outlined text-amber-400 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                <span className="text-white font-bold">{service.rating || '4.9'}</span>
                                            </div>

                                            {/* Availability Badge */}
                                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Ready to Book
                                            </span>
                                        </div>

                                        {/* Title & Location */}
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                                            {service.name}
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                                            <span className="material-symbols-outlined text-xs text-amber-500">location_on</span>
                                            <span>{service.location || 'Mumbai / Hyderabad'}</span>
                                        </p>

                                        {/* Description */}
                                        {service.description && (
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                                                {service.description}
                                            </p>
                                        )}

                                        {/* Specs / Amenities Badges */}
                                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                                            {(service.amenities && service.amenities.length > 0
                                                ? service.amenities.slice(0, 2)
                                                : ['Cinema Ready', 'Studio Certified']
                                            ).map((amenity, i) => (
                                                <span
                                                    key={i}
                                                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.06] flex items-center gap-1 truncate max-w-[140px]"
                                                >
                                                    <span className="material-symbols-outlined text-[10px] text-amber-500 dark:text-amber-400">check_circle</span>
                                                    <span className="truncate">{amenity}</span>
                                                </span>
                                            ))}
                                            {(service.amenities && service.amenities.length > 2) && (
                                                <span className="text-[10px] text-zinc-400 font-bold px-1">
                                                    +{service.amenities.length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar Footer */}
                                    <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.06] mt-4 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                            <span className="material-symbols-outlined text-sm text-blue-500 filled" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                            <span>Verified</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/booking/details/${service.id}`);
                                            }}
                                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-amber-500/20"
                                        >
                                            <span>Book Service</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.06] shadow-sm">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-3xl text-amber-500 dark:text-amber-400">storefront</span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                                No Services Found
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
                                {searchQuery
                                    ? `No services matched "${searchQuery}". Try searching for cameras, studios, or lighting.`
                                    : 'No services found under this category. Reset filters to see all available services.'}
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('All');
                                    setSelectedLocation('All');
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
