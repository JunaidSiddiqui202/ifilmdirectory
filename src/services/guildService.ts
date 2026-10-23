import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Guild {
    id: string;
    name: string;
    slug: string; // e.g., 'vfx-pros'
    description: string;
    category: 'creative' | 'technical' | 'talent' | 'production' | 'administrative';
    memberCount: number;
    icon: string;
    banner?: string;
    guidelines: string[];
    moderators: string[]; // User IDs
    createdAt: any;
}

export interface GuildPost {
    id: string;
    guildId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    title: string;
    content: string;
    mediaUrls?: string[];
    likes: number;
    commentCount: number;
    tags: string[];
    language: string; // Detected language or 'hinglish', 'tinglish', etc.
    isPinned?: boolean;
    type: 'post' | 'poll' | 'ama';
    pollData?: PollData;
    amaHostId?: string;
    userBadges?: Badge[];
    createdAt: any;
}

export interface Badge {
    id: string;
    label: string;
    icon: string;
    color: string; // Tailwind color class or hex
    bg: string;    // Tailwind bg class or hex
}

export interface PollData {
    options: {
        id: string;
        text: string;
        votes: number;
    }[];
    totalVotes: number;
    voters: string[]; // User IDs to prevent double voting
}

export interface GuildComment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    content: string;
    likes: number;
    createdAt: any;
    parentId?: string; // For nesting
}

class GuildService {
    // Guild Management
    async createGuild(guildData: Omit<Guild, 'id' | 'createdAt' | 'memberCount'>) {
        const docRef = await addDoc(collection(db, 'guilds'), {
            ...guildData,
            memberCount: 1,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    async getAllGuilds(): Promise<Guild[]> {
        const q = query(collection(db, 'guilds'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const guilds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guild));

        // Film department slugs whitelist
        const VALID_FILM_SLUGS = [
            'cinematography',
            'directing',
            'vfx-cgi',
            'acting',
            'line-producers',
            'art-department',
            'public-relations',
            'makeup-styling',
            'music-playback',
            'post-production',
            'casting-network'
        ];

        // Seed fallback film guilds in case firestore hasn't been populated with all cinema guilds yet
        const DEFAULT_FILM_GUILDS: Guild[] = [
            {
                id: 'guild_cinematography',
                name: 'Cinematography & Camera Guild',
                slug: 'cinematography',
                description: 'Director of Photography, Camera Operators, 1st ACs, DITs & Lighting Technicians.',
                category: 'technical',
                memberCount: 1420,
                icon: 'videocam',
                guidelines: [
                    'Discuss sensor dynamics, optics, ARRI/RED workflows',
                    'Share lighting diagrams and technical setups',
                    'Maintain camera craft professional courtesy'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_directing',
                name: 'Directors & Screenwriters Guild',
                slug: 'directing',
                description: 'Feature Film, Series & Commercial Directors, Writers, Script Supervisors.',
                category: 'creative',
                memberCount: 1180,
                icon: 'movie_edit',
                guidelines: [
                    'Screenplay craft, scene breakdown & blocking',
                    'Actor-director collaboration standards',
                    'Industry pitch decks & festival strategy'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_vfx',
                name: 'VFX & CGI Pros Guild',
                slug: 'vfx-cgi',
                description: 'Houdini FX artists, Compositors, 3D Leads, Unreal Engine Virtual Production.',
                category: 'technical',
                memberCount: 950,
                icon: 'movie_filter',
                guidelines: [
                    'ACES color space, node graphs, rendering pipelines',
                    'Virtual production & LED wall camera tracking',
                    'VFX breakdown breakdowns and credits transparency'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_acting',
                name: 'Actors & Screen Talent Fraternity',
                slug: 'acting',
                description: 'Screen actors, voice artists, method performers, stunt coordinators.',
                category: 'talent',
                memberCount: 2100,
                icon: 'theater_comedy',
                guidelines: [
                    'Audition etiquette, self-tapes & agent representation',
                    'Intimacy coordination & on-set performer safety',
                    'Union rates and contract protections'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_post',
                name: 'Post-Production Suite Guild',
                slug: 'post-production',
                description: 'Offline/Online Film Editors, Colorists (DaVinci Resolve), Sound Designers.',
                category: 'technical',
                memberCount: 880,
                icon: 'content_cut',
                guidelines: [
                    'Conform workflows, EDL/XML pipeline tips',
                    'Dolby Atmos mixing & calibrated monitoring',
                    'Color grading LUTs and HDR delivery specs'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_music',
                name: 'Music & Playback Studio Guild',
                slug: 'music-playback',
                description: 'Film Composers, Lyricists, Playback Singers, Orchestrators, Audio Engineers.',
                category: 'creative',
                memberCount: 760,
                icon: 'music_note',
                guidelines: [
                    'Score publishing rights & synchronization royalties',
                    'Multitrack film score recording techniques',
                    'Background score thematic motifs and cues'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_art',
                name: 'Art & Production Design Guild',
                slug: 'art-department',
                description: 'Production Designers, Art Directors, Set Decorators, Prop Masters.',
                category: 'creative',
                memberCount: 640,
                icon: 'palette',
                guidelines: [
                    'Period research, moodboards & drafted blueprints',
                    'Sustainable set construction & material sourcing',
                    'Prop licensing and safety protocols'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_line_producers',
                name: 'Line Producers & Production Managers',
                slug: 'line-producers',
                description: 'Executive Producers, Line Producers, Unit Production Managers, Production Accounts.',
                category: 'production',
                memberCount: 910,
                icon: 'analytics',
                guidelines: [
                    'Call sheet templates, shoot schedule optimization',
                    'Permits, state film subsidies & location compliance',
                    'Catering, transport & crew welfare standards'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_makeup',
                name: 'Makeup, Prosthetics & Styling Guild',
                slug: 'makeup-styling',
                description: 'Special Effects (SFX) Prosthetics, Character Makeup, Costume Designers.',
                category: 'talent',
                memberCount: 530,
                icon: 'face_retouching_natural',
                guidelines: [
                    'Silicon appliances, airbrush and blood work safety',
                    'Continuity logs & 4K camera compatibility',
                    'Wardrobe breakdown and period authenticity'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            },
            {
                id: 'guild_pr',
                name: 'Film PROs & PR Guild',
                slug: 'public-relations',
                description: 'Cinema Publicists, Trailer Launch Strategists, Digital Marketers, Media Handlers.',
                category: 'administrative',
                memberCount: 490,
                icon: 'campaign',
                guidelines: [
                    'Press meet protocol & teaser reveal timelines',
                    'Film festival submissions & review embargoes',
                    'Crisis communications & social sentiment'
                ],
                moderators: [],
                createdAt: new Date().toISOString()
            }
        ];

        // Filter out non-film or rogue test records
        const sanitizedFirestore = guilds.filter(g => {
            const name = (g.name || '').toLowerCase();
            const slug = (g.slug || '').toLowerCase();
            const isDisallowed = name.includes('insolvency') ||
                name.includes('corporate law') ||
                name.includes('ca') ||
                name.includes('firm') ||
                slug.includes('insolvency') ||
                slug.includes('corporate');
            if (isDisallowed) return false;
            return VALID_FILM_SLUGS.includes(slug) || VALID_FILM_SLUGS.some(s => slug.includes(s));
        });

        // Merge firestore with default guilds, prioritizing firestore data
        const mergedMap = new Map<string, Guild>();
        DEFAULT_FILM_GUILDS.forEach(dg => mergedMap.set(dg.slug, dg));
        sanitizedFirestore.forEach(fg => {
            if (fg.slug) mergedMap.set(fg.slug, fg);
        });

        return Array.from(mergedMap.values());
    }

    async requestGuild(requestData: { userId: string, guildName: string, reason: string }) {
        await addDoc(collection(db, 'guild_requests'), {
            ...requestData,
            status: 'pending',
            createdAt: serverTimestamp()
        });
    }

    async getGuildBySlug(slug: string): Promise<Guild | null> {
        const q = query(collection(db, 'guilds'), where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Guild;
    }

    // Post Management
    async createPost(postData: Omit<GuildPost, 'id' | 'createdAt' | 'likes' | 'commentCount'>) {
        console.log('[GuildService] Creating guild post:', postData);

        // Remove undefined values to prevent Firestore errors
        const cleanedData: any = {};
        Object.entries(postData).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanedData[key] = value;
            }
        });

        // 1. Create the Guild-specific post
        const docRef = await addDoc(collection(db, 'guild_posts'), {
            ...cleanedData,
            likes: 0,
            commentCount: 0,
            isPinned: cleanedData.isPinned || false,
            createdAt: serverTimestamp()
        });

        console.log('[GuildService] Guild post created with ID:', docRef.id);

        // 2. Also create a post in the main 'posts' collection for the Showcase feed
        try {
            const { createPost: createMainPost } = await import('./postService');
            await createMainPost({
                author: cleanedData.userName,
                authorId: cleanedData.userId,
                authorImage: cleanedData.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(cleanedData.userName),
                role: cleanedData.type === 'ama' ? 'AMA Host' : 'Professional',
                content: `[${cleanedData.title}]\n\n${cleanedData.content}`,
                authorVerified: true,
                image: cleanedData.mediaUrls?.[0], // Sync first image if exists
                images: cleanedData.mediaUrls,
                likes: 0,
                comments: 0,
                createdAt: serverTimestamp()
            });
            console.log('[GuildService] ✅ Synced post to main Showcase feed');
        } catch (syncError) {
            console.error('[GuildService] ❌ Failed to sync to main feed:', syncError);
        }

        return docRef.id;
    }

    subscribeToGuildPosts(guildId: string, callback: (posts: GuildPost[]) => void) {
        const q = query(
            collection(db, 'guild_posts'),
            where('guildId', '==', guildId)
        );

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GuildPost));

            // Sort client-side
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt?.seconds || a.createdAt?._seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : Date.now() / 1000);
                const dateB = b.createdAt?.seconds || b.createdAt?._seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : Date.now() / 1000);
                return dateB - dateA;
            });

            callback(sortedPosts);
        }, (error) => {
            console.error("Guild posts subscription error:", error);
        });
    }

    // Subscribe to ALL guild posts (for trending topics)
    subscribeToAllGuildPosts(callback: (posts: GuildPost[]) => void) {
        const q = query(collection(db, 'guild_posts'));

        return onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GuildPost));

            // Sort by creation date
            const sortedPosts = posts.sort((a, b) => {
                const dateA = a.createdAt?.seconds || a.createdAt?._seconds || (a.createdAt instanceof Date ? a.createdAt.getTime() / 1000 : Date.now() / 1000);
                const dateB = b.createdAt?.seconds || b.createdAt?._seconds || (b.createdAt instanceof Date ? b.createdAt.getTime() / 1000 : Date.now() / 1000);
                return dateB - dateA;
            });

            callback(sortedPosts);
        }, (error) => {
            console.error('Error subscribing to all guild posts:', error);
        });
    }

    // Comment Management
    async addComment(commentData: Omit<GuildComment, 'id' | 'createdAt' | 'likes'>) {
        console.log('[GuildService] Adding comment:', commentData);

        // First, save the comment
        const docRef = await addDoc(collection(db, 'guild_comments'), {
            ...commentData,
            likes: 0,
            likedBy: [],
            createdAt: serverTimestamp()
        });
        console.log('[GuildService] Comment saved with ID:', docRef.id);

        // Try to increment post comment count (may fail for demo posts)
        try {
            const postRef = doc(db, 'guild_posts', commentData.postId);
            await updateDoc(postRef, {
                commentCount: increment(1)
            });
            console.log('[GuildService] Post comment count incremented');
        } catch (e) {
            console.warn('[GuildService] Could not update post comment count (post may not exist in DB):', e);
        }

        return docRef.id;
    }

    async getPostComments(postId: string): Promise<GuildComment[]> {
        const q = query(
            collection(db, 'guild_comments'),
            where('postId', '==', postId)
        );
        const snapshot = await getDocs(q);
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuildComment));

        // Sort in memory by createdAt (asc)
        return comments.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeA - timeB;
        });
    }

    async likeComment(commentId: string) {
        const commentRef = doc(db, 'guild_comments', commentId);
        await updateDoc(commentRef, {
            likes: increment(1)
        });
    }

    async replyToComment(commentData: Omit<GuildComment, 'id' | 'createdAt' | 'likes'>) {
        const docRef = await addDoc(collection(db, 'guild_comments'), {
            ...commentData,
            likes: 0,
            createdAt: serverTimestamp()
        });

        // Increment post comment count
        const postRef = doc(db, 'guild_posts', commentData.postId);
        await updateDoc(postRef, {
            commentCount: increment(1)
        });

        return docRef.id;
    }

    // Interactions
    async likePost(postId: string) {
        const postRef = doc(db, 'guild_posts', postId);
        await updateDoc(postRef, {
            likes: increment(1)
        });
    }

    async updatePost(postId: string, data: Partial<GuildPost>) {
        const postRef = doc(db, 'guild_posts', postId);
        await updateDoc(postRef, data);
    }

    async voteOnPoll(postId: string, optionId: string, userId: string) {
        const postRef = doc(db, 'guild_posts', postId);
        const postSnap = await (await import('firebase/firestore')).getDoc(postRef);

        if (!postSnap.exists()) return;

        const postData = postSnap.data() as GuildPost;
        if (!postData.pollData || postData.pollData.voters.includes(userId)) return;

        const updatedOptions = postData.pollData.options.map(opt => {
            if (opt.id === optionId) {
                return { ...opt, votes: opt.votes + 1 };
            }
            return opt;
        });

        await updateDoc(postRef, {
            'pollData.options': updatedOptions,
            'pollData.totalVotes': increment(1),
            'pollData.voters': [...postData.pollData.voters, userId]
        });
    }
}

export const guildService = new GuildService();
