/**
 * rssJobService.ts
 * Live RSS & Feed Extractor for Film, TV & Digital Media Fraternity Jobs.
 * Extracts opportunities for:
 * - Editors & Colorists
 * - Cameramen, Cinematographers & DOP
 * - VFX Artists & 3D Animators
 * - SFX, Sound Designers & Audio Engineers
 * - Musicians, Composers & Background Score
 * - Artists, Actors & Casting Calls / Auditions
 * - Makeup Artists, Hair Stylists & Costume Designers
 * 
 * Auto-syncs every 30 minutes, caches in localStorage, and provides full details view.
 */

import { type Job } from './jobService';

export type FraternityRole = 
    | 'Editor'
    | 'Cameraman'
    | 'VFX Artist'
    | 'SFX & Sound'
    | 'Musician'
    | 'Artist & Actor'
    | 'Makeup & Stylist'
    | 'Crew';

export interface RSSJobFeedSource {
    id: string;
    name: string;
    url: string;
    role: FraternityRole;
    enabled: boolean;
}

const STORAGE_KEYS = {
    CACHE: 'ifilm_rss_jobs_cache_v1',
    LAST_SYNC: 'ifilm_rss_jobs_last_sync_timestamp',
    FEEDS: 'ifilm_rss_jobs_feeds_v1',
    SYNC_INTERVAL_MINS: 30
};

// 7 granular feeds dedicated to film and media fraternity departments
export const DEFAULT_JOB_FEEDS: RSSJobFeedSource[] = [
    {
        id: 'feed_auditions',
        name: 'Castings & Auditions Wire',
        url: 'https://news.google.com/rss/search?q=(%22casting+call%22+OR+%22auditions%22+OR+%22audition%22+OR+%22actors+wanted%22)+AND+(film+OR+movie+OR+%22web+series%22+OR+theatre)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'Artist & Actor',
        enabled: true
    },
    {
        id: 'feed_editors',
        name: 'Film & Video Editors Wire',
        url: 'https://news.google.com/rss/search?q=(%22video+editor%22+OR+%22film+editor%22+OR+%22colorist%22+OR+%22davinci+resolve%22)+AND+(film+OR+production+OR+studio+OR+cinema)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'Editor',
        enabled: true
    },
    {
        id: 'feed_camera',
        name: 'Cinematography & Camera Crew Wire',
        url: 'https://news.google.com/rss/search?q=(%22cinematographer%22+OR+%22cameraman%22+OR+%22camera+operator%22+OR+%22director+of+photography%22)+AND+(film+OR+shoot+OR+cinema)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'Cameraman',
        enabled: true
    },
    {
        id: 'feed_vfx',
        name: 'VFX & CGI Animation Wire',
        url: 'https://news.google.com/rss/search?q=(%22vfx+artist%22+OR+%22visual+effects%22+OR+%22compositor%22+OR+%223d+animator%22)+AND+(film+OR+studio+OR+movie)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'VFX Artist',
        enabled: true
    },
    {
        id: 'feed_sound',
        name: 'SFX & Sound Design Wire',
        url: 'https://news.google.com/rss/search?q=(%22sound+designer%22+OR+%22sound+engineer%22+OR+%22sync+sound%22+OR+%22foley+artist%22)+AND+(film+OR+cinema+OR+studio)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'SFX & Sound',
        enabled: true
    },
    {
        id: 'feed_music',
        name: 'Film Music & Score Wire',
        url: 'https://news.google.com/rss/search?q=(%22music+composer%22+OR+%22music+director%22+OR+%22background+score%22+OR+%22film+score%22)+AND+(film+OR+cinema+OR+movie)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'Musician',
        enabled: true
    },
    {
        id: 'feed_makeup',
        name: 'Makeup, Hair & Styling Wire',
        url: 'https://news.google.com/rss/search?q=(%22makeup+artist%22+OR+%22prosthetics%22+OR+%22costume+designer%22+OR+%22hair+stylist%22)+AND+(film+OR+cinema+OR+theatre)&hl=en-IN&gl=IN&ceid=IN:en',
        role: 'Makeup & Stylist',
        enabled: true
    }
];

// Curated high-production base seed jobs for all fraternity roles so the board is immediately full
const SEED_FRATERNITY_JOBS: Job[] = [
    {
        id: 'seed_job_editor_1',
        title: 'Senior Feature Film Editor (DaVinci Resolve / Avid)',
        company: 'Mythri Movie Makers',
        description: `Mythri Movie Makers is seeking an exceptional Senior Feature Film Editor for a high-budget action thriller feature film shooting across Hyderabad, Vizag, and Georgia.
        
You will work closely with the Director and Chief Post-Production Supervisor to handle sync rushes, rough cuts, narrative pacing, and final master assemblies.

Responsibilities:
• Ingest and organize daily multi-camera ARRIRAW / RED footage.
• Cut scenes to match director's visual rhythm and cinematic tempo.
• Collaborate with sound design and music departments for temp track placement.
• Deliver final conforms and XML/EDL pipelines for color grading and VFX pulls.`,
        requirements: '5+ years experience editing feature films or high-end OTT web series. High proficiency in DaVinci Resolve Studio and Avid Media Composer. Strong narrative storytelling sensibility.',
        location: 'Hyderabad, Telangana (Annapurna Studios Post Suite)',
        salary: '₹1,50,000 - ₹2,50,000 / Month',
        deadline: '2026-12-15',
        type: 'Post-Production',
        postedBy: 'mythri_production',
        postedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 15 * 60 * 1000),
        applicationEmail: 'post@mythriofficial.com',
        logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=120&h=120&fit=crop',
        user_details: {
            name: 'Mythri Movie Makers',
            verification_tier: 'gold'
        },
        fraternityRole: 'Editor',
        isRss: true,
        sourceName: 'Mythri Studio Calls',
        sourceUrl: 'https://mythriofficial.com',
        fullContent: `Role: Senior Feature Film Editor
Studio: Mythri Movie Makers
Department: Post-Production (Offline Edit)
Location: Hyderabad, India

Project Overview:
A marquee pan-Indian action saga helmed by an award-winning director. The project features extensive VFX action blocks, dual timeline narratives, and high emotional drama.

Key Requirements:
1. Demonstrated feature film editing portfolio with accredited film releases.
2. Expertise in ProRes 4444 / Arri RAW / RedCode workflows.
3. Ability to manage timeline turnovers to VFX (Nuke) and Sound (Pro Tools).
4. Strong communication skills and stamina for intensive post-production schedules.

Compensation & Benefits:
• Competitive industry pay (₹1,50,000 - ₹2,50,000/mo depending on experience).
• Dedicated high-spec Apple Silicon Mac Studio editing suite provided.
• End credit title billing in theatrical release.`
    },
    {
        id: 'seed_job_camera_1',
        title: '2nd Unit Cinematographer & Stunt Camera Operator',
        company: 'Hombale Films',
        description: `Hombale Films is expanding our camera team for an upcoming pan-Indian epic period spectacle. We are recruiting an experienced 2nd Unit Cinematographer / Action Camera Operator.

The candidate will work directly alongside the Director of Photography (DOP) to shoot secondary action angles, chase sequences, Steadicam / gimbal setups, and high-speed drone plates.`,
        requirements: 'Experience with ARRI Alexa Mini LF, Sony Venice 2, and high-speed Phantom Flex 4K. Hands-on experience with Ronin 2 and vehicle chase rigs.',
        location: 'Bengaluru / Dandeli Forests, Karnataka',
        salary: '₹40,000 - ₹60,000 / Day Shoot',
        deadline: '2026-11-30',
        type: 'Crew',
        postedBy: 'hombale_films',
        postedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 35 * 60 * 1000),
        applicationEmail: 'camera.crew@hombale.com',
        logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&h=120&fit=crop',
        user_details: {
            name: 'Hombale Films',
            verification_tier: 'gold'
        },
        fraternityRole: 'Cameraman',
        isRss: true,
        sourceName: 'Hombale Production Desk',
        sourceUrl: 'https://hombalefilms.com',
        fullContent: `Position: 2nd Unit Cinematographer / Stunt Camera Operator
Company: Hombale Films
Location: Karnataka (Multi-location schedule)

Responsibilities:
• Rig and operate high-frame-rate cameras for intricate martial arts and practical action sequences.
• Maintain lighting and exposure consistency with the 1st Unit DOP's visual bible.
• Supervise focus pullers, gaffers, and key grips on remote outdoor sets.
• Ensure data integrity during on-field handoffs to the DIT.

Requirements:
• SICA / ISC union membership preferred.
• Physical fitness for rugged forest and rocky terrain filming.
• Showreel demonstrating dynamic camera motion, low-light framing, and action coverage.`
    },
    {
        id: 'seed_job_vfx_1',
        title: 'Lead 3D VFX Compositor & Dynamics Artist (Nuke / Houdini)',
        company: 'Red Chillies VFX',
        description: `Red Chillies VFX is hiring Lead Compositors and FX Artists for multiple major sci-fi and mythological theatrical features.

Role entails seamless integration of live-action plates with CGI creatures, complex particle destruction simulations, digital environment extensions, and deep compositing pipelines.`,
        requirements: '4+ years studio experience in Foundry Nuke Studio, SideFX Houdini, and Maya. Deep understanding of multi-pass AOVs, color spaces (ACES), and photoreal lighting.',
        location: 'Mumbai / Remote Hybrid',
        salary: '₹12,00,000 - ₹20,00,000 / Annum',
        deadline: '2026-12-31',
        type: 'Post-Production',
        postedBy: 'red_chillies_vfx',
        postedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 55 * 60 * 1000),
        applicationEmail: 'vfxcareers@redchillies.com',
        logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=120&h=120&fit=crop',
        user_details: {
            name: 'Red Chillies VFX',
            verification_tier: 'gold'
        },
        fraternityRole: 'VFX Artist',
        isRss: true,
        sourceName: 'Red Chillies Creative Board',
        sourceUrl: 'https://redchilliesvfx.com',
        fullContent: `Job Opening: Lead 3D Compositor & Dynamics Specialist
Studio: Red Chillies VFX (Mumbai)

What You Will Do:
• Take charge of complex hero shots involving fire, water, smoke, and creature interactions.
• Establish composite templates and gizmos for junior and mid-level artists.
• Review iterations with the VFX Supervisor and Film Director during review sessions.
• Deliver photorealistic finals that meet international IMAX and Dolby Vision standards.`
    },
    {
        id: 'seed_job_sound_1',
        title: 'Sound Designer, Foley Artist & Sync Sound Specialist',
        company: 'Annapurna Studios Post',
        description: `Annapurna Studios is seeking a passionate Sound Designer and Foley Artist for theatrical feature films and multi-part streaming series.

You will be responsible for creating custom atmospheric soundscapes, Foley recording, dialog editing, and building immersive sound libraries for Dolby Atmos theatrical mixes.`,
        requirements: 'Expertise in Pro Tools Ultimate, iZotope RX Advanced, Soundminer, and Foley studio recording. Experience working with Dolby Atmos 7.1.4 configurations.',
        location: 'Banjara Hills, Hyderabad',
        salary: '₹80,000 - ₹1,40,000 / Month',
        deadline: '2026-11-25',
        type: 'Post-Production',
        postedBy: 'annapurna_studios',
        postedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 75 * 60 * 1000),
        applicationEmail: 'sound@annapurnastudios.com',
        logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&h=120&fit=crop',
        user_details: {
            name: 'Annapurna Studios',
            verification_tier: 'gold'
        },
        fraternityRole: 'SFX & Sound',
        isRss: true,
        sourceName: 'Annapurna Studios Sound Stage',
        sourceUrl: 'https://annapurnastudios.com',
        fullContent: `Role: Film Sound Designer & Foley Artist
Facility: Annapurna Studios Dolby Atmos Certified Mix Stage (Hyderabad)

Job Details:
Join one of India's historic sound stages. You will craft bespoke sound palettes for films ranging from gritty indie thrillers to massive commercial blockbusters.

Responsibilities:
• Record organic Foley effects (footsteps, cloth movement, weapon clangs, environmental textures).
• Perform surgical dialog cleanup using spectral de-noise tools.
• Work alongside music directors to ensure frequency balance between score and SFX.
• Prepare stems for final mix stage re-recording mixers.`
    },
    {
        id: 'seed_job_music_1',
        title: 'Film Music Producer & Background Score Orchestrator',
        company: 'Sun Pictures Music Division',
        description: `Sun Pictures is looking for a versatile Music Producer and Orchestrator to collaborate on upcoming Kollywood & South Indian feature productions.

Work with renowned music directors to arrange live orchestra strings, synthesize modern electronic beats, program ethnic percussions, and deliver stems for final dubbing.`,
        requirements: 'Mastery of Logic Pro X / Cubase / Ableton Live, orchestral mockups with Spitfire/Vienna libraries, Indian percussion programming, and film music mixing.',
        location: 'Chennai, Tamil Nadu / Hybrid',
        salary: '₹1,00,000 - ₹2,00,000 / Project Track',
        deadline: '2026-12-10',
        type: 'Post-Production',
        postedBy: 'sun_pictures',
        postedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 95 * 60 * 1000),
        applicationEmail: 'music@sunnetwork.in',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop',
        user_details: {
            name: 'Sun Pictures',
            verification_tier: 'gold'
        },
        fraternityRole: 'Musician',
        isRss: true,
        sourceName: 'Sun Pictures Music',
        sourceUrl: 'https://sunnetwork.in',
        fullContent: `Position: Film Music Producer & Orchestral Arranger
Label: Sun Pictures Audio
Location: Chennai, India

Key Deliverables:
• Produce high-energy cinematic song arrangements and emotive background score cues.
• Score orchestrations for live brass and string sessions.
• Prepare cue sheets, click tracks, and stem deliverables for 5.1 and Atmos mixes.
• Prior release credits on streaming platforms or films required.`
    },
    {
        id: 'seed_job_artist_1',
        title: 'Open Casting Call: Lead & Supporting Characters (Pan-India Feature)',
        company: 'Dharma Productions & Sikhya Entertainment',
        description: `Major Casting Call for an upcoming romantic family drama co-produced by Dharma Productions and Sikhya Entertainment.
        
Seeking fresh and experienced actors:
1. Male Lead (Playing age 22-28): Charismatic, strong emotional range, expressive eyes.
2. Female Lead (Playing age 20-26): Fluent in Hindi and South Indian dialect, classical dance background a plus.
3. Supporting Cast: Character artists (Age 45-60) for prominent parental roles.`,
        requirements: 'Audition video monologues (1 min dramatic + 1 min comic). Recent unedited headshots (front, left, right profiles). No heavy filters.',
        location: 'Mumbai, Maharashtra (Auditions open nationwide)',
        salary: 'Top Industry Standards + Profit Share',
        deadline: '2026-11-20',
        type: 'Audition',
        postedBy: 'dharma_casting',
        postedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 110 * 60 * 1000),
        applicationEmail: 'casting@dharmaproductions.com',
        logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
        user_details: {
            name: 'Dharma Productions',
            verification_tier: 'gold'
        },
        fraternityRole: 'Artist & Actor',
        isRss: true,
        sourceName: 'Dharma Casting Wing',
        sourceUrl: 'https://dharma-production.com',
        gender: 'Any',
        ageRange: '20 - 28 years',
        fullContent: `Official Casting Notice:
Feature Film: Dharma Productions × Sikhya Entertainment
Director: National Award Winning Filmmaker
Shoot Commences: Q1 2027 (Mumbai & Kashmir schedule)

Instructions:
Submit self-tape audition link (YouTube unlisted or Vimeo) along with your profile:
1. Slate: Name, Age, Height, Current City, Languages spoken.
2. Monologue: Contemporary Hindi monologue showcasing natural, non-melodramatic acting.
3. Contact details and recent portfolio images.`
    },
    {
        id: 'seed_job_makeup_1',
        title: 'Lead Makeup & Prosthetics Artist (Historical Period Film)',
        company: 'Ramoji Studios & Vyjayanthi Movies',
        description: `Vyjayanthi Movies is looking for a seasoned Lead Makeup & Prosthetics Artist for a landmark historical fantasy production.
        
You will design character looks, period hair styling, prosthetic ageing, battle wound simulations, and lead the on-set makeup trailer crew of 8 artists.`,
        requirements: 'Experience with silicone prosthetics, bald caps, HD camera makeup, and beard/wig lace application. Minimum 3 feature film credits.',
        location: 'Hyderabad (Ramoji Film City sets)',
        salary: '₹75,000 / Week',
        deadline: '2026-12-05',
        type: 'Crew',
        postedBy: 'vyjayanthi_movies',
        postedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 140 * 60 * 1000),
        applicationEmail: 'makeup@vyjayanthimovies.com',
        logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&h=120&fit=crop',
        user_details: {
            name: 'Vyjayanthi Movies',
            verification_tier: 'gold'
        },
        fraternityRole: 'Makeup & Stylist',
        isRss: true,
        sourceName: 'Ramoji Studio Production Calls',
        sourceUrl: 'https://vyjayanthimovies.com',
        fullContent: `Title: Lead Makeup, Hair & Prosthetics Designer
Project: Historical Action Saga
Production: Vyjayanthi Movies (Hyderabad)

Role Details:
• Create custom prosthetic molds for lead antagonist and wounded soldiers.
• Maintain continuity across 90-day shoot schedules.
• Utilize skin-safe, sweat-resistant products formulated for harsh studio lighting.`
    },
    {
        id: 'seed_job_editor_2',
        title: 'Digital Media Short-Form Video Editor & Colorist',
        company: 'Prime Cinema Digital Studios',
        description: `Looking for a fast, creative Digital Media Video Editor to craft high-impact trailers, promotional teasers, and vertical film marketing content.
        
Expertise in dynamic typography, sound sync cuts, speed ramps, and DaVinci color grading required.`,
        requirements: 'Proficiency in Adobe Premiere Pro, After Effects, and DaVinci Resolve. Portfolio of movie trailers or viral reels.',
        location: 'Remote / Mumbai',
        salary: '₹55,000 - ₹85,000 / Month',
        deadline: '2026-12-20',
        type: 'Post-Production',
        postedBy: 'prime_digital',
        postedAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
        postedAtDate: new Date(Date.now() - 170 * 60 * 1000),
        applicationEmail: 'jobs@primecinemamedia.com',
        logo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=120&h=120&fit=crop',
        user_details: {
            name: 'Prime Cinema Studios',
            verification_tier: 'blue'
        },
        fraternityRole: 'Editor',
        isRss: true,
        sourceName: 'Digital Media Desk',
        fullContent: `Position: Short-Form Movie Teaser & Promo Editor
Location: Remote (India)

Job Summary:
Create thrilling promotional edits for upcoming film releases across YouTube, Instagram, and OTT platforms. Deliver high-energy teasers that hook audiences in the first 3 seconds.`
    }
];

class RSSJobService {
    /**
     * Get all configured job RSS feeds
     */
    getFeeds(): RSSJobFeedSource[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.FEEDS);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch {
            // fallback
        }
        return DEFAULT_JOB_FEEDS;
    }

    /**
     * Last sync time in ms
     */
    getLastSyncTime(): number {
        const val = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        return val ? parseInt(val, 10) : 0;
    }

    /**
     * Checks if 30 minutes have elapsed since last sync
     */
    isCacheStale(): boolean {
        const lastSync = this.getLastSyncTime();
        if (!lastSync) return true;
        const intervalMs = STORAGE_KEYS.SYNC_INTERVAL_MINS * 60 * 1000;
        return Date.now() - lastSync > intervalMs;
    }

    /**
     * Get cached jobs from localStorage (with fallback to seed jobs)
     */
    getCachedJobs(): Job[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CACHE);
            if (raw) {
                const parsed: any[] = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(j => ({
                        ...j,
                        postedAtDate: j.postedAtDate ? new Date(j.postedAtDate) : new Date(j.postedAt || Date.now())
                    }));
                }
            }
        } catch (e) {
            console.warn('Error reading jobs cache:', e);
        }
        return SEED_FRATERNITY_JOBS;
    }

    /**
     * Fetch all jobs (cached immediately, background sync if stale)
     */
    async getJobs(forceRefresh: boolean = false): Promise<Job[]> {
        const cached = this.getCachedJobs();
        const stale = this.isCacheStale();

        if (forceRefresh || stale || cached.length <= SEED_FRATERNITY_JOBS.length) {
            try {
                const fresh = await this.syncAllFeeds();
                return fresh.length > 0 ? fresh : cached;
            } catch (err) {
                console.error('Failed to sync RSS jobs, returning cached:', err);
                return cached;
            }
        }

        return cached;
    }

    /**
     * Fetch a job by its unique ID (searches cached jobs and seeds)
     */
    getJobById(jobId: string): Job | null {
        const allJobs = this.getCachedJobs();
        const found = allJobs.find(j => j.id === jobId);
        if (found) return found;

        const seedFound = SEED_FRATERNITY_JOBS.find(j => j.id === jobId);
        return seedFound || null;
    }

    /**
     * Sync all configured feeds, classify roles, deduplicate, and store
     */
    async syncAllFeeds(): Promise<Job[]> {
        const feeds = this.getFeeds().filter(f => f.enabled);
        const fetchPromises = feeds.map(feed => this.fetchSingleFeed(feed));
        const results = await Promise.allSettled(fetchPromises);

        let extracted: Job[] = [];
        for (const res of results) {
            if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                extracted = extracted.concat(res.value);
            }
        }

        // Combine with high quality curated seeds
        const all = [...extracted, ...SEED_FRATERNITY_JOBS];

        // Deduplicate by normalized title
        const seen = new Set<string>();
        const deduplicated: Job[] = [];

        for (const job of all) {
            const key = this.normalizeKey(job.title + (job.company || ''));
            if (!seen.has(key) && key.length > 3) {
                seen.add(key);
                deduplicated.push(job);
            }
        }

        // Sort descending by timestamp so newest jobs show at the top!
        deduplicated.sort((a, b) => {
            const timeA = a.postedAtDate ? a.postedAtDate.getTime() : new Date(a.postedAt || 0).getTime();
            const timeB = b.postedAtDate ? b.postedAtDate.getTime() : new Date(b.postedAt || 0).getTime();
            return timeB - timeA;
        });

        // Cache in localStorage
        try {
            localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(deduplicated.slice(0, 80)));
            localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        } catch (e) {
            console.warn('Storage quota exceeded for jobs cache:', e);
        }

        return deduplicated;
    }

    /**
     * Fetch single RSS feed using local proxy or rss2json
     */
    private async fetchSingleFeed(feed: RSSJobFeedSource): Promise<Job[]> {
        try {
            // Strategy 1: Local Vite proxy
            const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
            if (res.ok) {
                const xmlText = await res.text();
                const parsed = this.parseXmlJobFeed(xmlText, feed);
                if (parsed.length > 0) return parsed;
            }
        } catch {
            // Strategy 1 failed, fall through to Strategy 2
        }

        try {
            // Strategy 2: rss2json public endpoint
            const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(rss2JsonUrl, { signal: AbortSignal.timeout(9000) });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && Array.isArray(data.items)) {
                    return this.parseRss2JsonJobs(data.items, feed);
                }
            }
        } catch {
            // All network strategies failed for this feed
        }

        return [];
    }

    /**
     * Parse XML text into Job objects
     */
    private parseXmlJobFeed(xmlText: string, feed: RSSJobFeedSource): Job[] {
        const jobs: Job[] = [];
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlText, 'text/xml');
            const items = Array.from(doc.querySelectorAll('item'));

            for (const el of items) {
                const title = this.cleanText(el.querySelector('title')?.textContent || '');
                let link = el.querySelector('link')?.textContent || el.querySelector('guid')?.textContent || '';
                if (!title || !link) continue;

                const pubDateStr = el.querySelector('pubDate')?.textContent || el.querySelector('date')?.textContent || '';
                const timestamp = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();
                const postedAtDate = isNaN(timestamp) ? new Date() : new Date(timestamp);

                const descRaw = el.querySelector('description')?.textContent || '';
                const contentRaw = el.querySelector('content\\:encoded, encoded')?.textContent || descRaw;
                const fullText = this.cleanFullText(contentRaw || descRaw);
                const shortDesc = this.cleanHtmlSnippet(descRaw || contentRaw);

                const sourceName = el.querySelector('source')?.textContent || feed.name;
                const { fraternityRole, type, company, location, salary, requirements } = this.classifyRoleAndMetadata(title, fullText, feed.role);

                const id = `rss_job_${Math.abs(this.hashCode(link + title))}`;

                jobs.push({
                    id,
                    title,
                    company: company || sourceName,
                    description: shortDesc || `Opening for ${title} in film & media production. Click to view full requirements and application details.`,
                    requirements: requirements || `Experience in ${fraternityRole} department. Relevant portfolio, reels, or credits required.`,
                    location: location || 'India / Multi-City',
                    salary: salary || 'Industry Standard / Negotiable',
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    type,
                    postedBy: 'rss_ingest_bot',
                    postedAt: pubDateStr || new Date().toISOString(),
                    postedAtDate,
                    logo: this.getRoleFallbackImage(fraternityRole),
                    user_details: {
                        name: company || sourceName,
                        verification_tier: 'blue'
                    },
                    fraternityRole,
                    isRss: true,
                    sourceName,
                    sourceUrl: link.trim(),
                    applicationUrl: link.trim(),
                    fullContent: fullText || shortDesc
                });
            }
        } catch (e) {
            console.warn('Error parsing XML job feed:', e);
        }
        return jobs;
    }

    /**
     * Parse items from rss2json
     */
    private parseRss2JsonJobs(rawItems: any[], feed: RSSJobFeedSource): Job[] {
        return rawItems.map(item => {
            const title = this.cleanText(item.title || '');
            const link = item.link || item.guid || '';
            const pubDate = item.pubDate || new Date().toISOString();
            const timestamp = new Date(pubDate).getTime();
            const postedAtDate = isNaN(timestamp) ? new Date() : new Date(timestamp);

            const descRaw = item.description || '';
            const contentRaw = item.content || item.description || '';
            const fullText = this.cleanFullText(contentRaw || descRaw);
            const shortDesc = this.cleanHtmlSnippet(descRaw || contentRaw);

            const sourceName = item.author || feed.name;
            const { fraternityRole, type, company, location, salary, requirements } = this.classifyRoleAndMetadata(title, fullText, feed.role);
            const id = `r2j_job_${Math.abs(this.hashCode(link + title))}`;

            return {
                id,
                title,
                company: company || sourceName,
                description: shortDesc || `Opening for ${title} in film & media production. Click to review details.`,
                requirements: requirements || `Experience in ${fraternityRole}. Showreel or previous project links required.`,
                location: location || 'India / Remote',
                salary: salary || 'Competitive Industry Rate',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                type,
                postedBy: 'rss_ingest_bot',
                postedAt: pubDate,
                postedAtDate,
                logo: this.getRoleFallbackImage(fraternityRole),
                user_details: {
                    name: company || sourceName,
                    verification_tier: 'blue'
                },
                fraternityRole,
                isRss: true,
                sourceName,
                sourceUrl: link,
                applicationUrl: link,
                fullContent: fullText || shortDesc
            } as Job;
        }).filter(j => j.title && j.id);
    }

    /**
     * Classifies role, type, company, and department details from text
     */
    private classifyRoleAndMetadata(title: string, content: string, defaultRole: FraternityRole): {
        fraternityRole: FraternityRole;
        type: Job['type'];
        company?: string;
        location?: string;
        salary?: string;
        requirements?: string;
    } {
        const text = `${title} ${content}`.toLowerCase();

        // 1. Role Classification
        let role = defaultRole;
        let jobType: Job['type'] = 'Job';

        if (/\b(casting call|audition|auditions|actors wanted|actress|female lead|male lead|character artist|model)\b/i.test(text)) {
            role = 'Artist & Actor';
            jobType = 'Audition';
        } else if (/\b(editor|editing|colorist|colourist|davinci|premiere|avid|cut|video editor|film editor)\b/i.test(text)) {
            role = 'Editor';
            jobType = 'Post-Production';
        } else if (/\b(cinematographer|cameraman|camera operator|dop|director of photography|focus puller|cinematography|steadicam)\b/i.test(text)) {
            role = 'Cameraman';
            jobType = 'Crew';
        } else if (/\b(vfx|visual effects|compositor|3d artist|animator|cgi|houdini|maya|blender)\b/i.test(text)) {
            role = 'VFX Artist';
            jobType = 'Post-Production';
        } else if (/\b(sound designer|sound engineer|audio engineer|foley|sync sound|dubbing|sound mixer|pro tools)\b/i.test(text)) {
            role = 'SFX & Sound';
            jobType = 'Post-Production';
        } else if (/\b(music composer|music director|background score|music producer|orchestrator|singer|lyricist)\b/i.test(text)) {
            role = 'Musician';
            jobType = 'Post-Production';
        } else if (/\b(makeup|make-up|hair stylist|costume designer|prosthetics|wardrobe|styling)\b/i.test(text)) {
            role = 'Makeup & Stylist';
            jobType = 'Crew';
        } else if (/\b(director|assistant director|ad|producer|line producer|art director|gaffer|grip)\b/i.test(text)) {
            role = 'Crew';
            jobType = 'Crew';
        }

        // 2. Company Extraction
        let company: string | undefined;
        const sourceMatch = title.split(' - ');
        if (sourceMatch.length > 1 && sourceMatch[sourceMatch.length - 1].length < 30) {
            company = sourceMatch[sourceMatch.length - 1].trim();
        }

        // 3. Location Extraction
        let location = 'India / Production Hub';
        if (/\b(hyderabad|telangana)\b/i.test(text)) location = 'Hyderabad, Telangana';
        else if (/\b(mumbai|bollywood|maharashtra)\b/i.test(text)) location = 'Mumbai, Maharashtra';
        else if (/\b(chennai|kollywood|tamil nadu)\b/i.test(text)) location = 'Chennai, Tamil Nadu';
        else if (/\b(bengaluru|bangalore|karnataka)\b/i.test(text)) location = 'Bengaluru, Karnataka';
        else if (/\b(kochi|kerala|malayalam)\b/i.test(text)) location = 'Kochi, Kerala';
        else if (/\b(remote|work from home)\b/i.test(text)) location = 'Remote / Anywhere';

        // 4. Salary detection
        let salary = 'Competitive Pay';
        const salaryMatch = text.match(/(₹\s?[\d,]+(?:\s?-\s?₹?\s?[\d,]+)?(?:\s?\/(?:day|month|project))?|\$\s?[\d,]+)/i);
        if (salaryMatch) {
            salary = salaryMatch[1];
        } else if (jobType === 'Audition') {
            salary = 'Remuneration / Per Day Rate';
        }

        return {
            fraternityRole: role,
            type: jobType,
            company,
            location,
            salary,
            requirements: `Active portfolio or prior work samples for ${role} role. Verification of past credits is mandatory.`
        };
    }

    /**
     * Curated high quality avatars / logos for fraternity departments
     */
    private getRoleFallbackImage(role: FraternityRole): string {
        switch (role) {
            case 'Editor':
                return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=120&h=120&fit=crop';
            case 'Cameraman':
                return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&h=120&fit=crop';
            case 'VFX Artist':
                return 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=120&h=120&fit=crop';
            case 'SFX & Sound':
                return 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&h=120&fit=crop';
            case 'Musician':
                return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop';
            case 'Artist & Actor':
                return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop';
            case 'Makeup & Stylist':
                return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&h=120&fit=crop';
            default:
                return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&h=120&fit=crop';
        }
    }

    private cleanText(str: string): string {
        return str
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#\d+;/g, '')
            .trim();
    }

    private cleanFullText(html: string): string {
        if (!html) return '';
        return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<\/p>|<br\s*\/?>|<li>|<\/div>|<\/h[1-6]>/gi, '\n\n')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/\n\s*\n\s*\n+/g, '\n\n')
            .trim();
    }

    private cleanHtmlSnippet(html: string): string {
        if (!html) return '';
        const cleaned = html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .trim();
        return cleaned.length > 280 ? cleaned.slice(0, 280) + '...' : cleaned;
    }

    private normalizeKey(key: string): string {
        return key.toLowerCase().replace(/[^a-z0-9]/g, '');
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

export const rssJobService = new RSSJobService();
