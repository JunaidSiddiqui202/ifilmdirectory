import type { UserProfile } from '../services/userService';

// High-credibility Indian cinema industry showcase profiles (used if database has few profiles or for empty state enrichment)
export const CURATED_CINEMA_TALENT: Partial<UserProfile>[] = [
    {
        uid: 'cin-santosh-sivan',
        displayName: 'Santosh Sivan, ISC',
        role: 'cinematographer',
        roles: ['Cinematographer', 'Director'],
        location: 'Mumbai & Chennai',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'available',
        skills: ['Arri Alexa 35', 'Large Format 65mm', 'Master Anamorphic', 'Natural Light Framing'],
        bio: 'Indian cinematographer & film director known for Indian & international cinema (Asoka, Roja, Thuppakki). Member of ISC and ASC.',
        experience: [
            { id: '1', title: 'Asoka', role: 'Director & DP', year: '2001', type: 'movie' },
            { id: '2', title: 'Roja', role: 'Cinematographer', year: '1992', type: 'movie' },
            { id: '3', title: 'Thuppakki', role: 'Cinematographer', year: '2012', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Hindi', 'Tamil', 'Malayalam', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'dir-prashanth-neel',
        displayName: 'Prashanth Neel',
        role: 'director',
        roles: ['Director', 'Screenwriter'],
        location: 'Bangalore & Hyderabad',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'working',
        skills: ['Action World-Building', 'High-Contrast Noir Aesthetics', 'Multi-Camera Orchestration'],
        bio: 'Visionary director & screenwriter behind the K.G.F universe and Salaar.',
        experience: [
            { id: '4', title: 'K.G.F: Chapter 1 & 2', role: 'Director', year: '2018-2022', type: 'movie' },
            { id: '5', title: 'Salaar: Part 1 – Ceasefire', role: 'Director', year: '2023', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Kannada', 'Telugu', 'Hindi', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'act-sai-pallavi',
        displayName: 'Sai Pallavi',
        role: 'actor',
        roles: ['Lead Actor', 'Dancer'],
        location: 'Hyderabad & Chennai',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'blue' },
        availabilityStatus: 'available',
        skills: ['Method Acting', 'Classical Dance', 'Authentic Dialect Delivery'],
        bio: 'Critically acclaimed actor known for grounded, compelling performances in Telugu, Tamil, and Malayalam cinema.',
        experience: [
            { id: '6', title: 'Gargi', role: 'Lead Actor', year: '2022', type: 'movie' },
            { id: '7', title: 'Shyam Singha Roy', role: 'Lead Actor', year: '2021', type: 'movie' },
            { id: '8', title: 'Premam', role: 'Actor', year: '2015', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Telugu', 'Tamil', 'Malayalam', 'Hindi', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'edit-deepu-joseph',
        displayName: 'Deepu Joseph',
        role: 'editor',
        roles: ['Editor', 'Colorist'],
        location: 'Kochi & Mumbai',
        photoURL: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'blue' },
        availabilityStatus: 'available',
        skills: ['Avid Media Composer', 'DaVinci Resolve', 'Rhythm & Sound Design Integration'],
        bio: 'Award-winning film editor celebrated for kinetic pacing in Jallikattu, Churuli, and Nanpakal Nerathu Mayakkam.',
        experience: [
            { id: '9', title: 'Jallikattu', role: 'Film Editor', year: '2019', type: 'movie' },
            { id: '10', title: 'Churuli', role: 'Film Editor', year: '2021', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Malayalam', 'English', 'Tamil'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'snd-rasool-pookutty',
        displayName: 'Resul Pookutty, CAS',
        role: 'sound_designer',
        roles: ['Sound Designer', 'Sound Mixer'],
        location: 'Mumbai & Kochi',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'available',
        skills: ['Dolby Atmos', 'Field Foley Recording', 'Location Sound Capture'],
        bio: 'Academy Award and BAFTA-winning sound designer and audio mixer.',
        experience: [
            { id: '11', title: 'Slumdog Millionaire', role: 'Sound Mixer', year: '2008', type: 'movie' },
            { id: '12', title: 'Pushpa: The Rise', role: 'Sound Designer', year: '2021', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Hindi', 'Malayalam', 'Tamil', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'wri-juhi-chaturvedi',
        displayName: 'Juhi Chaturvedi',
        role: 'writer',
        roles: ['Screenwriter', 'Dialogue Writer'],
        location: 'Mumbai',
        photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'available',
        skills: ['Character Development', 'Subtle Drama & Humor', 'Screenplay Structuring'],
        bio: 'National Film Award-winning screenwriter for Piku, October, and Vicky Donor.',
        experience: [
            { id: '13', title: 'Piku', role: 'Screenplay & Dialogues', year: '2015', type: 'movie' },
            { id: '14', title: 'October', role: 'Screenwriter', year: '2018', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Hindi', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'dp-k-k-senthil-kumar',
        displayName: 'K. K. Senthil Kumar, ISC',
        role: 'cinematographer',
        roles: ['Director of Photography', 'VFX Supervisor'],
        location: 'Hyderabad',
        photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'working',
        skills: ['ARRI Mini LF', 'VFX Heavy Lighting', 'Technocrane & Wirecam Operatics'],
        bio: 'Indian cinematographer known for monumental visual epics including Baahubali and RRR.',
        experience: [
            { id: '15', title: 'Baahubali Franchise', role: 'Director of Photography', year: '2015-2017', type: 'movie' },
            { id: '16', title: 'RRR', role: 'Director of Photography', year: '2022', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Telugu', 'Hindi', 'English'] },
        createdAt: new Date().toISOString()
    },
    {
        uid: 'art-sabha-cyril',
        displayName: 'Sabu Cyril',
        role: 'crew',
        roles: ['Production Designer', 'Art Director'],
        location: 'Chennai & Mumbai',
        photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=500&fit=crop',
        user_details: { verification_tier: 'gold' },
        availabilityStatus: 'available',
        skills: ['Monumental Set Construction', 'Period Authenticity', 'Miniatures & Practical FX'],
        bio: 'Legendary Indian production designer and 4-time National Film Award winner (Enthiran, Baahubali, RRR).',
        experience: [
            { id: '17', title: 'Enthiran (Robot)', role: 'Art Director', year: '2010', type: 'movie' },
            { id: '18', title: 'Baahubali Franchise', role: 'Production Designer', year: '2015-2017', type: 'movie' }
        ],
        physicalAttributes: { languages: ['Tamil', 'Malayalam', 'Hindi', 'English'] },
        createdAt: new Date().toISOString()
    }
];

export function findCuratedTalent(identifier: string): Partial<UserProfile> | undefined {
    if (!identifier) return undefined;
    const lower = identifier.toLowerCase().trim();
    return CURATED_CINEMA_TALENT.find(p => 
        p.uid?.toLowerCase() === lower || 
        p.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') === lower ||
        p.displayName?.toLowerCase() === lower
    );
}
