import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PostMedia from './PostMedia';

interface MapDiscoveryProps {
    profiles: any[];
    onClose: () => void;
}

export default function MapDiscovery({ profiles, onClose }: MapDiscoveryProps) {
    const navigate = useNavigate();
    const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
    const [mapRegion, setMapRegion] = useState('Global');

    // Simulate random coordinates for demo purposes if not present
    const mapMarkers = useMemo(() => {
        return profiles.map((p) => ({
            ...p,
            lat: p.lat || (20 + Math.random() * 10),
            lng: p.lng || (70 + Math.random() * 15)
        }));
    }, [profiles]);

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-100 dark:bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-500">
            {/* Map Header */}
            <header className="absolute top-4 left-4 right-4 z-[110] flex items-center gap-3 pointer-events-none">
                <button
                    onClick={onClose}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-white/5 pointer-events-auto flex items-center gap-2 shrink-0 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">close</span>
                    <span className="text-[10px] font-black uppercase tracking-widest pr-1 hidden sm:block">Close Map</span>
                </button>

                <div className="flex-1 flex gap-2 pointer-events-auto overflow-x-auto no-scrollbar touch-pan-x py-1">
                    {['Global', 'Mumbai', 'London', 'LA'].map(reg => (
                        <button
                            key={reg}
                            onClick={() => setMapRegion(reg)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 ${mapRegion === reg
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105'
                                : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-zinc-500 border-zinc-200 dark:border-white/5'
                                }`}
                        >
                            {reg}
                        </button>
                    ))}
                </div>
            </header>

            {/* The "Map" Surface (Abstract Design) */}
            <div
                className="flex-1 relative overflow-hidden bg-zinc-200 dark:bg-zinc-900 cursor-crosshair"
                onClick={() => setSelectedProfile(null)}
            >
                {/* SVG Mock Map Grid */}
                <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000">
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Markers */}
                {mapMarkers.map((marker) => (
                    <button
                        key={marker.uid}
                        onClick={(e) => { e.stopPropagation(); setSelectedProfile(marker); }}
                        style={{
                            left: `${(marker.lng - 60) * 5}%`,
                            top: `${(40 - marker.lat) * 5}%`
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    >
                        <div className={`relative transition-all duration-300 ${selectedProfile?.uid === marker.uid ? 'scale-125 z-50' : 'hover:scale-110'}`}>
                            <div className={`size-10 rounded-2xl border-2 flex items-center justify-center overflow-hidden shadow-xl transition-colors ${selectedProfile?.uid === marker.uid ? 'bg-primary border-primary' : 'bg-white dark:bg-zinc-800 border-white dark:border-zinc-700'
                                }`}>
                                <PostMedia
                                    src={marker.photoURL || ''}
                                    fallbackType="USER_MALE"
                                    className="size-full"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 size-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900" />
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 px-3 py-1 rounded-lg shadow-lg border border-zinc-100 dark:border-white/5 whitespace-nowrap pointer-events-none">
                            <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{marker.displayName}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Bottom Card for Selected Profile */}
            {selectedProfile && (
                <div className="absolute bottom-8 left-4 right-4 z-[120] bg-white dark:bg-zinc-900 rounded-[32px] p-5 shadow-2xl border border-zinc-100 dark:border-white/5 flex gap-4 animate-in slide-in-from-bottom duration-300">
                    <div className="size-20 rounded-[24px] overflow-hidden shadow-lg shrink-0">
                        <PostMedia
                            src={selectedProfile.photoURL || ''}
                            fallbackType="USER_MALE"
                            className="w-full h-full"
                        />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate">{selectedProfile.displayName}</h3>
                            <button onClick={() => setSelectedProfile(null)} className="text-zinc-400">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest mt-0.5">{selectedProfile.role || 'Industry Pro'}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <button
                                onClick={() => navigate(`/profile/${selectedProfile.uid}`)}
                                className="flex-1 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-all"
                            >
                                View Portfolio
                            </button>
                            <button
                                onClick={() => navigate(`/chat/${selectedProfile.uid}`)}
                                className="h-10 px-4 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">mail</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
