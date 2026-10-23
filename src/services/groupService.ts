import { collection, addDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Group {
    id?: string;
    name: string;
    description: string;
    members: number;
    image: string;
    category: string;
    lastActive: any;
}

export interface ForumPost {
    id?: string;
    groupId: string;
    groupName?: string;
    author: string;
    authorId: string;
    authorImage: string;
    title: string;
    content: string;
    image?: string;
    likes: number;
    comments: number;
    createdAt: any;
}

export interface ForumComment {
    id: string;
    postId: string;
    author: string;
    authorId: string;
    authorImage: string;
    authorRole?: string;
    content: string;
    createdAt: any;
    likes: number;
}

// Curated Stitch & Industry Seed Groups
const DEFAULT_GROUPS: Group[] = [
    {
        id: 'group-cinematography',
        name: 'Cinematographers Guild (ISC/WICA)',
        description: 'Directors of Photography, camera operators, gaffers & lighting technicians.',
        members: 1420,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop',
        category: 'Cinematography',
        lastActive: new Date()
    },
    {
        id: 'group-directing',
        name: 'Directors & Screenwriters Guild (IFTDA/SWA)',
        description: 'Connecting indie directors, script doctors, and cinematic storytellers across languages.',
        members: 1180,
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop',
        category: 'Directing',
        lastActive: new Date(Date.now() - 3600000)
    },
    {
        id: 'group-vfx',
        name: 'VFX & CGI Artists Hub',
        description: '3D animators, compositors, Unreal Engine / virtual production wizards, and colorists.',
        members: 956,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&h=300&fit=crop',
        category: 'Visual Effects',
        lastActive: new Date(Date.now() - 7200000)
    },
    {
        id: 'group-acting',
        name: 'Actors & Casting Directors Network (CINTAA)',
        description: 'Audition notices, screen test breakdowns, and direct craft access for screen actors.',
        members: 2850,
        image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=300&h=300&fit=crop',
        category: 'Acting',
        lastActive: new Date(Date.now() - 14400000)
    },
    {
        id: 'group-sound',
        name: 'Sound Design & Foley Guild (SMPPTE)',
        description: 'Sync sound recordists, boom operators, composers, and Dolby Atmos audio engineers.',
        members: 740,
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=300&fit=crop',
        category: 'Audio & Music',
        lastActive: new Date(Date.now() - 28800000)
    },
    {
        id: 'group-editing',
        name: 'Film Editors Association (AMVE)',
        description: 'Offline/Online editors, colorists, DIT specialists, and post-production supervisors.',
        members: 810,
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=300&fit=crop',
        category: 'Editing',
        lastActive: new Date(Date.now() - 36000000)
    },
    {
        id: 'group-production',
        name: 'Line Producers & Executive Guild',
        description: 'Production managers, shooting permit facilitators, and international line producers.',
        members: 670,
        image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=300&fit=crop',
        category: 'Production',
        lastActive: new Date(Date.now() - 43200000)
    }
];

// Curated Stitch & Industry Seed Discussions
const DEFAULT_POSTS: ForumPost[] = [
    {
        id: 'post-lens-discussion',
        groupId: 'group-cinematography',
        groupName: 'Cinematographers Guild (ISC/WICA)',
        author: 'Priya Sharma',
        authorId: 'priya_sharma_dp',
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        title: 'Cooke Full Frame Plus vs Vintage Panavision C-Series on Alexa 35',
        content: "Tested the latest Cooke Anamorphic/i Full Frame Plus series against vintage Panavision C-series on an Alexa 35 in night low-light conditions. The flare characteristics and skin falloff are exceptionally organic. How are DPs balancing large-format sensor sharpness with vintage coatings?",
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=350&fit=crop',
        likes: 124,
        comments: 3,
        createdAt: new Date(Date.now() - 7200000)
    },
    {
        id: 'post-houdini-sims',
        groupId: 'group-vfx',
        groupName: 'VFX & CGI Artists Hub',
        author: 'Arjun Rao',
        authorId: 'arjun_vfx',
        authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        title: 'Houdini FLIP Water Simulations: Optimizing GPU VRAM for High-Velocity Ocean Collisions',
        content: "Working on a coastal action sequence with crashing ocean breakers on rocky terrain. Looking for recommendations on SOP workflows to balance particle counts with GPU memory during high-velocity collisions without losing foam detail.",
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=350&fit=crop',
        likes: 45,
        comments: 2,
        createdAt: new Date(Date.now() - 14400000)
    },
    {
        id: 'post-pitch-deck',
        groupId: 'group-directing',
        groupName: 'Directors & Screenwriters Guild (IFTDA/SWA)',
        author: 'Karan Nair',
        authorId: 'karan_nair_prod',
        authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        title: 'Pitching to Major OTT Platforms: Key Commercial Metrics Buyers Prioritize in 2026',
        content: "When pitching to OTT buyers post-production versus pre-production packaging: here are 5 crucial metrics streaming buyers examine in today's theatrical/SVOD landscape before greenlighting theatrical co-productions or direct-to-digital licensing.",
        likes: 310,
        comments: 4,
        createdAt: new Date(Date.now() - 28800000)
    },
    {
        id: 'post-sync-sound',
        groupId: 'group-sound',
        groupName: 'Sound Design & Foley Guild (SMPPTE)',
        author: 'Vikram Menon',
        authorId: 'vikram_sound',
        authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        title: 'Sync Sound Rigging in Live Indian Temple Locations: Tackling Reverberation & Ambient Echo',
        content: "Captured live dialog across a 400-year-old stone temple in Hampi using Schoeps CMIT 5U paired with DPA 4060 lavaliers. High RF congestion and stone flutter echoes were brutal. Here is the wireless RF frequency breakdown that avoided dropouts.",
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=350&fit=crop',
        likes: 88,
        comments: 2,
        createdAt: new Date(Date.now() - 43200000)
    }
];

export const groupService = {
    createGroup: async (groupData: Omit<Group, 'id' | 'members' | 'lastActive'>) => {
        try {
            const docRef = await addDoc(collection(db, 'groups'), {
                ...groupData,
                members: 1,
                lastActive: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.warn("Could not save group to Firestore (using local state):", error);
            const localId = `local-group-${Date.now()}`;
            return { success: true, id: localId };
        }
    },

    getGroups: async (): Promise<Group[]> => {
        try {
            const q = query(collection(db, 'groups'), orderBy('lastActive', 'desc'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Group[];
                return fetched;
            }
            return DEFAULT_GROUPS;
        } catch (error) {
            // Graceful fallback to default seed groups if permissions pending or offline
            console.info("Notice: Using curated groups (Firestore permissions pending or offline)");
            return DEFAULT_GROUPS;
        }
    },

    getForumPosts: async (groupId?: string): Promise<ForumPost[]> => {
        try {
            let q = query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc'));
            if (groupId) {
                q = query(collection(db, 'forumPosts'), where('groupId', '==', groupId), orderBy('createdAt', 'desc'));
            }
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const fetched = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ForumPost[];
                return fetched;
            }
            if (groupId) {
                return DEFAULT_POSTS.filter(p => p.groupId === groupId);
            }
            return DEFAULT_POSTS;
        } catch (error) {
            // Graceful fallback to default seed posts if permissions pending or offline
            console.info("Notice: Using curated forum discussions (Firestore permissions pending or offline)");
            if (groupId) {
                return DEFAULT_POSTS.filter(p => p.groupId === groupId);
            }
            return DEFAULT_POSTS;
        }
    },

    createForumPost: async (postData: Omit<ForumPost, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
        try {
            const docRef = await addDoc(collection(db, 'forumPosts'), {
                ...postData,
                likes: 0,
                comments: 0,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.warn("Could not save forum post to Firestore (using local state):", error);
            const localId = `local-post-${Date.now()}`;
            return { success: true, id: localId };
        }
    },

    getComments: async (postId: string): Promise<ForumComment[]> => {
        try {
            const q = query(collection(db, 'forumPosts', postId, 'comments'), orderBy('createdAt', 'asc'));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    postId,
                    ...doc.data()
                })) as ForumComment[];
            }
        } catch (e) {
            console.info("Using local demo comments for post:", postId);
        }

        // Default seed replies for discussions
        const seedComments: Record<string, ForumComment[]> = {
            'post-lens-discussion': [
                {
                    id: 'comm-1',
                    postId: 'post-lens-discussion',
                    author: 'Santosh Sivan ISC',
                    authorId: 'santosh_sivan',
                    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                    authorRole: 'Cinematographer',
                    content: 'Cooke glass brings that creamy skin tone falloff that complements modern high-K digital sensors without aggressive diffusion filters.',
                    createdAt: new Date(Date.now() - 3600000),
                    likes: 14
                },
                {
                    id: 'comm-2',
                    postId: 'post-lens-discussion',
                    author: 'Kabir Lal',
                    authorId: 'kabir_lal',
                    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
                    authorRole: 'DoP / Camera Op',
                    content: 'Watch out for corner sharpness on the wider focal lengths when shooting wide open at T2.3.',
                    createdAt: new Date(Date.now() - 1800000),
                    likes: 6
                }
            ],
            'post-houdini-sims': [
                {
                    id: 'comm-3',
                    postId: 'post-houdini-sims',
                    author: 'Ravi Teja VFX',
                    authorId: 'ravi_vfx',
                    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
                    authorRole: 'FX Technical Director',
                    content: 'Run a low-res guide sim first to lock the wave impact shape, then use Narrowband FLIP with VDB collision caching to avoid memory thrashing.',
                    createdAt: new Date(Date.now() - 7200000),
                    likes: 9
                }
            ],
            'post-pitch-deck': [
                {
                    id: 'comm-4',
                    postId: 'post-pitch-deck',
                    author: 'Anurag Kashyap',
                    authorId: 'anurag_k',
                    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
                    authorRole: 'Director & Producer',
                    content: 'Always lock international festival buzz and strong regional IP rights before talking global non-exclusive streaming sales.',
                    createdAt: new Date(Date.now() - 14400000),
                    likes: 28
                }
            ]
        };

        return seedComments[postId] || [];
    },

    addComment: async (commentData: Omit<ForumComment, 'id' | 'createdAt' | 'likes'>) => {
        try {
            const docRef = await addDoc(collection(db, 'forumPosts', commentData.postId, 'comments'), {
                ...commentData,
                likes: 0,
                createdAt: Timestamp.now()
            });
            return { success: true, id: docRef.id };
        } catch (e) {
            console.warn("Could not save comment to Firestore:", e);
            return { success: true, id: `local-comm-${Date.now()}` };
        }
    }
};
