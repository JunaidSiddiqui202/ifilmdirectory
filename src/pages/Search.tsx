import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { jobService, type Job } from '../services/jobService';
import { getAllUsers, type UserProfile } from '../services/userService';
import { blogService, type BlogPost } from '../services/blogService';
import EmptyState from '../components/EmptyState';

type TabType = 'all' | 'jobs' | 'people' | 'blogs' | 'nearme';

export default function Search() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [results, setResults] = useState<{ jobs: Job[], people: UserProfile[], blogs: BlogPost[] }>({ jobs: [], people: [], blogs: [] });
    const [searchMessage, setSearchMessage] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
    const [locationLoading, setLocationLoading] = useState(false);

    const [loading, setLoading] = useState(false);

    // Calculate Levenshtein distance between two strings
    const levenshteinDistance = (str1: string, str2: string): number => {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[len1][len2];
    };

    // Fuzzy match helper - returns true if query matches text with small edit distance
    const fuzzyMatch = (text: string, query: string): boolean => {
        if (!text || !query) return false;

        const textLower = text.toLowerCase();
        const queryLower = query.toLowerCase();

        // Exact substring match
        if (textLower.includes(queryLower)) return true;

        // For very short queries, be strict
        if (queryLower.length < 3) return false;

        // Check if any word in the text fuzzy matches the query
        const words = textLower.split(/\s+/);
        for (const word of words) {
            // Allow edit distance of 1 for words of length 4-6, 2 for longer words
            const maxDistance = word.length <= 6 ? 1 : 2;
            const distance = levenshteinDistance(word, queryLower);

            if (distance <= maxDistance) {
                return true;
            }

            // Also check if query is a substring of the word
            if (word.includes(queryLower)) {
                return true;
            }
        }

        return false;
    };

    useEffect(() => {
        // If URL param changes, update state
        const q = searchParams.get('q');
        if (q !== null) setQuery(q);
    }, [searchParams]);

    // Generate autocomplete suggestions
    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const generateSuggestions = async () => {
            try {
                const lowerQuery = query.toLowerCase();
                const suggestionSet = new Set<string>();

                // Fetch data for suggestions
                const [allUsers, allJobs, allBlogs] = await Promise.all([
                    getAllUsers(),
                    jobService.getJobs(),
                    blogService.getBlogs()
                ]);

                // Add user names
                allUsers.forEach(user => {
                    if (user.displayName && (
                        user.displayName.toLowerCase().includes(lowerQuery) ||
                        fuzzyMatch(user.displayName, query)
                    )) {
                        suggestionSet.add(user.displayName);
                    }
                });

                // Add job titles and companies
                allJobs.forEach(job => {
                    if (job.title.toLowerCase().includes(lowerQuery) || fuzzyMatch(job.title, query)) {
                        suggestionSet.add(job.title);
                    }
                    if (job.company.toLowerCase().includes(lowerQuery) || fuzzyMatch(job.company, query)) {
                        suggestionSet.add(job.company);
                    }
                });

                // Add blog titles
                allBlogs.forEach(blog => {
                    if (blog.title.toLowerCase().includes(lowerQuery) || fuzzyMatch(blog.title, query)) {
                        suggestionSet.add(blog.title);
                    }
                });

                setSuggestions(Array.from(suggestionSet).slice(0, 5));
                setShowSuggestions(true);
            } catch (error) {
                console.error("Error generating suggestions:", error);
            }
        };

        const timer = setTimeout(generateSuggestions, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!query.trim()) {
            setResults({ jobs: [], people: [], blogs: [] });
            setSearchMessage('');
            return;
        }

        setLoading(true);
        setSearchMessage('');

        const performSearch = async () => {
            try {
                const lowerQuery = query.toLowerCase();

                // Fetch all data in parallel
                const [allJobs, allUsers, allBlogs] = await Promise.all([
                    jobService.getJobs(),
                    getAllUsers(),
                    blogService.getBlogs()
                ]);

                // 1. Search Jobs with fuzzy matching
                let filteredJobs = allJobs.filter(job =>
                    job.title.toLowerCase().includes(lowerQuery) ||
                    job.company.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(job.title, query) ||
                    fuzzyMatch(job.company, query)
                );

                let message = '';

                // 2. Broad/Fallback Search for Jobs: If no results, search by Type or Location
                if (filteredJobs.length === 0) {
                    filteredJobs = allJobs.filter(job =>
                        job.location.toLowerCase().includes(lowerQuery) ||
                        job.type.toLowerCase().includes(lowerQuery) ||
                        fuzzyMatch(job.location, query) ||
                        fuzzyMatch(job.type, query)
                    );

                    if (filteredJobs.length > 0) {
                        message = `Found results related to "${query}" via location/type.`;
                    }
                }

                // 3. Search People with fuzzy matching
                const filteredPeople = allUsers.filter(user =>
                    (user.displayName && (user.displayName.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.displayName, query))) ||
                    (user.role && (user.role.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.role, query))) ||
                    (user.location && (user.location.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.location, query))) ||
                    (user.bio && user.bio.toLowerCase().includes(lowerQuery)) ||
                    (user.username && (user.username.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.username, query)))
                );

                // 4. Search Blogs with fuzzy matching
                const filteredBlogs = allBlogs.filter(blog =>
                    blog.title.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(blog.title, query) ||
                    (blog.category && blog.category.toLowerCase().includes(lowerQuery)) ||
                    blog.author.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(blog.author, query) ||
                    (blog.content && blog.content.toLowerCase().includes(lowerQuery))
                );

                setResults({ jobs: filteredJobs, people: filteredPeople, blogs: filteredBlogs });
                setSearchMessage(message);

            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(performSearch, 500); // Debounce
        return () => clearTimeout(timer);
    }, [query]);

    // Calculate distance between two coordinates using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Get user's current location
    const getUserLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });

                // Fetch all users and filter by distance
                try {
                    const allUsers = await getAllUsers();
                    const nearby = allUsers.filter(user => {
                        if (!user.location) return false;

                        // Try to parse location as coordinates (format: "lat,lng")
                        const coords = user.location.split(',').map(c => parseFloat(c.trim()));
                        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                            const distance = calculateDistance(latitude, longitude, coords[0], coords[1]);
                            return distance <= 50; // Within 50km
                        }
                        return false;
                    });
                    setNearbyUsers(nearby);
                } catch (error) {
                    console.error('Error fetching nearby users:', error);
                } finally {
                    setLocationLoading(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enable location services.');
                setLocationLoading(false);
            }
        );
    };

    // Get nearby users when "Near Me" tab is selected
    useEffect(() => {
        if (activeTab === 'nearme' && !userLocation) {
            getUserLocation();
        }
    }, [activeTab]);

    const handleClear = () => {
        setQuery('');
        navigate('/search'); // Clear URL param
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-[#090A0C] text-zinc-900 dark:text-white font-display pb-36 md:pb-24">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1">
                {/* Search Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#090A0C]/85 backdrop-blur-2xl p-4 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div className="flex-1 relative">
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Search jobs, talent, articles..."
                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-[#121316] border border-black/[0.04] dark:border-white/[0.07] text-xs font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-lg">search</span>
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}

                            {/* Autocomplete Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#121316] rounded-xl shadow-xl border border-black/[0.04] dark:border-white/[0.07] overflow-hidden z-50">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setQuery(suggestion);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-black/[0.04] dark:border-white/[0.07] last:border-0"
                                        >
                                            <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
                                            <span className="text-xs text-zinc-900 dark:text-white font-medium">{suggestion}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {['all', 'jobs', 'people', 'blogs', 'nearme'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as TabType)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${activeTab === tab
                                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                                    : 'bg-white dark:bg-[#121316] text-zinc-500 dark:text-zinc-400 border border-black/[0.04] dark:border-white/[0.07] hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab === 'nearme' && <span className="material-symbols-outlined text-sm">location_on</span>}
                                {tab === 'nearme' ? 'Near Me' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="p-4 space-y-6">
                    {!query && (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700 mb-2">search</span>
                            <p className="text-zinc-500 dark:text-zinc-400">Type something to start searching</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-10">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                    )}

                    {!loading && query && (
                        <>
                            {searchMessage && (
                                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl text-xs font-medium mb-4">
                                    {searchMessage}
                                </div>
                            )}

                            {/* Jobs Section */}
                            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                                <section>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3 flex items-center justify-between">
                                        Jobs
                                        {activeTab === 'all' && <button onClick={() => setActiveTab('jobs')} className="text-xs text-amber-500 font-bold hover:underline">See All</button>}
                                    </h3>
                                    <div className="space-y-3">
                                        {results.jobs.map((job) => (
                                            <div key={job.id} onClick={() => navigate(`/job/${job.id}`)} className="bg-white dark:bg-[#121316] p-4 rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.07] cursor-pointer hover:border-amber-500/30 transition-all">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="size-10 rounded-full bg-black border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {job.logo ? (
                                                            <img
                                                                src={job.logo}
                                                                className="w-full h-full object-cover"
                                                                alt="logo"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-zinc-400 text-lg">work</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">{job.title}</h4>
                                                        <p className="text-xs text-amber-500 font-semibold">{job.company}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-amber-500">location_on</span> {job.location}</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-zinc-400">work</span> {job.type}</span>
                                                    {job.salary && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-zinc-400">payments</span> {job.salary}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* People Section */}
                            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                                <section>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3 flex items-center justify-between">
                                        Talent & Creators
                                        {activeTab === 'all' && <button onClick={() => setActiveTab('people')} className="text-xs text-amber-500 font-bold hover:underline">See All</button>}
                                    </h3>
                                    <div className="space-y-3">
                                        {results.people.map((person: UserProfile) => (
                                            <div key={person.uid} onClick={() => navigate(`/profile/${person.uid}`)} className="flex items-center gap-3 bg-white dark:bg-[#121316] p-3 rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.07] cursor-pointer hover:border-amber-500/30 transition-all">
                                                <img
                                                    src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=random`}
                                                    alt={person.displayName || 'User'}
                                                    className="size-11 rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=random`;
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{person.displayName || 'Unknown User'}</h4>
                                                    <p className="text-xs text-zinc-400 truncate">{person.role || 'Professional'}{person.location ? ` • ${person.location}` : ''}</p>
                                                </div>
                                                <span className="material-symbols-outlined text-zinc-400 text-lg">chevron_right</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Blogs Section */}
                            {(activeTab === 'all' || activeTab === 'blogs') && results.blogs.length > 0 && (
                                <section>
                                    <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3 flex items-center justify-between">
                                        Journal & Articles
                                        {activeTab === 'all' && <button onClick={() => setActiveTab('blogs')} className="text-xs text-amber-500 font-bold hover:underline">See All</button>}
                                    </h3>
                                    <div className="space-y-3">
                                        {results.blogs.map((blog: BlogPost) => (
                                            <div key={blog.id} onClick={() => navigate(`/blog/${blog.id}`)} className="bg-white dark:bg-[#121316] p-4 rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.07] cursor-pointer hover:border-amber-500/30 transition-all">
                                                <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full mb-2 inline-block">{blog.category}</span>
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{blog.title}</h4>
                                                <p className="text-xs text-zinc-400 mt-1">By {blog.author}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* No Results */}
                            {results.jobs.length === 0 && results.people.length === 0 && results.blogs.length === 0 && (
                                <EmptyState
                                    message={`No results for "${query}"`}
                                    subMessage="Try checking your spelling or using broader keywords."
                                    icon="search_off"
                                    actionLabel="Clear Search"
                                    onAction={handleClear}
                                />
                            )}
                        </>
                    )}

                    {/* Near Me Section */}
                    {activeTab === 'nearme' && (
                        <section>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">location_on</span>
                                People Near You (Within 50km)
                            </h3>

                            {locationLoading && (
                                <div className="flex justify-center py-10">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length > 0 && (
                                <div className="space-y-3">
                                    {nearbyUsers.map((person: UserProfile) => (
                                        <div key={person.uid} onClick={() => navigate(`/profile/${person.uid}`)} className="flex items-center gap-3 bg-white dark:bg-[#121316] p-3 rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.07] cursor-pointer hover:border-amber-500/30 transition-all">
                                            <img
                                                src={person.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=random`}
                                                alt={person.displayName || 'User'}
                                                className="size-11 rounded-full object-cover shrink-0 border border-black/5 dark:border-white/10"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.displayName || 'User')}&background=random`;
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{person.displayName || 'Unknown User'}</h4>
                                                <p className="text-xs text-zinc-400 truncate">{person.role || 'Professional'}{person.location ? ` • ${person.location}` : ''}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-amber-500 text-lg">location_on</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length === 0 && userLocation && (
                                <EmptyState
                                    message="No users found nearby"
                                    subMessage="Try expanding your search radius or check back later."
                                    icon="location_off"
                                />
                            )}

                            {!locationLoading && !userLocation && (
                                <div className="text-center py-10">
                                    <span className="material-symbols-outlined text-4xl text-zinc-500 mb-2">location_searching</span>
                                    <p className="text-xs text-zinc-400 mb-4">Enable location to find people near you</p>
                                    <button
                                        onClick={getUserLocation}
                                        className="px-5 py-2.5 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-400 transition-all shadow-sm"
                                    >
                                        Enable Location
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
