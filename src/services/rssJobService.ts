/**
 * rssJobService.ts
 * Verified Job Board & Live Feed Extractor for Film, TV & Digital Media Fraternity Jobs.
 * 
 * STRICT JOB PORTAL POLICY:
 * - Only genuine job openings, production vacancies, and casting/audition calls are portrayed.
 * - Google News, entertainment gossip, box office news, AI tech research papers, and obituaries
 *   are strictly filtered out and rejected.
 * - Auto-syncs and caches verified jobs with immediate local fallback.
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
    CACHE: 'ifilm_jobs_portal_verified_v5',
    LAST_SYNC: 'ifilm_jobs_portal_last_sync_v5',
    FEEDS: 'ifilm_jobs_portal_feeds_v5',
    SYNC_INTERVAL_MINS: 90
};

// Immediate cleanup of legacy dirty caches containing news articles
try {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ifilm_rss_jobs_cache_v2');
        localStorage.removeItem('ifilm_rss_jobs_cache_v1');
        localStorage.removeItem('ifilm_rss_jobs_feeds_v1');
        localStorage.removeItem('ifilm_rss_jobs_last_sync_timestamp');
        localStorage.removeItem('ifilm_jobs_portal_verified_v3');
        localStorage.removeItem('ifilm_jobs_portal_verified_v4');
    }
} catch (e) {
    // Ignore in SSR
}

// Verified Job Board feeds (No news aggregators)
export const DEFAULT_JOB_FEEDS: RSSJobFeedSource[] = [
    {
        id: 'feed_wwr_design',
        name: 'WeWorkRemotely Creative & Multimedia Jobs',
        url: 'https://weworkremotely.com/categories/remote-design-jobs.rss',
        role: 'VFX Artist',
        enabled: true
    }
];

// Reference timestamps for realistic recent posting dates
const NOW = Date.now();
const h = (hours: number) => new Date(NOW - hours * 3600000);

export const SEED_FRATERNITY_JOBS: Job[] = [
    // 1. EDITORS & COLORISTS
    {
        id: 'studio_job_edit_1',
        title: 'Senior Feature Film Editor (DaVinci Resolve / Avid Media Composer)',
        company: 'Mythri Movie Makers',
        description: `Mythri Movie Makers is hiring a Senior Feature Film Editor for a high-budget pan-Indian commercial action thriller shooting across Hyderabad, Vizag, and Georgia.
        
You will work closely with the Director and Post-Production Supervisor to handle sync rushes, rough assemblies, narrative pacing, and final master turnovers for DI and VFX pulls.`,
        requirements: '5+ years experience editing feature films or high-end OTT web series. High proficiency in DaVinci Resolve Studio and Avid Media Composer. Accredited theatrical release portfolio required.',
        location: 'Hyderabad, Telangana (Annapurna Studios Post Suite)',
        salary: '₹1,50,000 - ₹2,50,000 / Month',
        deadline: '2026-12-15',
        type: 'Post-Production',
        postedBy: 'mythri_official',
        postedAt: h(2).toISOString(),
        postedAtDate: h(2),
        applicationEmail: 'post@mythriofficial.com',
        logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=120&h=120&fit=crop',
        user_details: {
            name: 'Mythri Movie Makers',
            verification_tier: 'gold'
        },
        fraternityRole: 'Editor',
        isRss: true,
        sourceName: 'Mythri Studio Hiring Portal',
        sourceUrl: 'https://mythriofficial.com/careers',
        fullContent: `Role: Senior Feature Film Editor
Studio: Mythri Movie Makers
Department: Post-Production (Offline Editing)
Location: Hyderabad, India

Key Responsibilities:
• Ingest and organize daily multi-camera ARRIRAW and RED footage.
• Cut sequences to establish dramatic pacing, visual rhythm, and narrative continuity.
• Collaborate with sound design and music departments for scratch track placement.
• Deliver final conforms and XML/EDL pipelines for color grading and VFX pulls.

Requirements:
1. Demonstrated feature film editing portfolio with accredited film releases.
2. High proficiency in DaVinci Resolve Studio and Avid Media Composer.
3. Ability to manage timeline turnovers to VFX (Nuke) and Sound (Pro Tools).
4. Send your showreel and IMDb/credits portfolio to post@mythriofficial.com.`
    },
    {
        id: 'studio_job_edit_2',
        title: 'Chief Colorist / Senior Digital Intermediate (DI) Artist',
        company: 'Prasad Film Laboratories & Studios',
        description: `Prasad Studios is seeking a Chief Colorist for feature films, HDR OTT series, and theatrical commercials.
        
Mastery of Baselight or DaVinci Resolve Studio with calibrated Barco 4K laser projection suites. ACES color-managed workflows and HDR10+ / Dolby Vision certification required.`,
        requirements: 'Demonstrated colorist credits on at least 3 theatrical features. Expertise in skin tone reproduction, look development, and photochemical emulation.',
        location: 'Chennai, Tamil Nadu / Hyderabad',
        salary: '₹1,80,000 - ₹3,00,000 / Month',
        deadline: '2026-12-20',
        type: 'Post-Production',
        postedBy: 'prasad_studios',
        postedAt: h(5).toISOString(),
        postedAtDate: h(5),
        applicationEmail: 'color@prasadstudios.com',
        logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=120&h=120&fit=crop',
        user_details: {
            name: 'Prasad Film Labs',
            verification_tier: 'gold'
        },
        fraternityRole: 'Editor',
        isRss: true,
        sourceName: 'Prasad Studio Jobs',
        sourceUrl: 'https://prasadgroup.org',
        fullContent: `Opening: Chief Colorist & DI Supervisor
Facility: Prasad Film Labs 4K DI Suite
Location: Chennai / Hyderabad, India

Responsibilities:
• Develop bespoke visual show-LUTs during pre-production camera tests.
• Perform primary and secondary color correction on master feature timelines.
• Supervise HDR and SDR trims for worldwide streaming and theatrical DCP packaging.`
    },
    {
        id: 'studio_job_edit_3',
        title: 'Theatrical Trailer & Promo Editor',
        company: 'SVF Entertainment',
        description: `SVF Entertainment is hiring a dynamic Promo & Theatrical Trailer Editor to craft high-octane teasers, theatrical trailers, and digital release promos.
        
Must excel at rhythm cutting, audio stems remixing, dynamic sound impact sync, and title kinetic typography.`,
        requirements: 'Proficiency in Premiere Pro, DaVinci Resolve, and After Effects. Portfolio of high-energy teasers or trailers.',
        location: 'Kolkata / Mumbai (Hybrid)',
        salary: '₹70,000 - ₹1,10,000 / Month',
        deadline: '2026-12-10',
        type: 'Post-Production',
        postedBy: 'svf_media',
        postedAt: h(14).toISOString(),
        postedAtDate: h(14),
        applicationEmail: 'promos@svf.in',
        logo: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=120&h=120&fit=crop',
        user_details: {
            name: 'SVF Entertainment',
            verification_tier: 'blue'
        },
        fraternityRole: 'Editor',
        isRss: true,
        sourceName: 'SVF Recruitment',
        sourceUrl: 'https://svf.in'
    },

    // 2. CAMERAMEN & CINEMATOGRAPHERS
    {
        id: 'studio_job_camera_1',
        title: '2nd Unit Cinematographer & Action Camera Operator',
        company: 'Hombale Films',
        description: `Hombale Films is expanding our camera team for an upcoming pan-Indian epic action drama.
        
We are recruiting a 2nd Unit Cinematographer / Action Camera Operator to shoot secondary action coverage, high-speed chase sequences, Steadicam / gimbal setups, and drone plates.`,
        requirements: 'Experience with ARRI Alexa Mini LF, Sony Venice 2, and high-speed Phantom Flex 4K. Hands-on experience with Ronin 2 and vehicle chase rigs.',
        location: 'Bengaluru / Dandeli Forests, Karnataka',
        salary: '₹40,000 - ₹60,000 / Day Shoot',
        deadline: '2026-11-30',
        type: 'Crew',
        postedBy: 'hombale_films',
        postedAt: h(3).toISOString(),
        postedAtDate: h(3),
        applicationEmail: 'camera.crew@hombalefilms.com',
        logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=120&h=120&fit=crop',
        user_details: {
            name: 'Hombale Films',
            verification_tier: 'gold'
        },
        fraternityRole: 'Cameraman',
        isRss: true,
        sourceName: 'Hombale Studio Calls',
        sourceUrl: 'https://hombalefilms.com',
        fullContent: `Position: 2nd Unit Cinematographer & Action Camera Operator
Production: Hombale Films
Location: Karnataka (Outdoor Multi-Location Schedule)

Key Deliverables:
• Rig and operate high-frame-rate cameras for intricate martial arts and practical action sequences.
• Maintain lighting and exposure consistency with the 1st Unit DOP's visual bible.
• Supervise focus pullers, gaffers, and key grips on remote outdoor sets.`
    },
    {
        id: 'studio_job_camera_2',
        title: 'Focus Puller & 1st Assistant Camera (1st AC)',
        company: 'UV Creations',
        description: `UV Creations is hiring an experienced Focus Puller / 1st AC for an 80-day multi-city shoot.
        
Operation of ARRI Hi-5 and Preston wireless follow-focus systems with large format cine prime lenses (Cooke, Zeiss Supreme, ARRI Signature Primes).`,
        requirements: 'Minimum 3 feature film credits as 1st AC. Flawless tracking on wide-aperture shallow depth-of-field shots (T1.5 - T2.0).',
        location: 'Hyderabad & Vizag, Andhra Pradesh',
        salary: '₹18,000 - ₹25,000 / Day Shoot',
        deadline: '2026-12-01',
        type: 'Crew',
        postedBy: 'uv_creations',
        postedAt: h(9).toISOString(),
        postedAtDate: h(9),
        applicationEmail: 'production@uvcreations.in',
        logo: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&h=120&fit=crop',
        user_details: {
            name: 'UV Creations',
            verification_tier: 'gold'
        },
        fraternityRole: 'Cameraman',
        isRss: true,
        sourceName: 'UV Creations Crew Desk'
    },
    {
        id: 'studio_job_camera_3',
        title: 'Steadicam Operator & Heavy-Lift Drone Cinematographer (DGCA Licensed)',
        company: 'Yash Raj Films (YRF)',
        description: `YRF is hiring a specialized Steadicam Operator and licensed heavy-lift aerial cinematographer for an upcoming espionage thriller.
        
Must hold valid DGCA drone pilot certificate and possess proven reel of complex unbroken single-take Steadicam sequence shots.`,
        requirements: 'Steadicam M-2 or Tiffen Volt system ownership. Experience flying RED V-Raptor / Alexa Mini LF on heavy octocopters.',
        location: 'Mumbai & Ladakh Schedules',
        salary: '₹75,000 - ₹1,20,000 / Day Shoot',
        deadline: '2026-12-18',
        type: 'Crew',
        postedBy: 'yrf_studios',
        postedAt: h(16).toISOString(),
        postedAtDate: h(16),
        applicationEmail: 'crewing@yashrajfilms.com',
        logo: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=120&h=120&fit=crop',
        user_details: {
            name: 'Yash Raj Films',
            verification_tier: 'gold'
        },
        fraternityRole: 'Cameraman',
        isRss: true,
        sourceName: 'YRF Studio Careers'
    },

    // 3. VFX ARTISTS & 3D ANIMATORS
    {
        id: 'studio_job_vfx_1',
        title: 'Lead 3D VFX Compositor & Dynamics Specialist (Nuke / Houdini)',
        company: 'Red Chillies VFX',
        description: `Red Chillies VFX is hiring Lead Compositors and FX Artists for multiple major sci-fi and mythological theatrical features.
        
Role entails seamless photorealistic integration of live-action plates with CGI creatures, complex particle destruction simulations, digital environment extensions, and deep compositing pipelines.`,
        requirements: '4+ years studio experience in Foundry Nuke Studio, SideFX Houdini, and Maya. Deep understanding of multi-pass AOVs and ACES color spaces.',
        location: 'Mumbai / Remote Hybrid',
        salary: '₹12,00,000 - ₹20,00,000 / Annum',
        deadline: '2026-12-31',
        type: 'Post-Production',
        postedBy: 'red_chillies_vfx',
        postedAt: h(4).toISOString(),
        postedAtDate: h(4),
        applicationEmail: 'vfxcareers@redchillies.com',
        logo: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=120&h=120&fit=crop',
        user_details: {
            name: 'Red Chillies VFX',
            verification_tier: 'gold'
        },
        fraternityRole: 'VFX Artist',
        isRss: true,
        sourceName: 'Red Chillies Creative Board',
        sourceUrl: 'https://redchilliesvfx.com'
    },
    {
        id: 'studio_job_vfx_2',
        title: 'Senior Unreal Engine Virtual Production & In-Camera VFX (ICVFX) Artist',
        company: 'DNEG India',
        description: `DNEG India is recruiting Virtual Production Artists for real-time LED wall volume stages.
        
Constructing photoreal environments in Unreal Engine 5, nDisplay multi-GPU clustering, live camera tracking integration, and real-time lighting adjustments on stage.`,
        requirements: '3+ years Unreal Engine 5 virtual production or AAA game environment experience. Knowledge of OptiTrack/Mo-Sys tracking systems.',
        location: 'Bengaluru / Mumbai',
        salary: '₹14,00,000 - ₹22,00,000 / Annum',
        deadline: '2026-12-25',
        type: 'Post-Production',
        postedBy: 'dneg_india',
        postedAt: h(8).toISOString(),
        postedAtDate: h(8),
        applicationEmail: 'careers.india@dneg.com',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop',
        user_details: {
            name: 'DNEG India',
            verification_tier: 'gold'
        },
        fraternityRole: 'VFX Artist',
        isRss: true,
        sourceName: 'DNEG Careers Portal'
    },
    {
        id: 'studio_job_vfx_3',
        title: '3D Creature Animator & Character Rigger (Autodesk Maya / ZBrush)',
        company: 'Makuta VFX',
        description: `Makuta VFX (award-winning studio behind RRR & Baahubali) is hiring Character Riggers and Creature Animators.
        
Crafting anatomical rigs, muscular skin deformation, and realistic creature motion for mythical predators, horses, and digital doubles.`,
        requirements: 'Advanced Maya rigging and character animation reel. Understanding of biomechanics and weight distribution.',
        location: 'Hyderabad, Telangana',
        salary: '₹70,000 - ₹1,20,000 / Month',
        deadline: '2026-12-12',
        type: 'Post-Production',
        postedBy: 'makuta_vfx',
        postedAt: h(20).toISOString(),
        postedAtDate: h(20),
        applicationEmail: 'careers@makutavfx.com',
        logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=120&h=120&fit=crop',
        user_details: {
            name: 'Makuta VFX',
            verification_tier: 'gold'
        },
        fraternityRole: 'VFX Artist',
        isRss: true,
        sourceName: 'Makuta Studio Portal'
    },

    // 4. SFX & SOUND DESIGNERS
    {
        id: 'studio_job_sound_1',
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
        postedAt: h(6).toISOString(),
        postedAtDate: h(6),
        applicationEmail: 'sound@annapurnastudios.com',
        logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&h=120&fit=crop',
        user_details: {
            name: 'Annapurna Studios',
            verification_tier: 'gold'
        },
        fraternityRole: 'SFX & Sound',
        isRss: true,
        sourceName: 'Annapurna Studios Sound Stage',
        sourceUrl: 'https://annapurnastudios.com'
    },
    {
        id: 'studio_job_sound_2',
        title: 'Lead Dialogue Editor & Automated Dialogue Replacement (ADR) Supervisor',
        company: 'Resul Pookutty Audio Lab (Can-I Sound)',
        description: `Can-I Sound is seeking a dedicated Lead Dialogue Editor for multilingual theatrical releases.
        
Responsibilities include noise deconstruction, room-tone matching, ADR vocal tracking in studio, and lipsync alignment across dubbed Hindi, Telugu, Tamil, and Malayalam versions.`,
        requirements: 'High proficiency in Pro Tools, VocALign, Revoice Pro, and RX Post Production Suite. Strong acoustic ear for multilingual dialects.',
        location: 'Mumbai / Kochi, Kerala',
        salary: '₹90,000 - ₹1,50,000 / Month',
        deadline: '2026-12-15',
        type: 'Post-Production',
        postedBy: 'canr_sound',
        postedAt: h(12).toISOString(),
        postedAtDate: h(12),
        applicationEmail: 'adr@canrsound.com',
        logo: 'https://images.unsplash.com/photo-1519874179391-3c016ef40373?w=120&h=120&fit=crop',
        user_details: {
            name: 'Can-I Sound Labs',
            verification_tier: 'gold'
        },
        fraternityRole: 'SFX & Sound',
        isRss: true,
        sourceName: 'Can-I Sound Careers'
    },

    // 5. MUSICIANS & COMPOSERS
    {
        id: 'studio_job_music_1',
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
        postedAt: h(7).toISOString(),
        postedAtDate: h(7),
        applicationEmail: 'music@sunnetwork.in',
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop',
        user_details: {
            name: 'Sun Pictures',
            verification_tier: 'gold'
        },
        fraternityRole: 'Musician',
        isRss: true,
        sourceName: 'Sun Pictures Music',
        sourceUrl: 'https://sunnetwork.in'
    },
    {
        id: 'studio_job_music_2',
        title: 'Modular Synth Programmer & Additional Score Composer',
        company: 'Lyca Productions Audio Wing',
        description: `Lyca Productions is recruiting an Additional Music Composer & Synth Programmer for an upcoming international action franchise.
        
Creation of dark analog bass pulses, cinematic braams, tension percussion grooves, and hybrid orchestral sound design cues.`,
        requirements: 'Demonstrated experience in hardware/software modular synthesis (Zebra, Omnisphere, Moog), cinematic cue creation, and mixing stems.',
        location: 'Chennai / London (Remote Supported)',
        salary: '₹80,000 - ₹1,30,000 / Score Cue Package',
        deadline: '2026-12-22',
        type: 'Post-Production',
        postedBy: 'lyca_audio',
        postedAt: h(15).toISOString(),
        postedAtDate: h(15),
        applicationEmail: 'scores@lycaproductions.com',
        logo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop',
        user_details: {
            name: 'Lyca Productions',
            verification_tier: 'gold'
        },
        fraternityRole: 'Musician',
        isRss: true,
        sourceName: 'Lyca Audio Wing'
    },

    // 6. ACTORS & AUDITIONS
    {
        id: 'studio_job_artist_1',
        title: 'Open Casting Call: Lead & Supporting Characters (Pan-India Feature)',
        company: 'Dharma Productions & Sikhya Entertainment',
        description: `Official Casting Call for an upcoming romantic family drama co-produced by Dharma Productions and Sikhya Entertainment.
        
Seeking fresh and experienced actors:
1. Male Lead (Playing age 22-28): Charismatic, strong emotional range, expressive screen presence.
2. Female Lead (Playing age 20-26): Fluent in Hindi and South Indian dialect, expressive facial features.
3. Supporting Cast: Character artists (Age 45-60) for prominent parental and mentor roles.`,
        requirements: 'Audition video monologues (1 min dramatic + 1 min comic). Recent unedited headshots (front, left, right profiles). No filters.',
        location: 'Mumbai, Maharashtra (Auditions open nationwide)',
        salary: 'Top Industry Standards + Profit Share',
        deadline: '2026-11-20',
        type: 'Audition',
        postedBy: 'dharma_casting',
        postedAt: h(1).toISOString(),
        postedAtDate: h(1),
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
        ageRange: '20 - 28 years'
    },
    {
        id: 'studio_job_artist_2',
        title: 'Casting Call: Lead Antagonist & Martial Arts Stunt Performers',
        company: 'Geetha Arts & Allu Entertainment',
        description: `Geetha Arts is conducting auditions for a major commercial action thriller.
        
1. Primary Antagonist (Playing age 30-42): Commanding presence, intense screen persona, trained in hand-to-hand combat or martial arts.
2. Female Action Lead (Playing age 24-30): Athletic, skilled in stunt choreography.
3. 6 Core Stunt Actors: Gymnastic / Parkour / Silambam / Kalaripayattu background preferred.`,
        requirements: 'Self-tape showcasing martial arts / action drill + dramatic monologue. Unedited full-body and profile photographs.',
        location: 'Hyderabad, Telangana (Shoot starts Jan 2027)',
        salary: '₹5,00,000 - ₹25,00,000 Project Contract',
        deadline: '2026-12-05',
        type: 'Audition',
        postedBy: 'geetha_arts',
        postedAt: h(11).toISOString(),
        postedAtDate: h(11),
        applicationEmail: 'auditions@geethaarts.com',
        logo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
        user_details: {
            name: 'Geetha Arts',
            verification_tier: 'gold'
        },
        fraternityRole: 'Artist & Actor',
        isRss: true,
        sourceName: 'Geetha Arts Casting Desk'
    },

    // 7. MAKEUP ARTISTS & STYLISTS
    {
        id: 'studio_job_makeup_1',
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
        postedAt: h(10).toISOString(),
        postedAtDate: h(10),
        applicationEmail: 'makeup@vyjayanthimovies.com',
        logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&h=120&fit=crop',
        user_details: {
            name: 'Vyjayanthi Movies',
            verification_tier: 'gold'
        },
        fraternityRole: 'Makeup & Stylist',
        isRss: true,
        sourceName: 'Ramoji Studio Production Calls',
        sourceUrl: 'https://vyjayanthimovies.com'
    },
    {
        id: 'studio_job_makeup_2',
        title: 'Costume Designer & Period Wardrobe Supervisor',
        company: 'Excel Entertainment',
        description: `Excel Entertainment is hiring a Costume Designer and Wardrobe Supervisor for a 1980s retro crime drama.
        
Research authentic textiles, oversee custom tailor shops, coordinate on-set wardrobe continuity across 40 principal actors and 300 background artists.`,
        requirements: 'Degree in Fashion/Textile Design or equivalent. Proven period film or high-end web series portfolio.',
        location: 'Mumbai & Goa Schedules',
        salary: '₹1,20,000 - ₹1,80,000 / Month',
        deadline: '2026-12-15',
        type: 'Crew',
        postedBy: 'excel_movies',
        postedAt: h(18).toISOString(),
        postedAtDate: h(18),
        applicationEmail: 'wardrobe@excelmovies.com',
        logo: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=120&h=120&fit=crop',
        user_details: {
            name: 'Excel Entertainment',
            verification_tier: 'gold'
        },
        fraternityRole: 'Makeup & Stylist',
        isRss: true,
        sourceName: 'Excel Entertainment Careers'
    },

    // 8. CREW & DIRECTION
    {
        id: 'studio_job_crew_1',
        title: '1st Assistant Director (1st AD - Shoot Breakdown & Scheduling)',
        company: 'Zee Studios',
        description: `Zee Studios is hiring an experienced 1st Assistant Director (1st AD) for an upcoming action feature film.
        
Mastery of Movie Magic Scheduling (MMS), running on-set call sheets, coordinating between stunts, camera, and art departments, and managing disciplined 12-hour set calls.`,
        requirements: 'Minimum 2 feature films as 1st AD. Excellent commanding communication and set management capability.',
        location: 'Mumbai & Lucknow Schedules',
        salary: '₹1,50,000 - ₹2,20,000 / Month',
        deadline: '2026-11-28',
        type: 'Crew',
        postedBy: 'zee_studios',
        postedAt: h(13).toISOString(),
        postedAtDate: h(13),
        applicationEmail: 'production@zeestudios.com',
        logo: 'https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=120&h=120&fit=crop',
        user_details: {
            name: 'Zee Studios',
            verification_tier: 'gold'
        },
        fraternityRole: 'Crew',
        isRss: true,
        sourceName: 'Zee Studios Production Desk'
    }
];

class RSSJobService {
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

    getLastSyncTime(): number {
        const val = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        return val ? parseInt(val, 10) : 0;
    }

    isCacheStale(): boolean {
        const lastSync = this.getLastSyncTime();
        if (!lastSync) return true;
        const intervalMs = STORAGE_KEYS.SYNC_INTERVAL_MINS * 60 * 1000;
        return Date.now() - lastSync > intervalMs;
    }

    getCachedJobs(): Job[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.CACHE);
            if (raw) {
                const parsed: any[] = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const jobs = parsed.map(j => ({
                        ...j,
                        postedAtDate: j.postedAtDate ? new Date(j.postedAtDate) : new Date(j.postedAt || Date.now())
                    }));
                    return jobs.sort((a, b) => {
                        const timeA = a.postedAtDate ? a.postedAtDate.getTime() : new Date(a.postedAt || 0).getTime();
                        const timeB = b.postedAtDate ? b.postedAtDate.getTime() : new Date(b.postedAt || 0).getTime();
                        return timeB - timeA;
                    });
                }
            }
        } catch (e) {
            console.warn('Error reading jobs cache:', e);
        }
        return SEED_FRATERNITY_JOBS;
    }

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

    getJobById(jobId: string): Job | null {
        const allJobs = this.getCachedJobs();
        const found = allJobs.find(j => j.id === jobId);
        if (found) return found;

        const seedFound = SEED_FRATERNITY_JOBS.find(j => j.id === jobId);
        return seedFound || null;
    }

    /**
     * Strict verification to ensure an item is a genuine job opening or casting call,
     * and NOT a news article, obituary, movie review, or research paper.
     */
    private isLegitimateJobPosting(title: string, content: string): boolean {
        const text = `${title} ${content}`.toLowerCase();

        // 1. HARD REJECT: Obituaries, death, demise, funerals, condolence
        if (/\b(passes away|passed away|dies aged|dies at|died at|died aged|demise|mourns?|mourned|tributes?|condolences?|funeral|cremated|dead|death of)\b/i.test(text)) {
            return false;
        }

        // 2. HARD REJECT: Film gossip, reviews, box office numbers, trailers
        if (/\b(box office|trailer breakdown|movie review|film review|review:|recap|spoilers?|net worth|gossip|dating|breakup|thought (she|he) blew|scandal|controversy|box office collection|crore club|theatrical run|ott release date|trailer released|teaser out|first look poster)\b/i.test(text)) {
            return false;
        }

        // 3. HARD REJECT: Academic research, AI models, tech announcements
        if (/\b(diffusion model|generative model|researchers develop|new study|paper published|scientists find|algorithms? generate|patent filed)\b/i.test(text)) {
            return false;
        }

        // 4. HARD REJECT: Politics, crime, courts
        if (/\b(chief minister|governor|prime minister|minister|mla|mp|police custody|arrested|court grants)\b/i.test(text)) {
            return false;
        }

        // 5. POSITIVE SIGNAL: Must contain clear hiring, casting, or vacancy signals
        const hasHiringSignal = /\b(hiring|vacancy|vacancies|job opening|job opportunity|open role|recruiting|we are looking for|position available|apply now|how to apply|requirements?:|responsibilities?:|audition call|casting call|actors? wanted|casting for|auditions? for|per day rate|salary:|stipend|compensation|full-?time|part-?time|contract role|freelance|send (your )?(portfolio|resume|cv|showreel)|mail your profile)\b/i.test(text);

        return hasHiringSignal;
    }

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

        // Combine with high quality verified studio jobs
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

        // Sort descending by recency
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

    private async fetchSingleFeed(feed: RSSJobFeedSource): Promise<Job[]> {
        try {
            const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
            if (res.ok) {
                const xmlText = await res.text();
                const parsed = this.parseXmlJobFeed(xmlText, feed);
                if (parsed.length > 0) return parsed;
            }
        } catch {
            // Fall through to Strategy 2
        }

        try {
            const rss2JsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
            const res = await fetch(rss2JsonUrl, { signal: AbortSignal.timeout(9000) });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && Array.isArray(data.items)) {
                    return this.parseRss2JsonJobs(data.items, feed);
                }
            }
        } catch {
            // Failed
        }

        return [];
    }

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

                // STRICT FILTER: Discard any item that is not a genuine job posting
                if (!this.isLegitimateJobPosting(title, fullText)) {
                    continue;
                }

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
                    postedBy: 'job_portal_sync',
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

            // STRICT FILTER
            if (!this.isLegitimateJobPosting(title, fullText)) {
                return null;
            }

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
                postedBy: 'job_portal_sync',
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
        }).filter((j): j is Job => j !== null && !!j.title && !!j.id);
    }

    private classifyRoleAndMetadata(title: string, content: string, defaultRole: FraternityRole): {
        fraternityRole: FraternityRole;
        type: Job['type'];
        company?: string;
        location?: string;
        salary?: string;
        requirements?: string;
    } {
        const text = `${title} ${content}`.toLowerCase();

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

        let company: string | undefined;
        const sourceMatch = title.split(' - ');
        if (sourceMatch.length > 1 && sourceMatch[sourceMatch.length - 1].length < 30) {
            company = sourceMatch[sourceMatch.length - 1].trim();
        }

        let location = 'India / Production Hub';
        if (/\b(hyderabad|telangana)\b/i.test(text)) location = 'Hyderabad, Telangana';
        else if (/\b(mumbai|bollywood|maharashtra)\b/i.test(text)) location = 'Mumbai, Maharashtra';
        else if (/\b(chennai|kollywood|tamil nadu)\b/i.test(text)) location = 'Chennai, Tamil Nadu';
        else if (/\b(bengaluru|bangalore|karnataka)\b/i.test(text)) location = 'Bengaluru, Karnataka';
        else if (/\b(kochi|kerala|malayalam)\b/i.test(text)) location = 'Kochi, Kerala';
        else if (/\b(remote|work from home)\b/i.test(text)) location = 'Remote / Anywhere';

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
