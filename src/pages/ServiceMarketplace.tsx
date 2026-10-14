import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { facilityService, type Facility } from '../services/facilityService';
import BottomNav from '../components/BottomNav';
import HamburgerMenu from '../components/HamburgerMenu';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';

export default function ServiceMarketplace() {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Studio', 'Equipment', 'Post-Production', 'Vanity Van', 'Location'];

    useEffect(() => {
        const fetchFacilities = async () => {
            setLoading(true);
            const data = await facilityService.getFacilities(activeCategory);
            setFacilities(data);
            setLoading(false);
        };
        fetchFacilities();
    }, [activeCategory]);

    return (
        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-md md:max-w-3xl lg:max-w-4xl flex-col bg-[#F8F9FA] dark:bg-zinc-950 pb-24">
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 px-6 pt-5 pb-4 backdrop-blur-3xl border-b border-black/[0.02] dark:border-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <HamburgerMenu />
                    <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">Marketplace</h1>
                </div>
                <button className="size-10 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-500">search</span>
                </button>
            </header>

            {/* Category Pills */}
            <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                            : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <main className="flex-1 p-4 grid grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 flex justify-center py-20">
                        <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : facilities.length > 0 ? (
                    facilities.map((service) => (
                        <div
                            key={service.id}
                            className="bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden border border-zinc-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                        >
                            <div
                                onClick={() => navigate(`/booking/details/${service.id}`)}
                                className="relative aspect-[4/5] overflow-hidden"
                            >
                                <PostMedia
                                    src={service.image || ''}
                                    fallbackType="FILM_SET"
                                    className="size-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest">
                                        {service.type}
                                    </span>
                                </div>
                                <div className="absolute bottom-3 right-3">
                                    <button className="size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-12 group-hover:translate-y-0 transition-transform">
                                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                                    </button>
                                </div>
                            </div>
                            <div
                                onClick={() => navigate(`/booking/details/${service.id}`)}
                                className="p-3"
                            >
                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{service.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5 mb-3">
                                    <span className="material-symbols-outlined text-[10px] text-yellow-500 filled">star</span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase">{service.rating || '4.8'} • {service.location || 'Mumbai'}</span>
                                    {service.owner_verification === 'gold' && (
                                        <span className="material-symbols-outlined text-xs text-blue-500 ml-auto">verified</span>
                                    )}
                                </div>
                            </div>

                            {/* Facility Details Section - Now directly below price */}
                            <div className="px-3 pb-3 pt-0 border-t border-zinc-100 dark:border-zinc-800">
                                {service.description && (
                                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">
                                        {service.description}
                                    </p>
                                )}
                                {service.amenities && service.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {service.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[8px] font-bold text-zinc-600 dark:text-zinc-400"
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {!service.description && !service.amenities && (
                                    <p className="text-[9px] text-zinc-400 italic">
                                        Professional {service.type?.toLowerCase()} facility
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2">
                        <EmptyState
                            message="No Services Found"
                            subMessage="Try adjusting your filters to find equipment, studios, and more."
                            icon="storefront"
                        />
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
