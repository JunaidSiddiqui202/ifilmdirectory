/**
 * rssNewsService.ts
 * Live RSS Feed Extractor, Auto-Sync & Review Classifier for South Indian Cinema
 * Caches news in localStorage and auto-syncs every 15-30 minutes.
 */

export interface NewsItem {
    id: string;
    title: string;
    link: string;
    pubDate: string;
    timestamp: number;
    source: string;
    sourceUrl?: string;
    description: string;
    content?: string;
    thumbnail?: string;
    category: 'news' | 'review';
    industry: 'telugu' | 'tamil' | 'malayalam' | 'kannada' | 'south';
    rating?: string; // e.g., "3.5/5"
}

export interface RSSFeedSource {
    id: string;
    name: string;
    url: string;
    industry: 'telugu' | 'tamil' | 'malayalam' | 'kannada' | 'south';
    enabled: boolean;
    isCustom?: boolean;
}

const STORAGE_KEYS = {
    CACHE: 'ifilm_rss_news_cache_v2',
    LAST_SYNC: 'ifilm_rss_last_sync_timestamp',
    FEEDS: 'ifilm_rss_sources_config_v2',
    AUTO_REFRESH_MINS: 'ifilm_rss_auto_refresh_minutes'
};

export const DEFAULT_FEEDS: RSSFeedSource[] = [
    {
        id: 'tracktollywood',
        name: 'TrackTollywood',
        url: 'https://tracktollywood.com/feed/',
        industry: 'telugu',
        enabled: true
    },
    {
        id: 'filmyfocus',
        name: 'Filmy Focus',
        url: 'https://filmyfocus.com/feed',
        industry: 'telugu',
        enabled: true
    },
    {
        id: 'onlykollywood',
        name: 'Only Kollywood',
        url: 'https://www.onlykollywood.com/feed/',
        industry: 'tamil',
        enabled: true
    },
    {
        id: 'google_south_news',
        name: 'South Cinema Wire (All)',
        url: 'https://news.google.com/rss/search?q=Tollywood+OR+Kollywood+OR+Mollywood+film+news&hl=en-IN&gl=IN&ceid=IN:en',
        industry: 'south',
        enabled: true
    },
    {
        id: 'google_south_reviews',
        name: 'South Movie Reviews',
        url: 'https://news.google.com/rss/search?q=Telugu+movie+review+OR+Tamil+movie+review+OR+Malayalam+movie+review&hl=en-IN&gl=IN&ceid=IN:en',
        industry: 'south',
        enabled: true
    }
];

// Fallback high quality cinema items for offline resilience
const SEED_BACKUP_ITEMS: NewsItem[] = [
    {
        id: 'seed-1',
        title: 'Nani Teams Up With 96 Director Prem Kumar for an Emotional Love Story',
        link: 'https://tracktollywood.com/',
        pubDate: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 25 * 60 * 1000,
        source: 'TrackTollywood',
        description: 'Natural Star Nani has officially signed an evocative romance drama helmed by C. Prem Kumar. Production kicks off next quarter with grand musical compositions.',
        content: `Natural Star Nani has officially signed an evocative romance drama helmed by C. Prem Kumar (acclaimed director of '96'). The project has sent waves of excitement across Tollywood as fans have long awaited a pure, soulful love story from the versatile actor.\n\nPre-production is underway in Hyderabad with musical compositions being finalized. The team is aiming for a picturesque monsoon shoot across coastal Andhra Pradesh and Tamil Nadu.\n\nIndustry insiders reveal that the emotional core of the film balances nostalgic romance with contemporary drama, promising to be one of Nani's most poignant cinematic outings to date.`,
        thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
        category: 'news',
        industry: 'telugu'
    },
    {
        id: 'seed-2',
        title: 'Dhanush’s D56: 20-Day Action Schedule Begins with High-Octane Sequences',
        link: 'https://www.onlykollywood.com/',
        pubDate: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 50 * 60 * 1000,
        source: 'Only Kollywood',
        description: 'Dhanush commenced shooting for his massive action entertainer in Chennai. International stunt choreographers have designed custom set pieces for this schedule.',
        content: `Dhanush has commenced shooting for his landmark high-octane action thriller, tentatively titled D56, in Chennai under stringent secrecy. A massive custom industrial set was erected on the city outskirts for an intensive 20-day stunt schedule.\n\nAcclaimed stunt directors from abroad are collaborating with local technicians to choreograph practical action sequences with zero computer-generated stunt doubles. The film features Dhanush in an intense, gritty transformation.\n\nThe music is composed by G.V. Prakash Kumar, who has already recorded two adrenaline-pumping tracks for the project. The film is eyeing a worldwide theatrical release later this year across Tamil, Telugu, and Hindi.`,
        thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
        category: 'news',
        industry: 'tamil'
    },
    {
        id: 'seed-3',
        title: 'Devara Movie Review: Jr NTR Powers Koratala Siva’s Coastal Action Saga',
        link: 'https://tracktollywood.com/',
        pubDate: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 110 * 60 * 1000,
        source: 'TrackTollywood',
        description: 'Jr NTR delivers a commanding dual performance backed by Anirudh’s thumping background score in this maritime revenge drama.',
        content: `Verdict: Jr NTR delivers a ferociously intense performance that anchors the maritime action drama through its highs.\n\nPlot & Highlights: Set across rugged coastal settlements, Devara follows the turbulent reign of maritime clans locked in betrayal and bloodshed. Jr NTR's screen presence in the sea combat sequences is breathtaking, demonstrating raw power and emotive depth.\n\nMusic & Direction: Anirudh Ravichander's background score elevates the adrenaline in every clash, while Rathnavelu's cinematography renders the dark seas with stunning scale. Saif Ali Khan provides an imposing antagonist counterweight.\n\nFinal Take: A grand, mass-appealing cinematic experience with monumental interval and climax sequences that will delight action cinema lovers across the country.`,
        thumbnail: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=450&fit=crop',
        category: 'review',
        industry: 'telugu',
        rating: '3.5/5'
    },
    {
        id: 'seed-4',
        title: 'Lokesh Kanagaraj Confirms Next Chapter of LCU with Kamal Haasan & Suriya',
        link: 'https://www.onlykollywood.com/',
        pubDate: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 140 * 60 * 1000,
        source: 'Only Kollywood',
        description: 'Director Lokesh Kanagaraj shared exciting details regarding the upcoming interconnected universe projects featuring Rolex and Agent Vikram.',
        content: `In a recent film festival interaction, director Lokesh Kanagaraj provided definitive confirmation that the LCU (Lokesh Cinematic Universe) will expand into its most ambitious phase yet.\n\nThe upcoming standalone Rolex film starring Suriya is currently in deep script development, setting up an explosive face-off against Kamal Haasan's Agent Vikram and Karthi's Dilli.\n\nLokesh highlighted that the interconnected lore will span two upcoming theatrical spectacles, uniting the biggest stars in South Indian cinema under one unified storyline. Fans across social media celebrated the revelation as production timelines were hinted for early next year.`,
        thumbnail: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&h=450&fit=crop',
        category: 'news',
        industry: 'tamil'
    },
    {
        id: 'seed-5',
        title: 'Aavesham Movie Review: Fahadh Faasil Unleashes Peak Entertainment in Bengaluru',
        link: 'https://news.google.com/',
        pubDate: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 180 * 60 * 1000,
        source: 'The Hindu Cinema',
        description: 'Fahadh Faasil’s eccentric gangster Ranga lights up the screen with uninhibited hilarity, backed by Sushin Shyam’s infectious energy.',
        content: `Verdict: Fahadh Faasil delivers an electrifying comedic tour de force in Jithu Madhavan's uproarious action comedy.\n\nThe Story: When three college students in Bengaluru seek local gang backing to settle scores with campus bullies, they cross paths with Ranga (Fahadh Faasil), a flamboyant Malayali gangster dressed in crisp white attire who craves friendship as much as dominance.\n\nPerformance: Fahadh completely lets loose, combining wild eccentricities with genuine warmth. Sushin Shyam's infectious score drives the film with relentless energy, turning simple comedic beats into theatrical frenzy.\n\nFinal Take: A wildly entertaining riot that reaffirms Malayalam cinema's supreme flair for blending genre thrills with authentic characters.`,
        thumbnail: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&h=450&fit=crop',
        category: 'review',
        industry: 'malayalam',
        rating: '4.0/5'
    },
    {
        id: 'seed-6',
        title: 'Kantara: A Legend Chapter 1 Wraps Crucial Forest Climax Schedule',
        link: 'https://filmyfocus.com/',
        pubDate: new Date(Date.now() - 220 * 60 * 1000).toISOString(),
        timestamp: Date.now() - 220 * 60 * 1000,
        source: 'Filmy Focus',
        description: 'Rishab Shetty has completed an intensive 40-day forest warfare sequence for the mythological prequel produced by Hombale Films.',
        content: `Actor-director Rishab Shetty has wrapped a demanding 40-day continuous schedule in the dense forests of Kundapura for the mythological magnum opus 'Kantara: A Legend Chapter 1'.\n\nProduced on a massive scale by Hombale Films, the prequel delves into the origins of the tribal deity and the folklore surrounding the sacred groves. Rishab underwent rigorous physical training in ancient Kalarippayattu and traditional martial arts for the sequences.\n\nThe production has utilized practical rain machines, custom tribal villages, and authentic indigenous tools to preserve historical realism. The film is being made for a worldwide multi-language theatrical release with cutting-edge visual effects.`,
        thumbnail: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=450&fit=crop',
        category: 'news',
        industry: 'kannada'
    }
];

class RSSNewsService {
    private defaultIntervalMinutes = 20;

    /**
     * Get configured RSS feed sources from storage or defaults
     */
    getFeeds(): RSSFeedSource[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.FEEDS);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Failed to parse RSS sources:', e);
        }
        return DEFAULT_FEEDS;
    }

    /**
     * Save feeds to local storage
     */
    saveFeeds(feeds: RSSFeedSource[]): void {
        localStorage.setItem(STORAGE_KEYS.FEEDS, JSON.stringify(feeds));
    }

    /**
     * Add a custom user RSS feed URL
     */
    addCustomFeed(newFeed: Omit<RSSFeedSource, 'id'>): RSSFeedSource {
        const feeds = this.getFeeds();
        const created: RSSFeedSource = {
            ...newFeed,
            id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            isCustom: true,
            enabled: true
        };
        const updated = [...feeds, created];
        this.saveFeeds(updated);
        return created;
    }

    /**
     * Toggle feed enabled state
     */
    toggleFeed(id: string, enabled: boolean): void {
        const feeds = this.getFeeds().map(f => f.id === id ? { ...f, enabled } : f);
        this.saveFeeds(feeds);
    }

    /**
     * Remove custom feed
     */
    removeFeed(id: string): void {
        const feeds = this.getFeeds().filter(f => f.id !== id);
        this.saveFeeds(feeds);
    }

    /**
     * Reset feeds to factory defaults
     */
    resetFeedsToDefault(): void {
        localStorage.removeItem(STORAGE_KEYS.FEEDS);
    }

    /**
     * Get auto-refresh interval in minutes (default 20 mins)
     */
    getAutoRefreshMinutes(): number {
        try {
            const val = localStorage.getItem(STORAGE_KEYS.AUTO_REFRESH_MINS);
            if (val) {
                const parsed = parseInt(val, 10);
                if (!isNaN(parsed) && parsed >= 5 && parsed <= 120) {
                    return parsed;
                }
            }
        } catch {
            // fallback
        }
        return this.defaultIntervalMinutes;
    }

    /**
     * Set auto-refresh interval in minutes
     */
    setAutoRefreshMinutes(minutes: number): void {
        localStorage.setItem(STORAGE_KEYS.AUTO_REFRESH_MINS, minutes.toString());
    }

    /**
     * Last sync timestamp
     */
    getLastSyncTime(): number {
        const val = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        return val ? parseInt(val, 10) : 0;
    }

    /**
     * Check if cache is older than the configured refresh interval
     */
    isCacheStale(): boolean {
        const lastSync = this.getLastSyncTime();
        if (!lastSync) return true;
        const intervalMs = this.getAutoRefreshMinutes() * 60 * 1000;
        return Date.now() - lastSync > intervalMs;
    }

    /**
     * Load cached news items from localStorage
     */
    getCachedNews(): NewsItem[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CACHE);
            if (raw) {
                const items: NewsItem[] = JSON.parse(raw);
                if (Array.isArray(items) && items.length > 0) {
                    items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    return items;
                }
            }
        } catch (e) {
            console.warn('Error reading news cache:', e);
        }
        return [...SEED_BACKUP_ITEMS].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    /**
     * Fetch news items: returns cached items immediately, and refreshes in background if stale
     */
    async getNews(forceRefresh: boolean = false): Promise<{ items: NewsItem[]; lastSync: number; isStale: boolean }> {
        const cached = this.getCachedNews();
        const lastSync = this.getLastSyncTime();
        const stale = this.isCacheStale();

        if (forceRefresh || stale || cached.length <= SEED_BACKUP_ITEMS.length) {
            try {
                const fresh = await this.syncAllFeeds();
                return {
                    items: fresh.length > 0 ? fresh : cached,
                    lastSync: Date.now(),
                    isStale: false
                };
            } catch (err) {
                console.error('Background sync failed, returning cached data:', err);
                return {
                    items: cached,
                    lastSync: lastSync || Date.now(),
                    isStale: true
                };
            }
        }

        return {
            items: cached,
            lastSync,
            isStale: false
        };
    }

    /**
     * Sync all enabled feeds, deduplicate, categorize, and cache
     */
    async syncAllFeeds(): Promise<NewsItem[]> {
        const feeds = this.getFeeds().filter(f => f.enabled);
        if (feeds.length === 0) {
            return this.getCachedNews();
        }

        const fetchPromises = feeds.map(feed => this.fetchSingleFeed(feed));
        const results = await Promise.allSettled(fetchPromises);

        let combined: NewsItem[] = [];
        for (const res of results) {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                combined = combined.concat(res.value);
            }
        }

        // If network failed completely, preserve cached or seed items
        if (combined.length === 0) {
            return this.getCachedNews();
        }

        // Merge with existing cached items to keep historical articles
        const existing = this.getCachedNews();
        const allItems = [...combined, ...existing];

        // Deduplicate by clean title / link
        const seen = new Set<string>();
        const deduplicated: NewsItem[] = [];

        for (const item of allItems) {
            const key = this.normalizeTitle(item.title);
            if (!seen.has(key) && key.length > 5) {
                seen.add(key);
                deduplicated.push(item);
            }
        }

        // Sort descending by timestamp
        deduplicated.sort((a, b) => b.timestamp - a.timestamp);

        // Keep top 120 most recent stories
        const finalItems = deduplicated.slice(0, 120);

        // Update storage
        try {
            localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(finalItems));
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (e) {
            console.warn('Storage quota exceeded for RSS cache:', e);
        }

        return finalItems;
    }

    /**
     * Fetch a single RSS feed via local proxy or rss2json fallback
     */
    private async fetchSingleFeed(feed: RSSFeedSource): Promise<NewsItem[]> {
        try {
            // Strategy 1: Local Vite proxy (works with raw XML, fast & zero CORS issues)
            const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });

            if (res.ok) {
                const xmlText = await res.text();
                const parsed = this.parseXmlFeed(xmlText, feed);
                if (parsed.length > 0) return parsed;
            }
        } catch {
            // Proxy failed or unavailable, proceed to Strategy 2
        }

        try {
            // Strategy 2: rss2json public endpoint
            const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(rss2JsonUrl, { signal: AbortSignal.timeout(9000) });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && Array.isArray(data.items)) {
                    return this.parseRss2JsonItems(data.items, feed, data.feed?.title);
                }
            }
        } catch {
            // Both strategies failed for this specific feed
        }

        return [];
    }

    /**
     * Parse raw RSS/Atom XML text
     */
    private parseXmlFeed(xmlText: string, feed: RSSFeedSource): NewsItem[] {
        const items: NewsItem[] = [];
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, 'text/xml');

            // Handle RSS <item> tags
            const rssItems = Array.from(doc.querySelectorAll('item'));
            if (rssItems.length > 0) {
                for (const el of rssItems) {
                    const title = this.cleanText(el.querySelector('title')?.textContent || '');
                    let link = el.querySelector('link')?.textContent || '';
                    if (!link) {
                        link = el.querySelector('guid')?.textContent || '';
                    }

                    if (!title || !link) continue;

                    const pubDateStr = el.querySelector('pubDate')?.textContent || el.querySelector('date')?.textContent || '';
                    const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();

                    const descRaw = el.querySelector('description')?.textContent || '';
                    const encodedNode = el.getElementsByTagNameNS('*', 'encoded')[0] ||
                                        el.getElementsByTagName('content:encoded')[0] ||
                                        el.getElementsByTagName('encoded')[0];
                    const contentRaw = encodedNode?.textContent || descRaw;
                    const content = this.cleanFullText(contentRaw || descRaw);
                    const description = this.cleanHtmlSnippet(descRaw || contentRaw);

                    // Extract image/thumbnail
                    let thumbnail = '';
                    const mediaContent = el.getElementsByTagNameNS('*', 'content')[0] || el.getElementsByTagName('media:content')[0];
                    if (mediaContent && mediaContent.getAttribute('url')) {
                        thumbnail = mediaContent.getAttribute('url') || '';
                    }
                    if (!thumbnail) {
                        const mediaThumb = el.getElementsByTagNameNS('*', 'thumbnail')[0] || el.getElementsByTagName('media:thumbnail')[0];
                        if (mediaThumb && mediaThumb.getAttribute('url')) {
                            thumbnail = mediaThumb.getAttribute('url') || '';
                        }
                    }
                    if (!thumbnail) {
                        const enclosure = el.querySelector('enclosure');
                        if (enclosure && (enclosure.getAttribute('type')?.startsWith('image') || enclosure.getAttribute('url')?.match(/\.(jpe?g|png|webp|gif)/i))) {
                            thumbnail = enclosure.getAttribute('url') || '';
                        }
                    }
                    if (!thumbnail) {
                        thumbnail = this.extractImageFromHtml(contentRaw || descRaw);
                    }
                    thumbnail = this.formatImageUrl(thumbnail);
                    if (!thumbnail) {
                        thumbnail = this.getFallbackImage(feed.industry, title);
                    }

                    const source = el.querySelector('source')?.textContent || feed.name;
                    const { category, rating, detectedIndustry } = this.classifyItem(title, content || description, feed.industry);

                    items.push({
                        id: `item_${Math.abs(this.hashCode(link + title))}`,
                        title,
                        link: link.trim(),
                        pubDate: pubDateStr || new Date().toISOString(),
                        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
                        source,
                        sourceUrl: feed.url,
                        description: description || 'Click to read full breaking coverage on the official publication.',
                        content: content || description,
                        thumbnail,
                        category,
                        industry: detectedIndustry,
                        rating
                    });
                }
                return items;
            }

            // Handle Atom <entry> tags (e.g. 123telugu atom)
            const atomEntries = Array.from(doc.querySelectorAll('entry'));
            if (atomEntries.length > 0) {
                for (const el of atomEntries) {
                    const title = this.cleanText(el.querySelector('title')?.textContent || '');
                    const linkEl = el.querySelector('link');
                    const link = linkEl?.getAttribute('href') || linkEl?.textContent || '';
                    if (!title || !link) continue;

                    const publishedStr = el.querySelector('published, updated')?.textContent || '';
                    const timestamp = publishedStr ? new Date(publishedStr).getTime() : Date.now();

                    const contentRaw = el.querySelector('content, summary')?.textContent || '';
                    const content = this.cleanFullText(contentRaw);
                    const description = this.cleanHtmlSnippet(contentRaw);

                    let thumbnail = this.extractImageFromHtml(contentRaw);
                    if (!thumbnail) {
                        thumbnail = this.getFallbackImage(feed.industry, title);
                    }

                    const { category, rating, detectedIndustry } = this.classifyItem(title, content || description, feed.industry);

                    items.push({
                        id: `atom_${Math.abs(this.hashCode(link + title))}`,
                        title,
                        link: link.trim(),
                        pubDate: publishedStr || new Date().toISOString(),
                        timestamp: isNaN(timestamp) ? Date.now() : timestamp,
                        source: feed.name,
                        sourceUrl: feed.url,
                        description: description || 'Click to read full coverage on official site.',
                        content: content || description,
                        thumbnail,
                        category,
                        industry: detectedIndustry,
                        rating
                    });
                }
            }
        } catch (err) {
            console.warn('XML parsing error for feed', feed.name, err);
        }
        return items;
    }

    /**
     * Parse items from rss2json response format
     */
    private parseRss2JsonItems(rawItems: any[], feed: RSSFeedSource, feedTitle?: string): NewsItem[] {
        return rawItems.map(item => {
            const title = this.cleanText(item.title || '');
            const link = item.link || item.guid || '';
            const pubDate = item.pubDate || new Date().toISOString();
            const timestamp = new Date(pubDate).getTime();
            const descRaw = item.description || '';
            const contentRaw = item.content || item.description || '';
            const content = this.cleanFullText(contentRaw || descRaw);
            const description = this.cleanHtmlSnippet(descRaw || contentRaw);

            let thumbnail = item.thumbnail || item.enclosure?.link || '';
            if (!thumbnail) {
                thumbnail = this.extractImageFromHtml(contentRaw || descRaw);
            }
            thumbnail = this.formatImageUrl(thumbnail);
            if (!thumbnail) {
                thumbnail = this.getFallbackImage(feed.industry, title);
            }

            const { category, rating, detectedIndustry } = this.classifyItem(title, content || description, feed.industry);

            let source = item.author || feedTitle || feed.name;
            if (source.includes('Google News') || source.length > 28 || source.includes(' OR ') || source.includes('"')) {
                const titleParts = title.split(' - ');
                if (titleParts.length > 1 && titleParts[titleParts.length - 1].length < 25) {
                    source = titleParts[titleParts.length - 1].trim();
                } else {
                    source = feed.name;
                }
            }

            return {
                id: `r2j_${Math.abs(this.hashCode(link + title))}`,
                title,
                link,
                pubDate,
                timestamp: isNaN(timestamp) ? Date.now() : timestamp,
                source,
                sourceUrl: feed.url,
                description,
                content: content || description,
                thumbnail,
                category,
                industry: detectedIndustry,
                rating
            };
        }).filter(item => item.title && item.link);
    }

    /**
     * Classify whether an item is a Movie Review or News, detect ratings and regional cinema industry
     */
    private classifyItem(title: string, desc: string, defaultIndustry: RSSFeedSource['industry']): {
        category: 'news' | 'review';
        rating?: string;
        detectedIndustry: RSSFeedSource['industry'];
    } {
        const combined = `${title} ${desc}`.toLowerCase();

        // 1. Review Detection
        const isReview = /\b(movie review|film review|review:|verdict|rating:|\brating\b|critic review|theatrical review|ott review)\b/i.test(title) ||
            /\b(movie review|ratings?:\s*\d(\.\d)?\/5)\b/i.test(desc);

        // 2. Rating extraction (e.g. 3.5/5, 3/5, 4/5)
        let rating: string | undefined;
        const ratingMatch = title.match(/(\d(?:\.\d)?)\s*\/\s*5/) || desc.match(/(?:rating|ratings?)\s*:?\s*(\d(?:\.\d)?)\s*\/\s*5/i);
        if (ratingMatch) {
            rating = `${ratingMatch[1]}/5`;
        } else if (isReview) {
            // Default placeholder rating if tagged as review
            rating = '★ Reviewed';
        }

        // 3. Industry Detection (if feed is 'south', detect specific language)
        let detectedIndustry = defaultIndustry;
        if (defaultIndustry === 'south') {
            if (/\b(telugu|tollywood|prabhas|allu arjun|mahesh babu|jr ntr|ram charan|pawan kalyan|nani|chiranjeevi|vijay deverakonda|balakrishna)\b/i.test(combined)) {
                detectedIndustry = 'telugu';
            } else if (/\b(tamil|kollywood|thalapathy vijay|ajith|rajinikanth|kamal haasan|suriya|dhanush|sivakarthikeyan|lokesh kanagaraj|vetrimaaran)\b/i.test(combined)) {
                detectedIndustry = 'tamil';
            } else if (/\b(malayalam|mollywood|mohanlal|mammootty|fahadh faasil|tovino|dulquer salmaan|prithviraj|nivin pauly)\b/i.test(combined)) {
                detectedIndustry = 'malayalam';
            } else if (/\b(kannada|sandalwood|yash|rishab shetty|rakshit shetty|kichcha sudeep|darshan|shivarajkumar|hombale)\b/i.test(combined)) {
                detectedIndustry = 'kannada';
            }
        }

        return {
            category: isReview ? 'review' : 'news',
            rating,
            detectedIndustry
        };
    }

    /**
     * Proxies WordPress images through Automattic Jetpack Photon CDN
     * to eliminate hotlink protection and CORS/referrer blocks
     */
    public formatImageUrl(url: string): string {
        if (!url) return '';
        // If already on photon CDN or external Unsplash image, keep as-is
        if (url.includes('.wp.com/') || url.includes('images.unsplash.com')) {
            return url;
        }
        // If WordPress upload, proxy via i0.wp.com
        if (url.includes('/wp-content/uploads/')) {
            const clean = url.replace(/^https?:\/\//i, '');
            return `https://i0.wp.com/${clean}`;
        }
        return url;
    }

    /**
     * Extract image URL from raw HTML, supporting data-orig-file, srcset, data-src, and standard src
     */
    private extractImageFromHtml(html: string): string {
        if (!html) return '';
        // 1. Check data-orig-file or data-src (often full high-resolution)
        const dataSrcMatch = html.match(/<img[^>]+(?:data-orig-file|data-src|data-lazy-src)=["'](https?:\/\/[^"']+)["']/i);
        if (dataSrcMatch && dataSrcMatch[1] && !dataSrcMatch[1].includes('1x1') && !dataSrcMatch[1].includes('pixel')) {
            return this.formatImageUrl(dataSrcMatch[1]);
        }
        // 2. Check srcset first image
        const srcsetMatch = html.match(/<img[^>]+srcset=["'](https?:\/\/[^"'\s,]+)/i);
        if (srcsetMatch && srcsetMatch[1] && !srcsetMatch[1].includes('1x1')) {
            return this.formatImageUrl(srcsetMatch[1]);
        }
        // 3. Check standard src
        const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            const url = imgMatch[1];
            if (!url.includes('1x1') && !url.includes('favicon') && !url.includes('pixel')) {
                return this.formatImageUrl(url);
            }
        }
        return '';
    }

    /**
     * Curated high quality cinematic fallback images based on industry
     */
    private getFallbackImage(_industry: string, title: string): string {
        const fallbacks = [
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop',
            'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&h=450&fit=crop',
            'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
            'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800&h=450&fit=crop'
        ];
        const idx = Math.abs(this.hashCode(title)) % fallbacks.length;
        return fallbacks[idx];
    }

    private cleanText(str: string): string {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&#038;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#8230;/g, '...')
            .replace(/&hellip;/g, '...')
            .replace(/&#\d+;/g, '')
            .trim();
    }

    private cleanFullText(html: string): string {
        if (!html) return '';
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
            .replace(/<\/p>|<br\s*\/?>|<li>|<\/div>|<\/h[1-6]>/gi, '\n\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#8230;/g, '')
            .replace(/&hellip;/g, '')
            .replace(/The post .* appeared first on .*/gi, '')
            .replace(/\[\s*(?:\.{3}|…|&#8230;|&hellip;)?\s*\]/g, '')
            .replace(/\s+(?:\.{3}|…)\s*$/g, '')
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            .trim();
    }

    private cleanHtmlSnippet(html: string): string {
        if (!html) return '';
        const cleaned = html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&#8230;/g, '')
            .replace(/&hellip;/g, '')
            .replace(/The post .* appeared first on .*/gi, '')
            .replace(/\[\s*(?:\.{3}|…|&#8230;|&hellip;)?\s*\]/g, '')
            .replace(/\s+(?:\.{3}|…)\s*$/g, '')
            .trim();
        return cleaned.length > 280 ? cleaned.slice(0, 280).trim() + '...' : cleaned;
    }

    private normalizeTitle(title: string): string {
        return title.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private hashCode(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }
}

export const rssNewsService = new RSSNewsService();
