import React, { useState, useEffect } from 'react';
import { searchFilmImages, type FilmImageResult } from '../services/filmImageService';

interface FilmPhotoSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
    onSelectImage: (image: FilmImageResult, action: 'cover' | 'block' | 'replace') => void;
    mode?: 'cover' | 'block' | 'replace';
    defaultAction?: 'cover' | 'block' | 'replace';
    targetBlockId?: string | null;
}

const TRENDING_FILMS = [
    'Baahubali',
    'Jailer 2',
    'Kalki 2898 AD',
    'RRR',
    'Pushpa 2',
    'Salaar',
    'Devara',
    'KGF',
    'Leo',
    'Vikram',
    'Kantara',
    'Oppenheimer',
    'Interstellar'
];

export default function FilmPhotoSearchModal({
    isOpen,
    onClose,
    initialQuery = '',
    onSelectImage,
    mode,
    defaultAction = 'block',
    targetBlockId
}: FilmPhotoSearchModalProps) {
    const activeMode = mode || defaultAction;
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [results, setResults] = useState<FilmImageResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<FilmImageResult | null>(null);
    const [customCourtesy, setCustomCourtesy] = useState('');

    useEffect(() => {
        if (isOpen) {
            const queryToRun = initialQuery || 'Baahubali';
            setSearchQuery(queryToRun);
            performSearch(queryToRun);
        }
    }, [isOpen, initialQuery]);

    const performSearch = async (queryText: string) => {
        setIsLoading(true);
        try {
            const data = await searchFilmImages(queryText);
            setResults(data);
            if (data.length > 0) {
                setSelectedImage(data[0]);
                setCustomCourtesy(data[0].courtesy);
            }
        } catch (err) {
            console.error('Failed to search film images:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            performSearch(searchQuery.trim());
        }
    };

    const handleApply = (action: 'cover' | 'block' | 'replace') => {
        if (!selectedImage) return;
        const finalImage: FilmImageResult = {
            ...selectedImage,
            courtesy: customCourtesy.trim() || selectedImage.courtesy
        };
        onSelectImage(finalImage, action);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#18191d] rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-zinc-200/80 dark:border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">movie_filter</span>
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                Cinema Picture & Still Search
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    With Photo Courtesy
                                </span>
                            </h3>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Search real movie stills, posters & promotional shots for films mentioned in your writing
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Close"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Search Bar & Chips */}
                <div className="p-4 sm:p-5 bg-zinc-50/60 dark:bg-[#141518]/60 border-b border-zinc-200/80 dark:border-white/10 shrink-0 space-y-3">
                    <form onSubmit={handleFormSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Type film name (e.g. 'Baahubali', 'Jailer 2', 'RRR', 'Kalki 2898 AD', 'Pushpa 2')..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">search</span>
                                    <span>Find Pictures</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Film Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
                            Popular:
                        </span>
                        {TRENDING_FILMS.map(film => (
                            <button
                                key={film}
                                type="button"
                                onClick={() => {
                                    setSearchQuery(film);
                                    performSearch(film);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                    searchQuery.toLowerCase() === film.toLowerCase()
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : 'bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/10'
                                }`}
                            >
                                {film}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area: Grid on Left, Preview & Custom Courtesy on Right */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[300px]">
                    {/* Results Grid (8 cols on lg) */}
                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                                {results.length} film picture{results.length === 1 ? '' : 's'} found
                            </span>
                            <span className="text-[10px] text-zinc-400">
                                Click any still to preview & insert
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-2">
                                <div className="size-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                <p className="text-xs text-zinc-400">Searching film archives & Wikimedia...</p>
                            </div>
                        ) : results.length === 0 ? (
                            <div className="text-center py-16 text-zinc-400 space-y-2">
                                <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600">
                                    movie
                                </span>
                                <p className="text-xs">No film pictures found. Try another movie title.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {results.map((item) => {
                                    const isSelected = selectedImage?.id === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedImage(item);
                                                setCustomCourtesy(item.courtesy);
                                            }}
                                            className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all bg-zinc-100 dark:bg-zinc-800 ${
                                                isSelected
                                                    ? 'border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]'
                                                    : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            <div className="aspect-[3/4] relative overflow-hidden bg-black/40">
                                                <img
                                                    src={item.thumbnailUrl || item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                                <div className="absolute bottom-1.5 inset-x-1.5">
                                                    <p className="text-[11px] font-bold text-white line-clamp-1 leading-tight">
                                                        {item.title}
                                                    </p>
                                                    <p className="text-[9px] text-zinc-300/80 italic line-clamp-1">
                                                        {item.courtesy}
                                                    </p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 size-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-md">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Selected Image Detail & Insertion Options (5 cols on lg) */}
                    <div className="lg:col-span-5 bg-zinc-50 dark:bg-[#141518] rounded-2xl border border-zinc-200 dark:border-white/10 p-4 flex flex-col justify-between space-y-4">
                        {selectedImage ? (
                            <>
                                <div className="space-y-3">
                                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black/60 border border-zinc-200 dark:border-white/10">
                                        <img
                                            src={selectedImage.imageUrl}
                                            alt={selectedImage.title}
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-amber-400 border border-amber-400/20">
                                                {selectedImage.filmTitle}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white leading-tight">
                                            {selectedImage.title}
                                        </h4>
                                        {selectedImage.description && (
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                                {selectedImage.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* PHOTO COURTESY FIELD (Very small font requirement) */}
                                    <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-white/10">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">attribution</span>
                                            Photo Courtesy (Rendered in very small font)
                                        </label>
                                        <input
                                            type="text"
                                            value={customCourtesy}
                                            onChange={(e) => setCustomCourtesy(e.target.value)}
                                            placeholder="e.g. Photo courtesy: Arka Media Works / Sun Pictures"
                                            className="w-full px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                                        />
                                        <p className="text-[9px] text-zinc-400 italic">
                                            Preview: <span className="font-medium text-zinc-500 dark:text-zinc-400">“{customCourtesy || 'Photo courtesy: Production Stills'}”</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Insertion Action Buttons */}
                                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-white/10">
                                    {targetBlockId ? (
                                        <button
                                            type="button"
                                            onClick={() => handleApply('replace')}
                                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">autorenew</span>
                                            Replace Selected Image Block
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleApply('cover')}
                                                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                    activeMode === 'cover'
                                                        ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white'
                                                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">featured_video</span>
                                                Set as Cover Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleApply('block')}
                                                className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                                    activeMode === 'cover'
                                                        ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200'
                                                        : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                                                Insert into Article Body
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-10">
                                <span className="material-symbols-outlined text-3xl mb-1">touch_app</span>
                                <p className="text-xs">Select any picture from the left to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
