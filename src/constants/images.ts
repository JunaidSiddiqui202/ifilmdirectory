/**
 * Stable cinematic placeholders to prevent "broken image" issues.
 * These use highly reliable CDNs and are themed for the film industry.
 */

export const CINEMATIC_PLACEHOLDERS = {
    // General Cinematic / Filmmaking
    GENERAL: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1200',
    FILM_SET: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1200',
    CINEMA_HALL: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200',
    EDITING: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&q=80&w=1200',
    ACTOR: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=1200',

    // Profiles
    USER_MALE: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    USER_FEMALE: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',

    // Tech/AI
    TECHNOLOGY: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',

    // Fallbacks
    JOB_LOGO: 'https://ui-avatars.com/api/?name=Job&background=FF6600&color=fff',
    COMPANY_LOGO: 'https://ui-avatars.com/api/?name=Company&background=333&color=fff'
};

/**
 * Returns a stable placeholder based on keywords in the content
 */
export const getStablePlaceholder = (type: string = 'general', seed?: string): string => {
    const s = seed ? `&sig=${seed.length}` : '';

    switch (type.toLowerCase()) {
        case 'actor':
        case 'casting':
            return CINEMATIC_PLACEHOLDERS.ACTOR + s;
        case 'editing':
        case 'post':
            return CINEMATIC_PLACEHOLDERS.EDITING + s;
        case 'tech':
        case 'ai':
            return CINEMATIC_PLACEHOLDERS.TECHNOLOGY + s;
        case 'cinema':
        case 'theater':
            return CINEMATIC_PLACEHOLDERS.CINEMA_HALL + s;
        case 'user':
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed || 'User')}&background=random&color=fff`;
        default:
            return CINEMATIC_PLACEHOLDERS.GENERAL + s;
    }
};
