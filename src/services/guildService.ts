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

        // Filter out duplicates by slug just in case of seeding issues
        const uniqueGuilds = Array.from(new Map(guilds.map(g => [g.slug, g])).values());
        return uniqueGuilds;
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
