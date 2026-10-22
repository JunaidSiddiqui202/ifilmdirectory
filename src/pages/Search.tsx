import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { jobService, type Job } from '../services/jobService';
import { getAllUsers, type UserProfile } from '../services/userService';
import { blogService, type BlogPost } from '../services/blogService';
import { facilityService, type Facility } from '../services/facilityService';
import { getPosts, type PostData } from '../services/postService';
import { rssNewsService, type NewsItem } from '../services/rssNewsService';
import EmptyState from '../components/EmptyState';
import PostMedia from '../components/PostMedia';
import {
    parseNaturalProductionQuery,
    buildAIProductionPackage,
    parseFacilityPrice,
    inferActorAge,
    type ProductionPackageResult
} from '../services/aiProductionSearchService';

type TabType = 'all' | 'ai_package' | 'people' | 'studios' | 'feed' | 'news' | 'jobs' | 'blogs' | 'nearme';

interface SearchPrediction {
    id: string;
    type: 'people' | 'studio' | 'feed' | 'news' | 'job' | 'blog' | 'keyword' | 'craft' | 'ai_package';
    title: string;
    subtitle?: string;
    badge: string;
    badgeColor: string;
    icon: string;
    image?: string;
    fallbackType?: 'USER_MALE' | 'COMPANY_LOGO' | 'FILM_SET' | 'CINEMA_HALL';
    action: () => void;
}

interface CinematicCraft {
    id: string;
    title: string;
    shortLabel: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    icon: string;
    triggers: string[];
    rolePatterns: RegExp[];
}

const CINEMATIC_CRAFTS: CinematicCraft[] = [
    {
        id: 'ad',
        title: 'Assistant Directors (AD) & Associate Directors',
        shortLabel: 'AD / Assistant Director',
        subtitle: 'Assistant Directors, Associate Directors, Chief ADs & Co-Directors',
        badge: 'Direction Craft',
        badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        icon: 'movie_filter',
        triggers: [
            'ad', 'ads', 'a.d.', 'a.d', 'assistant director', 'assistant directors',
            'associate director', 'associate directors', 'chief ad', 'chief assistant director',
            'co-director', 'co director', 'co-directors', 'co directors', '1st ad', 'first ad',
            '2nd ad', 'second ad', 'da', 'directors assistant', 'direction department'
        ],
        rolePatterns: [
            /\b(assistant[_\s-]?director|associate[_\s-]?director|co[_\s-]?director|chief[_\s-]?ad|1st[_\s-]?ad|2nd[_\s-]?ad|\bad\b)\b/i
        ]
    },
    {
        id: 'dop',
        title: 'Cinematographers & Directors of Photography (DOP)',
        shortLabel: 'DOP / Cameraman',
        subtitle: 'Cinematographers, Directors of Photography, Cameramen & Camera Operators',
        badge: 'Camera Craft',
        badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        icon: 'videocam',
        triggers: [
            'dop', 'd.o.p', 'd.o.p.', 'dp', 'd.p.', 'cameraman', 'camera man', 'camera men',
            'camera operator', 'camera operators', 'cinematographer', 'cinematographers',
            'cinematography', 'director of photography', 'directors of photography',
            'lighting cameraman', 'focus puller', 'gaffer', 'steadicam'
        ],
        rolePatterns: [
            /\b(cinematographer|cinematography|director[_\s-]?of[_\s-]?photography|cameraman|camera[_\s-]?operator|focus[_\s-]?puller|gaffer|\bdop\b|\bdp\b)\b/i
        ]
    },
    {
        id: 'editor',
        title: 'Film & Video Editors, Colorists',
        shortLabel: 'Editor / Colorist',
        subtitle: 'Film Editors, Video Editors, Colorists & DI Artists',
        badge: 'Post-Production',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: 'content_cut',
        triggers: [
            'editor', 'editors', 'film editor', 'film editors', 'video editor', 'video editors',
            'editing', 'colorist', 'colorists', 'di colorist', 'di editor', 'offline editor',
            'online editor', 'davinci resolve', 'post production'
        ],
        rolePatterns: [
            /\b(editor|film[_\s-]?editor|video[_\s-]?editor|colorist|di[_\s-]?colorist|di[_\s-]?editor|offline[_\s-]?editor|online[_\s-]?editor)\b/i
        ]
    },
    {
        id: 'lyricist',
        title: 'Lyricists & Songwriters',
        shortLabel: 'Lyricist / Lyric Writer',
        subtitle: 'Lyricists, Lyric Writers, Songwriters & Poets',
        badge: 'Music & Lyrics',
        badgeColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
        icon: 'lyrics',
        triggers: [
            'lyricist', 'lyricists', 'lyric writer', 'lyric writers', 'lyrics writer',
            'lyrics writers', 'lyrics', 'lyric', 'songwriter', 'songwriters', 'song writer',
            'song writers', 'poet', 'geetharachayitha', 'padarachayitha'
        ],
        rolePatterns: [
            /\b(lyricist|lyric[_\s-]?writer|lyrics[_\s-]?writer|lyrics|songwriter|song[_\s-]?writer|poet)\b/i
        ]
    },
    {
        id: 'writer',
        title: 'Screenwriters, Dialogue & Story Writers',
        shortLabel: 'Screenwriter / Writer',
        subtitle: 'Screenplay, Dialogue, Story & Script Writers',
        badge: 'Writing Craft',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: 'edit_note',
        triggers: [
            'writer', 'writers', 'screenwriter', 'screenwriters', 'scriptwriter',
            'scriptwriters', 'script writer', 'script writers', 'screenplay', 'screenplay writer',
            'dialogue writer', 'dialogue writers', 'dialogues', 'story writer', 'story writers',
            'script', 'katha'
        ],
        rolePatterns: [
            /\b(screenwriter|scriptwriter|script[_\s-]?writer|dialogue[_\s-]?writer|dialogue|story[_\s-]?writer|screenplay|\bwriter\b)\b/i
        ]
    },
    {
        id: 'director',
        title: 'Film Directors & Filmmakers',
        shortLabel: 'Director / Filmmaker',
        subtitle: 'Feature Film, Short Film & Commercial Directors',
        badge: 'Direction Craft',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        icon: 'movie',
        triggers: [
            'director', 'directors', 'filmmaker', 'filmmakers', 'film director', 'movie director', 'direction'
        ],
        rolePatterns: [
            /^(?!.*(assistant|associate|art|casting|music|technical|creative)).*\b(director|filmmaker)\b/i
        ]
    },
    {
        id: 'actor',
        title: 'Actors, Actresses & Cast',
        shortLabel: 'Actor / Actress',
        subtitle: 'Lead Actors, Actresses, Character Artists & Models',
        badge: 'Performance',
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        icon: 'theater_comedy',
        triggers: [
            'actor', 'actors', 'actress', 'actresses', 'hero', 'heroine', 'artist', 'artists',
            'cast', 'casting', 'junior artist', 'character artist', 'performing artist', 'model', 'acting'
        ],
        rolePatterns: [
            /\b(actor|actress|artist|cast|hero|heroine|performing[_\s-]?artist|model)\b/i
        ]
    },
    {
        id: 'music_director',
        title: 'Music Directors & Composers',
        shortLabel: 'Music Director / Composer',
        subtitle: 'Music Composers, Background Score & Music Producers',
        badge: 'Music Craft',
        badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        icon: 'music_note',
        triggers: [
            'music director', 'music directors', 'composer', 'composers', 'music composer',
            'music producer', 'bgm', 'background score', 'soundtrack composer', 'musician'
        ],
        rolePatterns: [
            /\b(music[_\s-]?composer|music[_\s-]?director|composer|music[_\s-]?producer|bgm)\b/i
        ]
    },
    {
        id: 'sound',
        title: 'Sound Designers & Audio Engineers',
        shortLabel: 'Sound Designer / Audiographer',
        subtitle: 'Sync Sound, Audiographers, Foley & Audio Engineers',
        badge: 'Sound Craft',
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        icon: 'graphic_eq',
        triggers: [
            'sound designer', 'sound designers', 'sound engineer', 'sound recordist',
            'audiographer', 'audiography', 'sync sound', 'sound mixer', 'foley', 'boom operator'
        ],
        rolePatterns: [
            /\b(sound[_\s-]?designer|sound[_\s-]?recordist|audiographer|sync[_\s-]?sound|foley|boom[_\s-]?operator|audio[_\s-]?engineer)\b/i
        ]
    },
    {
        id: 'art',
        title: 'Art Directors & Production Designers',
        shortLabel: 'Art Director / Set Designer',
        subtitle: 'Production Designers, Art Directors & Set Decorators',
        badge: 'Art Craft',
        badgeColor: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        icon: 'palette',
        triggers: [
            'art director', 'art directors', 'production designer', 'production designers',
            'set designer', 'set decorator', 'art department'
        ],
        rolePatterns: [
            /\b(art[_\s-]?director|production[_\s-]?designer|set[_\s-]?designer)\b/i
        ]
    },
    {
        id: 'stunt',
        title: 'Action Directors & Fight Masters',
        shortLabel: 'Action / Fight Master',
        subtitle: 'Stunt Masters, Action Choreographers & Fight Directors',
        badge: 'Action Craft',
        badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        icon: 'sports_kabaddi',
        triggers: [
            'stunt', 'stunts', 'stunt master', 'fight master', 'action director',
            'action choreographer', 'stunt coordinator', 'action'
        ],
        rolePatterns: [
            /\b(stunt[_\s-]?performer|stunt|fight[_\s-]?master|action[_\s-]?director|action[_\s-]?choreographer)\b/i
        ]
    },
    {
        id: 'costume_makeup',
        title: 'Costume Designers & Makeup Artists',
        shortLabel: 'Costume / Makeup',
        subtitle: 'Wardrobe Designers, Makeup Artists & Stylists',
        badge: 'Styling & Look',
        badgeColor: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
        icon: 'checkroom',
        triggers: [
            'costume designer', 'costume', 'costumes', 'wardrobe', 'stylist',
            'makeup artist', 'make-up', 'makeup', 'hair stylist'
        ],
        rolePatterns: [
            /\b(costume[_\s-]?designer|makeup[_\s-]?artist|hair[_\s-]?stylist|wardrobe|stylist)\b/i
        ]
    },
    {
        id: 'vfx',
        title: 'VFX & Animation Artists',
        shortLabel: 'VFX / CGI',
        subtitle: 'Visual Effects Artists, Animators & Compositors',
        badge: 'VFX & CGI',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: 'auto_fix_high',
        triggers: [
            'vfx', 'vfx artist', 'visual effects', 'cgi', 'compositor', '3d artist',
            'animator', 'animation', 'motion graphics'
        ],
        rolePatterns: [
            /\b(vfx|vfx[_\s-]?artist|visual[_\s-]?effects|motion[_\s-]?graphics|animator|cgi)\b/i
        ]
    },
    {
        id: 'producer',
        title: 'Producers & Line Producers',
        shortLabel: 'Producer / Line Producer',
        subtitle: 'Executive Producers, Line Producers & Production Heads',
        badge: 'Production Craft',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: 'assignment',
        triggers: [
            'producer', 'producers', 'executive producer', 'line producer',
            'production manager', 'production controller'
        ],
        rolePatterns: [
            /\b(producer|line[_\s-]?producer|production[_\s-]?manager|production[_\s-]?coordinator)\b/i
        ]
    }
];

// Helper to find which cinematic craft(s) match user's search query
function findMatchingCinematicCrafts(rawQuery: string): CinematicCraft[] {
    const trimmed = rawQuery.trim();
    if (!trimmed) return [];

    const lower = trimmed.toLowerCase();
    const compact = lower.replace(/[^a-z0-9]/g, '');
    const tokens = lower.split(/[\s,./\-_]+/).filter(t => t.length > 0);
    const stopWords = new Set(['list', 'lists', 'show', 'all', 'find', 'top', 'best', 'who', 'the', 'a', 'in', 'of', 'for', 'me']);
    const meaningfulTokens = tokens.filter(t => !stopWords.has(t));
    const cleanPhrase = meaningfulTokens.join(' ');
    const stemPhrase = cleanPhrase.endsWith('s') && cleanPhrase.length > 3 ? cleanPhrase.slice(0, -1) : cleanPhrase;

    const matched: CinematicCraft[] = [];

    for (const craft of CINEMATIC_CRAFTS) {
        let isMatch = false;
        for (const trigger of craft.triggers) {
            const cleanTrigger = trigger.toLowerCase();
            const compactTrigger = cleanTrigger.replace(/[^a-z0-9]/g, '');

            // 1. Direct or compact match (e.g. "ad", "AD", "dop", "DOP", "d.o.p", "cameraman", "editor", "lyricist")
            if (compact === compactTrigger || lower === cleanTrigger) {
                isMatch = true;
                break;
            }

            // 2. Clean phrase without "list", "show", etc. (e.g. "editors list" -> "editor")
            if (cleanPhrase === cleanTrigger || stemPhrase === cleanTrigger) {
                isMatch = true;
                break;
            }

            // 3. Substring match for longer trigger terms (>= 4 chars)
            if (cleanTrigger.length >= 4 && (cleanPhrase.includes(cleanTrigger) || cleanTrigger.includes(cleanPhrase))) {
                isMatch = true;
                break;
            }

            // 4. Token boundary match (e.g. "show me editors")
            if (cleanTrigger.length >= 3 && meaningfulTokens.includes(cleanTrigger)) {
                isMatch = true;
                break;
            }
        }

        if (isMatch) {
            matched.push(craft);
        }
    }

    return matched;
}

// Helper to test if a UserProfile matches a CinematicCraft
function doesUserMatchCraft(user: UserProfile, craft: CinematicCraft): boolean {
    const role = (user.role || '').toLowerCase();
    const customRole = (user.customRole || '').toLowerCase();
    const bio = (user.bio || '').toLowerCase();

    // 1. Regex test on role and customRole
    for (const pattern of craft.rolePatterns) {
        if (pattern.test(role) || pattern.test(customRole)) {
            return true;
        }
    }

    // 2. Direct string triggers match on role
    for (const trigger of craft.triggers) {
        const cleanTrigger = trigger.toLowerCase();
        if (role === cleanTrigger || role.includes(cleanTrigger)) return true;
        if (customRole && (customRole === cleanTrigger || customRole.includes(cleanTrigger))) return true;
    }

    // 3. For bio: only match if longer trigger (>= 4 chars) or bounded abbreviation
    for (const trigger of craft.triggers) {
        if (trigger.length >= 4) {
            if (bio.includes(trigger.toLowerCase())) return true;
        } else {
            const regex = new RegExp(`\\b${trigger}\\b`, 'i');
            if (regex.test(bio)) return true;
        }
    }

    return false;
}

// Helper to test if a Job matches a CinematicCraft
function doesJobMatchCraft(job: Job, craft: CinematicCraft): boolean {
    const title = (job.title || '').toLowerCase();
    const type = (job.type || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();

    for (const pattern of craft.rolePatterns) {
        if (pattern.test(title) || pattern.test(type)) return true;
    }

    for (const trigger of craft.triggers) {
        const cleanTrigger = trigger.toLowerCase();
        if (title.includes(cleanTrigger) || type.includes(cleanTrigger)) return true;
        if (trigger.length >= 4 && desc.includes(cleanTrigger)) return true;
        if (trigger.length < 4) {
            const regex = new RegExp(`\\b${trigger}\\b`, 'i');
            if (regex.test(title) || regex.test(desc)) return true;
        }
    }

    return false;
}

interface SearchResultsState {
    people: UserProfile[];
    studios: Facility[];
    feed: PostData[];
    news: NewsItem[];
    jobs: Job[];
    blogs: BlogPost[];
}

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [results, setResults] = useState<SearchResultsState>({
        people: [],
        studios: [],
        feed: [],
        news: [],
        jobs: [],
        blogs: []
    });
    const [searchMessage, setSearchMessage] = useState('');
    const [predictions, setPredictions] = useState<SearchPrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsItem | null>(null);
    const [activeCrafts, setActiveCrafts] = useState<CinematicCraft[]>([]);
    const [productionPackage, setProductionPackage] = useState<ProductionPackageResult | null>(null);
    const [aiPackageDepartment, setAiPackageDepartment] = useState<'all' | 'cast' | 'crew' | 'locations'>('all');
    const [castAgeFilter, setCastAgeFilter] = useState<'all' | 'young' | 'middle' | 'senior' | 'child'>('all');

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cache datasets across keystrokes so predictions are instant (<10ms)
    const datasetsRef = useRef<{
        users: UserProfile[];
        studios: Facility[];
        feed: PostData[];
        news: NewsItem[];
        jobs: Job[];
        blogs: BlogPost[];
        loaded: boolean;
    }>({
        users: [],
        studios: [],
        feed: [],
        news: [],
        jobs: [],
        blogs: [],
        loaded: false
    });

    // Helper: calculate Levenshtein distance for fuzzy matching
    const levenshteinDistance = (str1: string, str2: string): number => {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        for (let i = 0; i <= len1; i++) matrix[i] = [i];
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[len1][len2];
    };

    // Fuzzy match helper
    const fuzzyMatch = (text: string, q: string): boolean => {
        if (!text || !q) return false;
        const textLower = text.toLowerCase();
        const qLower = q.toLowerCase();

        if (textLower.includes(qLower)) return true;
        if (qLower.length < 3) return false;

        const words = textLower.split(/\s+/);
        for (const word of words) {
            const maxDistance = word.length <= 6 ? 1 : 2;
            if (levenshteinDistance(word, qLower) <= maxDistance) return true;
            if (word.includes(qLower)) return true;
        }
        return false;
    };

    // Pre-fetch all datasets into ref for instant searching & predictions
    const loadAllDatasets = async () => {
        if (datasetsRef.current.loaded) return datasetsRef.current;
        try {
            const [users, studios, feed, newsRes, jobs, blogs] = await Promise.all([
                getAllUsers().catch(() => []),
                facilityService.getFacilities().catch(() => []),
                getPosts(40).catch(() => []),
                rssNewsService.getNews().catch(() => ({ items: rssNewsService.getCachedNews(), lastSync: 0, isStale: false })),
                jobService.getJobs().catch(() => []),
                blogService.getBlogs().catch(() => [])
            ]);

            datasetsRef.current = {
                users,
                studios,
                feed,
                news: newsRes.items || [],
                jobs,
                blogs,
                loaded: true
            };
        } catch (err) {
            console.error("Error loading search datasets:", err);
        }
        return datasetsRef.current;
    };

    useEffect(() => {
        loadAllDatasets();
    }, []);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null && q !== query) {
            setQuery(q);
        }
    }, [searchParams]);

    // Format news relative time
    const formatNewsTime = (timestamp: number) => {
        if (!timestamp) return '';
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // 1. GENERATE INSTANT SEARCH PREDICTIONS ACROSS ALL ENTITIES & CINEMATIC CRAFTS
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        const buildPredictions = async () => {
            const datasets = await loadAllDatasets();
            const lowerQuery = trimmed.toLowerCase();
            const matches: SearchPrediction[] = [];

            // Detect any cinematic craft triggers (e.g. "ad", "dop", "cameraman", "editor", "lyricist", etc.)
            const matchingCrafts = findMatchingCinematicCrafts(trimmed);
            const addedUserUids = new Set<string>();

            // 0A. AI NATURAL LANGUAGE PRODUCTION PREDICTION (Cast & Crew package, age filters, budget location finder)
            const parsedAi = parseNaturalProductionQuery(trimmed);
            if (parsedAi.isNaturalAIQuery || parsedAi.isProductionPackage || !!parsedAi.locationQuery?.maxBudget || !!parsedAi.targetAgeRange) {
                let aiTitle = '✨ AI Film Search: Assemble Cast & Crew Package';
                let aiSubtitle = 'Auto-categorizes cast by age brackets, crew by craft, and locations by budget';
                
                if (parsedAi.locationQuery?.maxBudget) {
                    aiTitle = `✨ Find Locations within ₹${parsedAi.locationQuery.maxBudget.toLocaleString('en-IN')}`;
                    if (parsedAi.locationQuery.type) {
                        aiSubtitle = `Search ${parsedAi.locationQuery.type} properties under ₹${parsedAi.locationQuery.maxBudget.toLocaleString('en-IN')}${parsedAi.locationQuery.nearMe ? ' near you' : ''}`;
                    }
                } else if (parsedAi.targetAgeRange) {
                    aiTitle = `✨ Search Actors in Age Bracket: ${parsedAi.targetAgeRange.label}`;
                    aiSubtitle = parsedAi.characterArchetype ? `Finding ${parsedAi.characterArchetype} profiles matching ${parsedAi.targetAgeRange.label}` : `Categorizes young leads, character artists & seniors by age`;
                } else if (parsedAi.isProductionPackage) {
                    aiTitle = '✨ Assemble Complete Cast & Crew Package';
                    aiSubtitle = 'Full production breakdown: Cast by age, direction, camera, post, art & locations';
                }

                matches.push({
                    id: 'ai-production-package-prediction',
                    type: 'ai_package',
                    title: aiTitle,
                    subtitle: aiSubtitle,
                    badge: '✨ AI Search',
                    badgeColor: 'bg-gradient-to-r from-amber-500 to-purple-600 text-white border-amber-400/40',
                    icon: 'auto_awesome',
                    action: () => {
                        setShowPredictions(false);
                        setActiveTab('ai_package');
                        triggerFullSearch(trimmed);
                    }
                });
            }

            // 0. CINEMATIC CRAFT HIGHLIGHT PREDICTIONS
            for (const craft of matchingCrafts) {
                const craftUsers = datasets.users.filter(u => doesUserMatchCraft(u, craft));
                const craftJobs = datasets.jobs.filter(j => doesJobMatchCraft(j, craft));
                const totalCraftCount = craftUsers.length + craftJobs.length;

                matches.push({
                    id: `craft-${craft.id}`,
                    type: 'craft',
                    title: `All ${craft.title}`,
                    subtitle: `${craft.subtitle}${totalCraftCount > 0 ? ` • ${totalCraftCount} listings found` : ''}`,
                    badge: craft.badge,
                    badgeColor: craft.badgeColor,
                    icon: craft.icon,
                    action: () => {
                        setShowPredictions(false);
                        setActiveTab('people');
                        triggerFullSearch(craft.triggers[0]);
                    }
                });

                // Inject top matching creators directly into predictions
                for (const user of craftUsers.slice(0, 4)) {
                    if (matches.length >= 10) break;
                    addedUserUids.add(user.uid);
                    const name = user.displayName || user.username || 'Creator';
                    const role = user.role || user.customRole || craft.shortLabel;
                    matches.push({
                        id: `craft-user-${user.uid}`,
                        type: 'people',
                        title: name,
                        subtitle: `${role}${user.location ? ` • ${user.location}` : ''}`,
                        badge: craft.shortLabel,
                        badgeColor: craft.badgeColor,
                        icon: craft.icon,
                        image: user.photoURL || undefined,
                        fallbackType: 'USER_MALE',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/profile/${user.uid}`);
                        }
                    });
                }
            }

            // 1. Users / Talent Predictions (General name / role match)
            for (const user of datasets.users) {
                if (matches.length >= 10) break;
                if (addedUserUids.has(user.uid)) continue;
                const name = user.displayName || user.username || '';
                const role = user.role || 'Filmmaker';
                if (
                    name.toLowerCase().includes(lowerQuery) ||
                    role.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(name, trimmed)
                ) {
                    addedUserUids.add(user.uid);
                    matches.push({
                        id: `user-${user.uid}`,
                        type: 'people',
                        title: name || 'Creator',
                        subtitle: `${role}${user.location ? ` • ${user.location}` : ''}`,
                        badge: 'Talent',
                        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20',
                        icon: 'person',
                        image: user.photoURL || undefined,
                        fallbackType: 'USER_MALE',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/profile/${user.uid}`);
                        }
                    });
                }
            }

            // 2. Studio & Facilities Predictions
            for (const studio of datasets.studios) {
                if (matches.length >= 10) break;
                if (
                    studio.name.toLowerCase().includes(lowerQuery) ||
                    studio.type.toLowerCase().includes(lowerQuery) ||
                    (studio.location && studio.location.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(studio.name, trimmed)
                ) {
                    matches.push({
                        id: `studio-${studio.id}`,
                        type: 'studio',
                        title: studio.name,
                        subtitle: `${studio.type} • ${studio.location || 'India'}`,
                        badge: studio.type === 'Studio' ? 'Studio' : (studio.type === 'Equipment' ? 'Gear' : 'Facility'),
                        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
                        icon: 'domain',
                        image: studio.image,
                        fallbackType: 'FILM_SET',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/booking/details/${studio.id}`);
                        }
                    });
                }
            }

            // 3. Cinema News & Reviews Predictions
            for (const item of datasets.news) {
                if (matches.length >= 10) break;
                if (
                    item.title.toLowerCase().includes(lowerQuery) ||
                    (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
                    item.source.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(item.title, trimmed)
                ) {
                    const isReview = item.category === 'review' || !!item.rating;
                    matches.push({
                        id: `news-${item.id}`,
                        type: 'news',
                        title: item.title,
                        subtitle: `${item.source} • ${formatNewsTime(item.timestamp)}`,
                        badge: isReview ? (item.rating ? `★ ${item.rating}` : 'Review') : 'Cinema Wire',
                        badgeColor: isReview
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                        icon: 'newspaper',
                        image: item.thumbnail,
                        fallbackType: 'CINEMA_HALL',
                        action: () => {
                            setShowPredictions(false);
                            setSelectedNewsArticle(item);
                        }
                    });
                }
            }

            // 4. Feed & Community Posts Predictions
            for (const post of datasets.feed) {
                if (matches.length >= 10) break;
                if (
                    (post.content && post.content.toLowerCase().includes(lowerQuery)) ||
                    (post.author && post.author.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(post.content || '', trimmed)
                ) {
                    matches.push({
                        id: `post-${post.id || Math.random()}`,
                        type: 'feed',
                        title: post.content ? (post.content.length > 60 ? post.content.slice(0, 60) + '...' : post.content) : 'Filmmaker Post',
                        subtitle: `By ${post.author || 'Creator'}${post.role ? ` (${post.role})` : ''}`,
                        badge: 'Feed',
                        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
                        icon: 'forum',
                        image: post.authorImage || post.image,
                        fallbackType: 'USER_MALE',
                        action: () => {
                            setShowPredictions(false);
                            navigate('/showcase');
                        }
                    });
                }
            }

            // 5. Jobs & Castings Predictions
            for (const job of datasets.jobs) {
                if (matches.length >= 10) break;
                const matchesCraft = matchingCrafts.some(c => doesJobMatchCraft(job, c));
                if (
                    matchesCraft ||
                    job.title.toLowerCase().includes(lowerQuery) ||
                    job.company.toLowerCase().includes(lowerQuery) ||
                    job.location.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(job.title, trimmed)
                ) {
                    matches.push({
                        id: `job-${job.id}`,
                        type: 'job',
                        title: job.title,
                        subtitle: `${job.company} • ${job.location}`,
                        badge: 'Job',
                        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
                        icon: 'work',
                        image: job.logo,
                        fallbackType: 'COMPANY_LOGO',
                        action: () => {
                            setShowPredictions(false);
                            navigate(`/job/${job.id}`);
                        }
                    });
                }
            }

            // Add general keyword search prediction as fallback/direct option
            matches.unshift({
                id: 'keyword-direct',
                type: 'keyword',
                title: `Search everything for "${trimmed}"`,
                subtitle: 'Press Enter or click to view all matches',
                badge: 'Search All',
                badgeColor: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-200 border-zinc-500/20',
                icon: 'search',
                action: () => {
                    setShowPredictions(false);
                    triggerFullSearch(trimmed);
                }
            });

            setPredictions(matches.slice(0, 9));
            setShowPredictions(true);
        };

        const timer = setTimeout(buildPredictions, 180);
        return () => clearTimeout(timer);
    }, [query]);

    // 2. TRIGGER FULL SEARCH ACROSS ALL 6 VERTICALS
    const triggerFullSearch = (searchQuery: string) => {
        setSearchParams(searchQuery ? { q: searchQuery } : {});
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults({
                people: [],
                studios: [],
                feed: [],
                news: [],
                jobs: [],
                blogs: []
            });
            setActiveCrafts([]);
            setProductionPackage(null);
            setSearchMessage('');
            return;
        }

        setLoading(true);
        setSearchMessage('');

        const performSearch = async () => {
            try {
                const lowerQuery = query.toLowerCase();
                const datasets = await loadAllDatasets();
                const matchingCrafts = findMatchingCinematicCrafts(query);
                setActiveCrafts(matchingCrafts);

                // Build AI Production Package if natural language, age bracket, or budget query
                const parsedAi = parseNaturalProductionQuery(query);
                let generatedPackage: ProductionPackageResult | null = null;
                if (parsedAi.isNaturalAIQuery || parsedAi.isProductionPackage || !!parsedAi.locationQuery?.maxBudget || !!parsedAi.targetAgeRange) {
                    generatedPackage = await buildAIProductionPackage(query, datasets.users, datasets.studios, userLocation);
                    setProductionPackage(generatedPackage);
                    if (parsedAi.isProductionPackage || (parsedAi.locationQuery?.maxBudget && parsedAi.locationQuery?.requested)) {
                        setActiveTab('ai_package');
                    }
                } else {
                    setProductionPackage(null);
                }

                // 1. Search Users / Talent (Cinematic Crafts priority + general query)
                const peopleMap = new Map<string, UserProfile>();

                // Priority 1: Users matching any identified cinematic craft(s)
                if (matchingCrafts.length > 0) {
                    for (const user of datasets.users) {
                        if (matchingCrafts.some(c => doesUserMatchCraft(user, c))) {
                            peopleMap.set(user.uid, user);
                        }
                    }
                }

                // Priority 2: General text matching (name, bio, role, location, username)
                for (const user of datasets.users) {
                    if (peopleMap.has(user.uid)) continue;
                    if (
                        (user.displayName && (user.displayName.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.displayName, query))) ||
                        (user.role && (user.role.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.role, query))) ||
                        (user.location && (user.location.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.location, query))) ||
                        (user.bio && user.bio.toLowerCase().includes(lowerQuery)) ||
                        (user.username && (user.username.toLowerCase().includes(lowerQuery) || fuzzyMatch(user.username, query)))
                    ) {
                        peopleMap.set(user.uid, user);
                    }
                }
                const filteredPeople = Array.from(peopleMap.values());

                // 2. Search Studios & Facilities
                const filteredStudios = datasets.studios.filter(facility =>
                    facility.name.toLowerCase().includes(lowerQuery) ||
                    facility.type.toLowerCase().includes(lowerQuery) ||
                    (facility.location && facility.location.toLowerCase().includes(lowerQuery)) ||
                    (facility.description && facility.description.toLowerCase().includes(lowerQuery)) ||
                    fuzzyMatch(facility.name, query) ||
                    fuzzyMatch(facility.type, query)
                );

                // 3. Search Feed Posts
                const filteredFeed = datasets.feed.filter(post =>
                    (post.content && (post.content.toLowerCase().includes(lowerQuery) || fuzzyMatch(post.content, query))) ||
                    (post.author && (post.author.toLowerCase().includes(lowerQuery) || fuzzyMatch(post.author, query))) ||
                    (post.role && post.role.toLowerCase().includes(lowerQuery))
                );

                // 4. Search Cinema News & Movie Reviews
                const filteredNews = datasets.news.filter(news =>
                    news.title.toLowerCase().includes(lowerQuery) ||
                    (news.description && news.description.toLowerCase().includes(lowerQuery)) ||
                    (news.content && news.content.toLowerCase().includes(lowerQuery)) ||
                    news.source.toLowerCase().includes(lowerQuery) ||
                    news.industry.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(news.title, query)
                );

                // 5. Search Jobs & Castings (Craft priority + general query)
                const jobMap = new Map<string, Job>();
                if (matchingCrafts.length > 0) {
                    for (const job of datasets.jobs) {
                        const jid = job.id || `${job.title}-${job.company}`;
                        if (matchingCrafts.some(c => doesJobMatchCraft(job, c))) {
                            jobMap.set(jid, job);
                        }
                    }
                }
                for (const job of datasets.jobs) {
                    const jid = job.id || `${job.title}-${job.company}`;
                    if (jobMap.has(jid)) continue;
                    if (
                        job.title.toLowerCase().includes(lowerQuery) ||
                        job.company.toLowerCase().includes(lowerQuery) ||
                        job.location.toLowerCase().includes(lowerQuery) ||
                        job.type.toLowerCase().includes(lowerQuery) ||
                        fuzzyMatch(job.title, query) ||
                        fuzzyMatch(job.company, query)
                    ) {
                        jobMap.set(jid, job);
                    }
                }
                let filteredJobs = Array.from(jobMap.values());

                // 6. Search Blogs
                const filteredBlogs = datasets.blogs.filter(blog =>
                    blog.title.toLowerCase().includes(lowerQuery) ||
                    fuzzyMatch(blog.title, query) ||
                    (blog.category && blog.category.toLowerCase().includes(lowerQuery)) ||
                    blog.author.toLowerCase().includes(lowerQuery) ||
                    (blog.content && blog.content.toLowerCase().includes(lowerQuery))
                );

                const totalFound =
                    filteredPeople.length +
                    filteredStudios.length +
                    filteredFeed.length +
                    filteredNews.length +
                    filteredJobs.length +
                    filteredBlogs.length;

                let msg = '';
                if (totalFound > 0 || (generatedPackage && (generatedPackage.cast.allMatchingCast.length > 0 || generatedPackage.locationsAndStudios.matching.length > 0))) {
                    if (parsedAi.isProductionPackage) {
                        msg = `✨ Complete Cast & Crew Package assembled for "${query}"`;
                    } else if (parsedAi.locationQuery?.maxBudget) {
                        msg = `✨ Found ${generatedPackage?.locationsAndStudios.budgetMatchedCount || filteredStudios.length} locations matching budget ≤ ₹${parsedAi.locationQuery.maxBudget.toLocaleString('en-IN')}`;
                    } else if (parsedAi.targetAgeRange) {
                        msg = `✨ Found cast matching age bracket ${parsedAi.targetAgeRange.label}`;
                    } else if (matchingCrafts.length > 0) {
                        const craftTitles = matchingCrafts.map(c => c.shortLabel).join(', ');
                        msg = `Found ${totalFound} result${totalFound > 1 ? 's' : ''} for "${query}" (Cinematic Craft: ${craftTitles})`;
                    } else {
                        msg = `Found ${totalFound} result${totalFound > 1 ? 's' : ''} matching "${query}"`;
                    }
                }

                setResults({
                    people: filteredPeople,
                    studios: filteredStudios,
                    feed: filteredFeed,
                    news: filteredNews,
                    jobs: filteredJobs,
                    blogs: filteredBlogs
                });
                setSearchMessage(msg);

            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(performSearch, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Haversine formula for Nearby
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

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

                try {
                    const allUsers = await getAllUsers();
                    const nearby = allUsers.filter(user => {
                        if (!user.location) return false;
                        const coords = user.location.split(',').map(c => parseFloat(c.trim()));
                        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                            return calculateDistance(latitude, longitude, coords[0], coords[1]) <= 50;
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
            () => {
                alert('Unable to get your location. Please enable location services in your browser.');
                setLocationLoading(false);
            }
        );
    };

    useEffect(() => {
        if (activeTab === 'nearme' && !userLocation) {
            getUserLocation();
        }
    }, [activeTab]);

    const handleClear = () => {
        setQuery('');
        setPredictions([]);
        setShowPredictions(false);
        setActiveCrafts([]);
        setProductionPackage(null);
        setAiPackageDepartment('all');
        setCastAgeFilter('all');
        setSearchParams({});
        inputRef.current?.focus();
    };

    const totalResultsCount =
        results.people.length +
        results.studios.length +
        results.feed.length +
        results.news.length +
        results.jobs.length +
        results.blogs.length;

    const totalAiPackageCount = productionPackage ? (
        productionPackage.cast.allMatchingCast.length +
        productionPackage.crew.direction.length +
        productionPackage.crew.camera.length +
        productionPackage.crew.postProduction.length +
        productionPackage.crew.writingAndMusic.length +
        productionPackage.crew.artAndStunts.length +
        productionPackage.locationsAndStudios.matching.length
    ) : 0;

    const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
        { id: 'all', label: 'All', icon: 'travel_explore', count: totalResultsCount },
        ...(productionPackage ? [{
            id: 'ai_package' as TabType,
            label: '✨ Cast & Crew Package',
            icon: 'auto_awesome',
            count: totalAiPackageCount
        }] : []),
        { id: 'people', label: 'Talent', icon: 'person', count: results.people.length },
        { id: 'studios', label: 'Studios & Gear', icon: 'domain', count: results.studios.length },
        { id: 'feed', label: 'Feed', icon: 'forum', count: results.feed.length },
        { id: 'news', label: 'News & Reviews', icon: 'newspaper', count: results.news.length },
        { id: 'jobs', label: 'Jobs', icon: 'work', count: results.jobs.length },
        { id: 'blogs', label: 'Articles', icon: 'article', count: results.blogs.length },
        { id: 'nearme', label: 'Near Me', icon: 'location_on', count: nearbyUsers.length },
    ];

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-[#141416] text-zinc-900 dark:text-white font-display pb-36 md:pb-24">
            <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col flex-1 px-3 sm:px-4">
                
                {/* 1. SEARCH HEADER & PREDICTIVE INPUT */}
                <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl py-3 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl bg-zinc-100 dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                            title="Go Back"
                            aria-label="Back"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                autoFocus
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setShowPredictions(true);
                                }}
                                onFocus={() => {
                                    if (predictions.length > 0) setShowPredictions(true);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setShowPredictions(false);
                                        triggerFullSearch(query);
                                    } else if (e.key === 'Escape') {
                                        setShowPredictions(false);
                                    }
                                }}
                                placeholder="Search talent, studios, feed, news, reviews, jobs..."
                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-100 dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 text-xs sm:text-sm font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500 text-lg pointer-events-none">
                                search
                            </span>
                            
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                                    title="Clear search"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}

                            {/* 2. INSTANT SEARCH PREDICTIONS DROPDOWN */}
                            {showPredictions && predictions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e1f24] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden z-50 divide-y divide-zinc-100 dark:divide-white/10 max-h-[75vh] overflow-y-auto"
                                >
                                    <div className="px-3.5 py-2 bg-zinc-50 dark:bg-[#18191d] text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center justify-between">
                                        <span>Instant Predictions</span>
                                        <span>{predictions.length} Suggestions</span>
                                    </div>

                                    {predictions.map((p) => {
                                        const isCraft = p.type === 'craft';
                                        const isAi = p.type === 'ai_package';
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={p.action}
                                                className={`px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer group ${
                                                    isAi
                                                        ? 'bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-transparent hover:from-amber-500/25 hover:via-purple-500/25 border-l-4 border-amber-500'
                                                        : isCraft
                                                            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-500'
                                                            : 'hover:bg-zinc-50 dark:hover:bg-white/[0.06]'
                                                }`}
                                            >
                                                {/* Preview Image or Icon */}
                                                <div className={`size-9 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center ${
                                                    isAi
                                                        ? 'bg-gradient-to-br from-amber-500 to-purple-600 text-white border-amber-400/40 shadow-sm'
                                                        : isCraft
                                                            ? 'bg-amber-500/20 border-amber-500/35 text-amber-500 dark:text-amber-400'
                                                            : 'bg-zinc-100 dark:bg-[#18191d] border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-zinc-400'
                                                }`}>
                                                    {p.image ? (
                                                        <PostMedia
                                                            src={p.image}
                                                            fallbackType={p.fallbackType || 'FILM_SET'}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-lg">
                                                            {p.icon}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title & Subtitle */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <h5 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                            {p.title}
                                                        </h5>
                                                    </div>
                                                    {p.subtitle && (
                                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                            {p.subtitle}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Category Badge */}
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${p.badgeColor}`}>
                                                    {p.badge}
                                                </span>

                                                <span className="material-symbols-outlined text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 text-base transition-all">
                                                    arrow_forward
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. HORIZONTAL FILTER TABS WITH COUNTERS */}
                    <div className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
                        {tabs.map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setShowPredictions(false);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                            : 'bg-zinc-100 dark:bg-[#1e1f24] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {typeof tab.count === 'number' && query.trim() && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 4. RESULTS DISPLAY */}
                <div className="pt-4 space-y-6">
                    
                    {/* Empty Query State */}
                    {!query.trim() && (
                        <div className="text-center py-16 px-4">
                            <div className="size-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <span className="material-symbols-outlined text-3xl">travel_explore</span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                                Search Everything on iFilmDirectory
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                                Type a keyword to instantly discover filmmakers, shooting floors, equipment rentals, cinema wire stories, movie reviews, feed posts, and casting calls.
                            </p>

                            {/* AI Production Search Prompts (ChatGPT-style) */}
                            <div className="mt-6 max-w-xl mx-auto text-left">
                                <div className="flex items-center gap-1.5 justify-center text-xs font-bold text-amber-500 uppercase tracking-wider mb-2.5">
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    <span>Try AI Production Searches</span>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {[
                                        { label: '✨ Give me whole cast and crews list', query: 'give me whole cast and crews list' },
                                        { label: '🏡 25k budget old house near me', query: '25k budget old house near me' },
                                        { label: '🌟 Hero 25-30 age & Heroine 20-25', query: 'hero 25-30 age and heroine 20-25' },
                                        { label: '🎭 Senior character artists 50+ age', query: 'senior character artists 50+ age' },
                                        { label: '🎬 Complete direction & camera crew', query: 'complete direction and camera crew' }
                                    ].map((prompt) => (
                                        <button
                                            key={prompt.query}
                                            onClick={() => {
                                                setQuery(prompt.query);
                                                setActiveTab('ai_package');
                                                triggerFullSearch(prompt.query);
                                            }}
                                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 hover:border-amber-500 text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:text-amber-500 transition-all cursor-pointer shadow-sm active:scale-95"
                                        >
                                            {prompt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Popular Suggestions Chips */}
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                                {[
                                    { label: '🎬 AD (Assistant Director)', query: 'AD' },
                                    { label: '🎥 DOP / Cameraman', query: 'DOP' },
                                    { label: '✂️ Film Editor', query: 'editor' },
                                    { label: '✍️ Lyricist & Lyric Writer', query: 'lyricist' },
                                    { label: '📝 Screenwriter', query: 'writer' },
                                    { label: '🎭 Actors & Cast', query: 'actor' },
                                    { label: '🎵 Music Director', query: 'music director' },
                                    { label: '🔊 Sound Designer', query: 'sound designer' },
                                    { label: '🏢 Studios & Gear', query: 'studios' }
                                ].map((chip) => (
                                    <button
                                        key={chip.query}
                                        onClick={() => {
                                            setQuery(chip.query);
                                            triggerFullSearch(chip.query);
                                        }}
                                        className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-amber-500/40 hover:text-amber-500 transition-all cursor-pointer"
                                    >
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Loading Spinner */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="size-9 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                            <span className="text-xs font-semibold text-zinc-400">Searching all verticals...</span>
                        </div>
                    )}

                    {/* Results Content */}
                    {!loading && query.trim() && (
                        <>
                            {/* Cinematic Craft Callout Banner */}
                            {activeCrafts.length > 0 && (
                                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/25 flex items-center justify-between gap-3 shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-10 sm:size-11 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                                            <span className="material-symbols-outlined text-2xl">{activeCrafts[0].icon}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                                                    {activeCrafts[0].title}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeCrafts[0].badgeColor}`}>
                                                    {activeCrafts[0].badge}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                                {activeCrafts[0].subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('people')}
                                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold shrink-0 transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>View Talent</span>
                                        <span className="bg-white/20 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">{results.people.length}</span>
                                    </button>
                                </div>
                            )}

                            {searchMessage && (
                                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between">
                                    <span>{searchMessage}</span>
                                    <span className="text-[11px] text-zinc-400">Showing {activeTab === 'all' ? 'top across all' : activeTab}</span>
                                </div>
                            )}

                            {/* ✨ AI PRODUCTION PACKAGE & CAST/CREW/LOCATION INTELLIGENCE */}
                            {productionPackage && (activeTab === 'all' || activeTab === 'ai_package') && (
                                <div className="space-y-5 rounded-3xl bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent p-4 sm:p-5 border border-amber-500/30 shadow-lg">
                                    {/* Package Header Banner */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-white font-extrabold text-[11px] shadow-sm tracking-wide">
                                                    <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                                                    AI PRODUCTION PACKAGE
                                                </span>
                                                {productionPackage.parsed.targetAgeRange && (
                                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                        Age: {productionPackage.parsed.targetAgeRange.label}
                                                    </span>
                                                )}
                                                {productionPackage.parsed.locationQuery?.maxBudget && (
                                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        Budget Cap: ≤ ₹{productionPackage.parsed.locationQuery.maxBudget.toLocaleString('en-IN')}
                                                    </span>
                                                )}
                                                {productionPackage.parsed.locationQuery?.type && (
                                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                        Type: {productionPackage.parsed.locationQuery.type}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-1.5 flex items-center gap-2">
                                                Cast, Crew & Location Assembly
                                            </h3>
                                        </div>

                                        {/* Department Filter Sub-Tabs */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                            {[
                                                { id: 'all', label: 'All Units' },
                                                { id: 'cast', label: `🎭 Cast (${productionPackage.cast.allMatchingCast.length})` },
                                                { id: 'crew', label: `🎬 Crew (${productionPackage.crew.direction.length + productionPackage.crew.camera.length + productionPackage.crew.postProduction.length + productionPackage.crew.writingAndMusic.length + productionPackage.crew.artAndStunts.length})` },
                                                { id: 'locations', label: `🏡 Locations (${productionPackage.locationsAndStudios.matching.length})` }
                                            ].map((dept) => (
                                                <button
                                                    key={dept.id}
                                                    onClick={() => setAiPackageDepartment(dept.id as any)}
                                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                                        aiPackageDepartment === dept.id
                                                            ? 'bg-amber-500 text-white shadow-sm'
                                                            : 'bg-white/80 dark:bg-[#18191d] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:border-amber-500/40'
                                                    }`}
                                                >
                                                    {dept.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Recommendation Quote */}
                                    {productionPackage.aiRecommendation && (
                                        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-[#1e1f24]/80 border border-amber-500/25 flex items-start gap-3">
                                            <span className="material-symbols-outlined text-amber-500 text-xl shrink-0 mt-0.5">smart_toy</span>
                                            <p className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed italic">
                                                "{productionPackage.aiRecommendation}"
                                            </p>
                                        </div>
                                    )}

                                    {/* 1. CAST SUB-SECTION (AGE-WISE CATEGORIZATION) */}
                                    {(aiPackageDepartment === 'all' || aiPackageDepartment === 'cast') && (
                                        <div className="space-y-3.5 pt-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-rose-500 text-base">theater_comedy</span>
                                                        Cast by Age Brackets & Roles
                                                    </h4>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        Age inferred from verified bios, experience years, and character portfolios
                                                    </p>
                                                </div>

                                                {/* Age Filter Selector */}
                                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                                    {[
                                                        { id: 'all', label: `All (${productionPackage.cast.allMatchingCast.length})` },
                                                        { id: 'young', label: `Young Leads 18–32 (${productionPackage.cast.youngLeads.length})` },
                                                        { id: 'middle', label: `Antagonists / Mid 33–50 (${productionPackage.cast.characterArtists.length})` },
                                                        { id: 'senior', label: `Seniors 50+ (${productionPackage.cast.seniorArtists.length})` },
                                                        { id: 'child', label: `Child (<18) (${productionPackage.cast.childArtists.length})` }
                                                    ].map((bracket) => (
                                                        <button
                                                            key={bracket.id}
                                                            onClick={() => setCastAgeFilter(bracket.id as any)}
                                                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                                                                castAgeFilter === bracket.id
                                                                    ? 'bg-rose-500 text-white shadow-sm'
                                                                    : 'bg-zinc-100 dark:bg-[#18191d] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10'
                                                            }`}
                                                        >
                                                            {bracket.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Cast Members Grid */}
                                            {(() => {
                                                let displayCast = productionPackage.cast.allMatchingCast;
                                                if (castAgeFilter === 'young') displayCast = productionPackage.cast.youngLeads;
                                                else if (castAgeFilter === 'middle') displayCast = productionPackage.cast.characterArtists;
                                                else if (castAgeFilter === 'senior') displayCast = productionPackage.cast.seniorArtists;
                                                else if (castAgeFilter === 'child') displayCast = productionPackage.cast.childArtists;

                                                if (displayCast.length === 0) {
                                                    return (
                                                        <div className="p-4 text-center rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 text-xs text-zinc-400">
                                                            No actors found in this specific age bracket. Try selecting "All" or browsing general talent.
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                        {displayCast.slice(0, activeTab === 'all' ? 6 : 18).map((actor) => {
                                                            const { age, bracket } = inferActorAge(actor);
                                                            let bracketColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                                                            let bracketLabel = 'Young Lead (18–32)';
                                                            if (bracket === 'middle') {
                                                                bracketColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                                                bracketLabel = 'Character Artist (33–50)';
                                                            } else if (bracket === 'senior') {
                                                                bracketColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
                                                                bracketLabel = 'Senior Veteran (50+)';
                                                            } else if (bracket === 'child') {
                                                                bracketColor = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
                                                                bracketLabel = 'Child Artist (<18)';
                                                            }

                                                            return (
                                                                <div
                                                                    key={actor.uid}
                                                                    onClick={() => navigate(`/profile/${actor.uid}`)}
                                                                    className="p-3 rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-12 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                                                                            <PostMedia
                                                                                src={actor.photoURL || ''}
                                                                                fallbackType="USER_MALE"
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                                                {actor.displayName || 'Unknown Actor'}
                                                                            </h5>
                                                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                                                {actor.customRole || actor.role || 'Actor'}
                                                                            </p>
                                                                            {actor.location && (
                                                                                <p className="text-[10px] text-zinc-400 truncate flex items-center gap-0.5 mt-0.5">
                                                                                    <span className="material-symbols-outlined text-[11px]">location_on</span>
                                                                                    {actor.location}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between">
                                                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${bracketColor}`}>
                                                                            {age ? `Age ~${age}` : bracketLabel}
                                                                        </span>
                                                                        <span className="text-[10px] text-zinc-400 group-hover:text-amber-500 flex items-center gap-0.5 font-bold">
                                                                            Profile
                                                                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    {/* 2. CREW & TECHNICIANS SUB-SECTION (DEPARTMENT-WISE) */}
                                    {(aiPackageDepartment === 'all' || aiPackageDepartment === 'crew') && (
                                        <div className="space-y-4 pt-3 border-t border-amber-500/15">
                                            <div>
                                                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-cyan-500 text-base">video_camera_front</span>
                                                    Technicians & Crew Department
                                                </h4>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                    Direction, Camera, Post-Production, Music, Art & Stunt technicians ready for hire
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {/* Direction Department Card */}
                                                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm">movie_filter</span>
                                                            Direction & AD Unit
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                                            {productionPackage.crew.direction.length} Available
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                                                        {productionPackage.crew.direction.slice(0, 4).map(u => (
                                                            <div
                                                                key={u.uid}
                                                                onClick={() => navigate(`/profile/${u.uid}`)}
                                                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#0a1c3e] cursor-pointer transition-colors"
                                                            >
                                                                <div className="size-6 rounded-full overflow-hidden shrink-0 border">
                                                                    <PostMedia src={u.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{u.displayName || 'Director'}</div>
                                                                    <div className="text-[10px] text-zinc-400 truncate">{u.customRole || u.role}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Camera Department Card */}
                                                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-cyan-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm">videocam</span>
                                                            Camera & DOP Unit
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                                                            {productionPackage.crew.camera.length} Available
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                                                        {productionPackage.crew.camera.slice(0, 4).map(u => (
                                                            <div
                                                                key={u.uid}
                                                                onClick={() => navigate(`/profile/${u.uid}`)}
                                                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#0a1c3e] cursor-pointer transition-colors"
                                                            >
                                                                <div className="size-6 rounded-full overflow-hidden shrink-0 border">
                                                                    <PostMedia src={u.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{u.displayName || 'DOP'}</div>
                                                                    <div className="text-[10px] text-zinc-400 truncate">{u.customRole || u.role}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Post-Production Department Card */}
                                                <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-sm">content_cut</span>
                                                            Editing & Sound Unit
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                            {productionPackage.crew.postProduction.length} Available
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                                                        {productionPackage.crew.postProduction.slice(0, 4).map(u => (
                                                            <div
                                                                key={u.uid}
                                                                onClick={() => navigate(`/profile/${u.uid}`)}
                                                                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-[#0a1c3e] cursor-pointer transition-colors"
                                                            >
                                                                <div className="size-6 rounded-full overflow-hidden shrink-0 border">
                                                                    <PostMedia src={u.photoURL || ''} fallbackType="USER_MALE" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{u.displayName || 'Editor'}</div>
                                                                    <div className="text-[10px] text-zinc-400 truncate">{u.customRole || u.role}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. LOCATIONS & STUDIOS SUB-SECTION (BUDGET-MATCHED) */}
                                    {(aiPackageDepartment === 'all' || aiPackageDepartment === 'locations') && (
                                        <div className="space-y-3 pt-3 border-t border-amber-500/15">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-blue-500 text-base">domain</span>
                                                        Budget-Matched Locations & Studios ({productionPackage.locationsAndStudios.matching.length})
                                                    </h4>
                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                        {productionPackage.parsed.locationQuery?.maxBudget
                                                            ? `Showing shooting properties strictly within budget ≤ ₹${productionPackage.parsed.locationQuery.maxBudget.toLocaleString('en-IN')}`
                                                            : 'Verified film shooting houses, havelis, sets & studio spaces'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {productionPackage.locationsAndStudios.matching.slice(0, activeTab === 'all' ? 4 : 12).map((loc) => {
                                                    const priceNum = parseFacilityPrice(loc.price);
                                                    const maxBudget = productionPackage.parsed.locationQuery?.maxBudget;
                                                    const isUnderBudget = maxBudget && priceNum && priceNum <= maxBudget;

                                                    return (
                                                        <div
                                                            key={loc.id}
                                                            onClick={() => navigate(`/booking/details/${loc.id}`)}
                                                            className="p-3.5 rounded-2xl bg-white dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex gap-3"
                                                        >
                                                            <div className="size-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#1e1f24]">
                                                                <PostMedia
                                                                    src={loc.image}
                                                                    fallbackType="FILM_SET"
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            </div>
                                                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                                            {loc.name}
                                                                        </h5>
                                                                        {isUnderBudget && (
                                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                                                                Under Budget
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-[13px] text-zinc-400">location_on</span>
                                                                        {loc.location}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-white/10 text-xs">
                                                                    <span className="font-black text-amber-500">{loc.price}</span>
                                                                    <span className="text-zinc-400 text-[11px] flex items-center gap-0.5">
                                                                        <span className="material-symbols-outlined text-[12px] text-amber-500">star</span>
                                                                        {loc.rating} ({loc.reviews})
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Empty State when in AI Package tab and no package assembled */}
                            {activeTab === 'ai_package' && !productionPackage && (
                                <EmptyState
                                    message="No AI package created yet"
                                    subMessage="Try searching queries like 'give me whole cast and crews list' or '25k budget old house near me'"
                                    icon="auto_awesome"
                                    actionLabel="Try Whole Cast & Crew Query"
                                    onAction={() => {
                                        setQuery('give me whole cast and crews list');
                                        triggerFullSearch('give me whole cast and crews list');
                                    }}
                                />
                            )}

                            {/* 1. TALENT & CREATORS SECTION */}
                            {(activeTab === 'all' || activeTab === 'people') && results.people.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-purple-500 text-lg">person</span>
                                            Talent & Filmmakers ({results.people.length})
                                        </h4>
                                        {activeTab === 'all' && results.people.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('people')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.people.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(activeTab === 'all' ? results.people.slice(0, 4) : results.people).map((person) => (
                                            <div
                                                key={person.uid}
                                                onClick={() => navigate(`/profile/${person.uid}`)}
                                                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="size-12 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                                                    <PostMedia
                                                        src={person.photoURL || ''}
                                                        fallbackType="USER_MALE"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                        {person.displayName || 'Unknown Creator'}
                                                    </h5>
                                                    <p className="text-xs text-purple-600 dark:text-purple-300 font-medium truncate">
                                                        {person.role || 'Filmmaker'}
                                                    </p>
                                                    {person.location && (
                                                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-0.5 mt-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                                                            {person.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="material-symbols-outlined text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 text-base transition-all shrink-0">
                                                    chevron_right
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 2. STUDIOS, FACILITIES & GEAR SECTION */}
                            {(activeTab === 'all' || activeTab === 'studios') && results.studios.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">domain</span>
                                            Studios & Equipment ({results.studios.length})
                                        </h4>
                                        {activeTab === 'all' && results.studios.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('studios')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.studios.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {(activeTab === 'all' ? results.studios.slice(0, 4) : results.studios).map((facility) => (
                                            <div
                                                key={facility.id}
                                                onClick={() => navigate(`/booking/details/${facility.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex gap-3"
                                            >
                                                <div className="size-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#18191d]">
                                                    <PostMedia
                                                        src={facility.image}
                                                        fallbackType="FILM_SET"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                            {facility.name}
                                                        </h5>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 shrink-0">
                                                            {facility.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[13px] text-zinc-400">location_on</span>
                                                        {facility.location}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs font-semibold mt-2 pt-1 border-t border-zinc-100 dark:border-white/10">
                                                        <span className="text-amber-500">{facility.price}</span>
                                                        <span className="text-zinc-400 flex items-center gap-0.5 text-[11px]">
                                                            <span className="material-symbols-outlined text-[12px] text-amber-500">star</span>
                                                            {facility.rating} ({facility.reviews})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 3. CINEMA WIRE & MOVIE REVIEWS SECTION */}
                            {(activeTab === 'all' || activeTab === 'news') && results.news.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-500 text-lg">newspaper</span>
                                            Cinema Wire & Reviews ({results.news.length})
                                        </h4>
                                        {activeTab === 'all' && results.news.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('news')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.news.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.news.slice(0, 4) : results.news).map((item) => {
                                            const isReview = item.category === 'review' || !!item.rating;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedNewsArticle(item)}
                                                    className="p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group flex gap-3.5"
                                                >
                                                    {item.thumbnail && (
                                                        <div className="size-16 sm:size-20 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#18191d]">
                                                            <PostMedia
                                                                src={item.thumbnail}
                                                                fallbackType="CINEMA_HALL"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                                                                {item.source}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-400">
                                                                • {formatNewsTime(item.timestamp)}
                                                            </span>
                                                            {isReview && (
                                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                                                    {item.rating || '★ REVIEW'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-snug line-clamp-2 group-hover:text-amber-500 transition-colors">
                                                            {item.title}
                                                        </h5>
                                                        {item.description && (
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* 4. FEED & COMMUNITY POSTS SECTION */}
                            {(activeTab === 'all' || activeTab === 'feed') && results.feed.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-500 text-lg">forum</span>
                                            Feed & Community Posts ({results.feed.length})
                                        </h4>
                                        {activeTab === 'all' && results.feed.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('feed')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.feed.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.feed.slice(0, 3) : results.feed).map((post) => (
                                            <div
                                                key={post.id}
                                                onClick={() => navigate('/showcase')}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <div className="size-9 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                                                        <PostMedia
                                                            src={post.authorImage || ''}
                                                            fallbackType="USER_MALE"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                                                            {post.author}
                                                        </h5>
                                                        <p className="text-[11px] text-zinc-400 truncate">
                                                            {post.role || 'Creator'}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Feed
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 line-clamp-3 leading-relaxed">
                                                    {post.content}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100 dark:border-white/10">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-red-500">favorite</span>
                                                        {post.likes || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                                        {post.comments || 0}
                                                    </span>
                                                    <span className="ml-auto text-amber-500 font-semibold group-hover:underline flex items-center gap-0.5">
                                                        View in Feed
                                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 5. JOBS & CASTINGS SECTION */}
                            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">work</span>
                                            Jobs & Castings ({results.jobs.length})
                                        </h4>
                                        {activeTab === 'all' && results.jobs.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('jobs')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.jobs.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.jobs.slice(0, 3) : results.jobs).map((job) => (
                                            <div
                                                key={job.id}
                                                onClick={() => navigate(`/job/${job.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="size-11 rounded-xl bg-zinc-100 dark:bg-[#18191d] border border-zinc-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {job.logo ? (
                                                            <img
                                                                src={job.logo}
                                                                className="w-full h-full object-cover"
                                                                alt={job.company}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-zinc-400 text-xl">work</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight truncate group-hover:text-amber-500 transition-colors">
                                                            {job.title}
                                                        </h5>
                                                        <p className="text-xs text-amber-500 font-semibold truncate">{job.company}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                                                        {job.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm text-zinc-400">work</span>
                                                        {job.type}
                                                    </span>
                                                    {job.salary && (
                                                        <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                                                            <span className="material-symbols-outlined text-sm">payments</span>
                                                            {job.salary}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 6. ARTICLES & BLOGS SECTION */}
                            {(activeTab === 'all' || activeTab === 'blogs') && results.blogs.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-cyan-500 text-lg">article</span>
                                            Journal & Articles ({results.blogs.length})
                                        </h4>
                                        {activeTab === 'all' && results.blogs.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab('blogs')}
                                                className="text-xs text-amber-500 font-bold hover:underline"
                                            >
                                                See All ({results.blogs.length})
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {(activeTab === 'all' ? results.blogs.slice(0, 3) : results.blogs).map((blog) => (
                                            <div
                                                key={blog.id}
                                                onClick={() => navigate(`/blog/${blog.id}`)}
                                                className="p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                            >
                                                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full mb-1.5 inline-block">
                                                    {blog.category}
                                                </span>
                                                <h5 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-amber-500 transition-colors">
                                                    {blog.title}
                                                </h5>
                                                <p className="text-xs text-zinc-400 mt-1">By {blog.author}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Total Zero Results Fallback */}
                            {totalResultsCount === 0 && (!productionPackage || totalAiPackageCount === 0) && (
                                <EmptyState
                                    message={`No results for "${query}"`}
                                    subMessage="Try checking your spelling or using broader keywords across creators, studios, news, or jobs."
                                    icon="search_off"
                                    actionLabel="Clear Search"
                                    onAction={handleClear}
                                />
                            )}
                        </>
                    )}

                    {/* 5. NEAR ME SECTION */}
                    {activeTab === 'nearme' && (
                        <section className="space-y-3">
                            <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">location_on</span>
                                Talent Near You (Within 50km)
                            </h4>

                            {locationLoading && (
                                <div className="flex justify-center py-12">
                                    <div className="size-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nearbyUsers.map((person) => (
                                        <div
                                            key={person.uid}
                                            onClick={() => navigate(`/profile/${person.uid}`)}
                                            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 hover:border-amber-500/40 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="size-11 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10">
                                                <PostMedia
                                                    src={person.photoURL || ''}
                                                    fallbackType="USER_MALE"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                                                    {person.displayName || 'Creator'}
                                                </h5>
                                                <p className="text-xs text-zinc-400 truncate">
                                                    {person.role || 'Professional'}
                                                    {person.location ? ` • ${person.location}` : ''}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-amber-500 text-lg shrink-0">
                                                location_on
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!locationLoading && nearbyUsers.length === 0 && userLocation && (
                                <EmptyState
                                    message="No creators found within 50km"
                                    subMessage="Try searching for major cities like Hyderabad, Chennai, Bengaluru, or Mumbai."
                                    icon="location_off"
                                />
                            )}

                            {!locationLoading && !userLocation && (
                                <div className="text-center py-12 px-4 rounded-2xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10">
                                    <span className="material-symbols-outlined text-4xl text-amber-500 mb-2">location_searching</span>
                                    <h5 className="text-sm font-bold text-zinc-900 dark:text-white">Enable Location</h5>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto mb-4">
                                        Discover local actors, directors, cinematographers, and crew members located near you.
                                    </p>
                                    <button
                                        onClick={getUserLocation}
                                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer"
                                    >
                                        Find Nearby Talent
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>

            {/* 6. FULL-SCREEN / POP-UP NEWS ARTICLE READER MODAL */}
            {selectedNewsArticle && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
                    onClick={() => setSelectedNewsArticle(null)}
                >
                    <div
                        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#1e1f24] border border-zinc-200 dark:border-white/10 shadow-2xl p-5 sm:p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedNewsArticle(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 dark:bg-white/10 text-zinc-700 dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer z-10"
                            title="Close"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>

                        {/* Thumbnail */}
                        {selectedNewsArticle.thumbnail && (
                            <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-4 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#18191d]">
                                <PostMedia
                                    src={selectedNewsArticle.thumbnail}
                                    fallbackType="CINEMA_HALL"
                                    className="w-full h-full object-cover"
                                />
                                {selectedNewsArticle.category === 'review' && (
                                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-400 font-black text-xs border border-amber-400/40 flex items-center gap-1 shadow-lg">
                                        <span className="material-symbols-outlined text-sm">star</span>
                                        <span>{selectedNewsArticle.rating || 'CERTIFIED REVIEW'}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Metadata Header */}
                        <div className="flex items-center gap-2 text-xs font-bold mb-2 flex-wrap">
                            <span className="text-red-500 uppercase tracking-wide">
                                {selectedNewsArticle.source}
                            </span>
                            <span className="text-zinc-400">• {formatNewsTime(selectedNewsArticle.timestamp)}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#18191d] text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 uppercase">
                                {selectedNewsArticle.industry}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-xl font-extrabold text-zinc-900 dark:text-white leading-snug">
                            {selectedNewsArticle.title}
                        </h3>

                        {/* Content */}
                        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-3.5 leading-relaxed whitespace-pre-line">
                            {selectedNewsArticle.content || selectedNewsArticle.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between gap-3">
                            <button
                                onClick={() => setSelectedNewsArticle(null)}
                                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-[#18191d] text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            <a
                                href={selectedNewsArticle.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                            >
                                <span>Read on {selectedNewsArticle.source}</span>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
