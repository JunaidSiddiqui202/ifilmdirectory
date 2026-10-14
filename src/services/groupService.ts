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

// Curated Stitch & Industry Seed Groups
const DEFAULT_GROUPS: Group[] = [
    {
        id: 'group-cinematography',
        name: 'Cinematographers Guild',
        description: 'Directors of Photography, camera operators, gaffers & lighting technicians.',
        members: 1240,
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop',
        category: 'Cinematography',
        lastActive: new Date()
    },
    {
        id: 'group-directing',
        name: 'Directors & Screenwriters',
        description: 'Connecting indie directors, script doctors, and cinematic storytellers.',
        members: 980,
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=300&fit=crop',
        category: 'Directing',
        lastActive: new Date(Date.now() - 3600000)
    },
    {
        id: 'group-vfx',
        name: 'VFX & CGI Artists Hub',
        description: '3D animators, compositors, Houdini/Blender artists, and virtual production wizards.',
        members: 856,
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&h=300&fit=crop',
        category: 'Visual Effects',
        lastActive: new Date(Date.now() - 7200000)
    },
    {
        id: 'group-acting',
        name: 'Actors & Casting Directors',
        description: 'Audition notices, monologue breakdowns, and direct access to casting calls.',
        members: 2450,
        image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=300&h=300&fit=crop',
        category: 'Acting',
        lastActive: new Date(Date.now() - 14400000)
    },
    {
        id: 'group-sound',
        name: 'Sound Design & Foley Guild',
        description: 'Audio mixers, boom operators, composers, and Dolby Atmos specialists.',
        members: 620,
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&h=300&fit=crop',
        category: 'Audio & Music',
        lastActive: new Date(Date.now() - 28800000)
    }
];

// Curated Stitch & Industry Seed Discussions
const DEFAULT_POSTS: ForumPost[] = [
    {
        id: 'post-lens-discussion',
        groupId: 'group-cinematography',
        groupName: 'Cinematographers Guild',
        author: 'Priya Sharma',
        authorId: 'priya_sharma_dp',
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        title: 'Discussion on the latest anamorphic lenses',
        content: "Just tested the latest Cooke Anamorphic/i Full Frame Plus series against vintage Panavision C-series on an Alexa 35. The flare characteristics and skin falloff are surprisingly organic. What are your thoughts on pairing modern large-format sensors with vintage glass?",
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=350&fit=crop',
        likes: 124,
        comments: 18,
        createdAt: new Date(Date.now() - 7200000)
    },
    {
        id: 'post-houdini-sims',
        groupId: 'group-vfx',
        groupName: 'VFX & CGI Artists Hub',
        author: 'Arjun Rao',
        authorId: 'arjun_vfx',
        authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        title: 'Looking for advice on fluid simulations in Houdini',
        content: "I'm working on a project that requires realistic water spray and crashing waves for a coastal action thriller. Any tips or best SOP workflows for balancing FLIP solver particle counts with GPU memory during high-velocity collisions?",
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=350&fit=crop',
        likes: 45,
        comments: 9,
        createdAt: new Date(Date.now() - 14400000)
    },
    {
        id: 'post-pitch-deck',
        groupId: 'group-directing',
        groupName: 'Directors & Screenwriters',
        author: 'Karan Johar',
        authorId: 'karan_johar_prod',
        authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        title: 'Indie Feature Film Pitch Deck & OTT Distribution Strategy',
        content: "When pitching to OTT buyers post-production versus pre-production packaging: here are 5 key metrics buyers examine in today's streaming landscape before greenlighting theatrical or SVOD licensing.",
        likes: 310,
        comments: 42,
        createdAt: new Date(Date.now() - 28800000)
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
    }
};
