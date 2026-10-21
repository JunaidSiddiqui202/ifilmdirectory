import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    deleteDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    getDoc,
    onSnapshot,
    limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { createNotification } from './notificationService';
import { getUserProfile } from './userService';

export interface PostData {
    id?: string;
    author: string;
    authorId: string;
    authorImage: string;
    role: string;
    content: string;
    authorVerified?: boolean;
    image?: string;
    images?: string[];
    videoUrl?: string;
    videoType?: 'trailer' | 'teaser' | 'lyrical' | 'opening';
    movieTitle?: string;
    releaseDate?: string;
    likes: number;
    likedBy?: string[]; // Array of user IDs who liked the post
    comments: number;
    createdAt: any;
    jobId?: string;
    deadline?: string;
}

export const LATEST_CINEMA_FEED_VIDEOS: PostData[] = [
    {
        id: 'feed-video-pushpa2',
        author: 'Mythri Movie Makers',
        authorId: 'mythri-official',
        authorImage: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=120&h=120&fit=crop',
        role: 'Production House (Official)',
        authorVerified: true,
        movieTitle: 'Pushpa 2: The Rule',
        videoType: 'trailer',
        releaseDate: 'In Theatres Worldwide',
        videoUrl: 'https://www.youtube.com/watch?v=1kVK0MZlbI4',
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop',
        content: '🎬 [OFFICIAL TRAILER] Witness Icon Star Allu Arjun and Sukumar’s monumental cinematic spectacle Pushpa 2: The Rule! The wildfire blazes across world cinema screens. Watch the explosive trailer right here! 🔥🌲 #Pushpa2TheRule #WildFire #Trailer',
        likes: 18450,
        comments: 2120,
        createdAt: new Date(Date.now() - 10 * 60 * 1000) // 10 mins ago (Latest at top!)
    },
    {
        id: 'feed-video-gamechanger',
        author: 'Sri Venkateswara Creations',
        authorId: 'svc-official',
        authorImage: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=120&h=120&fit=crop',
        role: 'Production House (Official)',
        authorVerified: true,
        movieTitle: 'Game Changer',
        videoType: 'lyrical',
        releaseDate: 'Jan 10, 2026 Worldwide',
        videoUrl: 'https://www.youtube.com/watch?v=k4x8W4J00eM',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop',
        content: '🎵 [LATEST LYRICAL VIDEO] "Jaragandi" & "Raa Macha Macha" – Mega Powerstar Ram Charan in sensational dancing rhythm! Thaman S mass beats meets Shankar grand visual choreography. Crank the volume up! 🎶💃 #GameChanger #RamCharan #LyricalVideo',
        likes: 12840,
        comments: 1420,
        createdAt: new Date(Date.now() - 22 * 60 * 1000) // 22 mins ago
    },
    {
        id: 'feed-video-rajasaab',
        author: 'People Media Factory',
        authorId: 'pmf-official',
        authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
        role: 'Production House (Official)',
        authorVerified: true,
        movieTitle: 'The Raja Saab',
        videoType: 'teaser',
        releaseDate: 'April 10, 2026',
        videoUrl: 'https://www.youtube.com/watch?v=0kF63N6l5F0',
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop',
        content: '⚡ [OFFICIAL TEASER] Rebel Star Prabhas in a dashing, vintage avatar in Maruthi’s romantic horror-comedy spectacle The Raja Saab! Witness the king of masses back with peerless swag. 👑✨ #Prabhas #TheRajaSaab #Teaser',
        likes: 21300,
        comments: 3490,
        createdAt: new Date(Date.now() - 38 * 60 * 1000) // 38 mins ago
    },
    {
        id: 'feed-video-thalapathy69',
        author: 'KVN Productions',
        authorId: 'kvn-official',
        authorImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=120&h=120&fit=crop',
        role: 'Production House (Official)',
        authorVerified: true,
        movieTitle: 'Thalapathy 69',
        videoType: 'opening',
        releaseDate: 'October 2026 (Diwali)',
        videoUrl: 'https://www.youtube.com/watch?v=8V4c3k_5_2g',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop',
        content: '🍿 [GRAND MOVIE OPENING] Thalapathy 69 officially begins with an auspicious Pooja Ceremony in Chennai! Thalapathy Vijay, director H. Vinoth, Pooja Hegde, and composer Anirudh unite for this political action spectacle. 🎬🪔 #Thalapathy69 #PoojaLaunch #MovieOpening',
        likes: 24900,
        comments: 4200,
        createdAt: new Date(Date.now() - 52 * 60 * 1000) // 52 mins ago
    },
    {
        id: 'feed-video-kantara',
        author: 'Hombale Films',
        authorId: 'hombale-official',
        authorImage: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=120&h=120&fit=crop',
        role: 'Production House (Official)',
        authorVerified: true,
        movieTitle: 'Kantara: Chapter 1',
        videoType: 'teaser',
        releaseDate: 'Oct 2, 2026',
        videoUrl: 'https://www.youtube.com/watch?v=Vj81N_Kq-z0',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=450&fit=crop',
        content: '🔥 [MYTHOLOGICAL TEASER] Step into the divine realm of Kantara: A Legend Chapter 1. Rishab Shetty unveils the roaring prequel that unravels centuries of myth, sacred forests and folklore. 🌿🔱 #KantaraChapter1 #RishabShetty #HombaleFilms',
        likes: 16200,
        comments: 1890,
        createdAt: new Date(Date.now() - 68 * 60 * 1000) // 68 mins ago
    }
];

export interface CommentData {
    postId: number | string; // Changed to allow string IDs
    author: string;
    authorId: string;
    authorImage: string;
    text: string;
    createdAt: any;
    likes: number;
    likedBy?: string[];
    parentId?: string;
    replyTo?: string;
    type?: 'post' | 'showreel' | 'blog';
}

// Client-side cache to protect free daily Firestore read quota
let postsCache: { posts: PostData[]; timestamp: number } | null = null;
const POSTS_CACHE_TTL = 90 * 60 * 1000; // 90 minutes cache update cycle

export const createPost = async (postData: Omit<PostData, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'posts'), postData);
        // Invalidate cache immediately on new post
        postsCache = null;
        return { id: docRef.id, ...postData };
    } catch (error) {
        console.error("Error creating post: ", error);
        throw error;
    }
};

const mergeWithCinemaVideos = (firestorePosts: PostData[]): PostData[] => {
    const existingIds = new Set(firestorePosts.map(p => p.id));
    const newCinemaVideos = LATEST_CINEMA_FEED_VIDEOS.filter(v => !existingIds.has(v.id));
    const combined = [...newCinemaVideos, ...firestorePosts];
    
    // Sort strictly so the latest trailer, teaser, lyrical video or post is at the top
    combined.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
    });
    return combined;
};

export const getPosts = async (limitCount: number = 40, bypassCache: boolean = false) => {
    if (!bypassCache && postsCache && Date.now() - postsCache.timestamp < POSTS_CACHE_TTL) {
        return postsCache.posts;
    }

    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        const firestorePosts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PostData[];
        const posts = mergeWithCinemaVideos(firestorePosts);
        postsCache = { posts, timestamp: Date.now() };
        return posts;
    } catch (error) {
        console.error("Error getting posts: ", error);
        const fallback = mergeWithCinemaVideos(postsCache?.posts || []);
        return fallback;
    }
};

export const subscribeToPosts = (callback: (posts: PostData[]) => void, limitCount: number = 40) => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
        const firestorePosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PostData[];
        const posts = mergeWithCinemaVideos(firestorePosts);
        postsCache = { posts, timestamp: Date.now() };
        callback(posts);
    }, (error) => {
        console.error("Posts subscription error:", error);
    });
};

export const addCommentToPost = async (commentData: CommentData) => {
    try {
        const postId = String(commentData.postId);
        const type = commentData.type || 'post';

        // Filter out undefined values to prevent Firestore errors
        const cleanCommentData: any = {};
        Object.entries(commentData).forEach(([key, value]) => {
            if (value !== undefined) {
                cleanCommentData[key] = value;
            }
        });

        const newComment = {
            ...cleanCommentData,
            postId: postId,
            type: type,
            likes: cleanCommentData.likes ?? 0,
            likedBy: cleanCommentData.likedBy || [],
            createdAt: cleanCommentData.createdAt || new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, 'comments'), newComment);

        // Update comment count on post/showreel/blog
        try {
            let collectionName = type === 'showreel' ? 'showreels' : (type === 'blog' ? 'blogs' : 'posts');
            let targetRef = doc(db, collectionName, postId);
            let targetSnap = await getDoc(targetRef);

            // If not found in the specified collection, try to find it in others (robustness)
            if (!targetSnap.exists() && !commentData.type) {
                const possibleCollections = ['posts', 'showreels', 'blogs'];
                for (const col of possibleCollections) {
                    if (col === collectionName) continue;
                    const altRef = doc(db, col, postId);
                    const altSnap = await getDoc(altRef);
                    if (altSnap.exists()) {
                        targetRef = altRef;
                        targetSnap = altSnap;
                        collectionName = col;
                        break;
                    }
                }
            }

            if (targetSnap.exists()) {
                await updateDoc(targetRef, {
                    comments: increment(1)
                });

                // Create notification for content owner
                const targetData = targetSnap.data();
                const ownerId = targetData.creatorId || targetData.authorId || targetData.userId;

                if (ownerId && ownerId !== newComment.authorId) {
                    let actionLink = `/post/${postId}`;
                    if (collectionName === 'showreels') actionLink = `/showreel/view1?id=${postId}`;
                    else if (collectionName === 'blogs') actionLink = `/blogs-events`;

                    await createNotification({
                        userId: ownerId,
                        type: 'comment',
                        title: 'New Comment',
                        message: `${newComment.author} commented on your ${type || 'post'}: "${newComment.text.substring(0, 50)}${newComment.text.length > 50 ? '...' : ''}"`,
                        image: newComment.authorImage,
                        actionLink: actionLink
                    });
                }
            }
        } catch (updateError) {
            console.warn(`Could not update comment count or send notification for ${type} (ID: ${postId}):`, updateError);
        }

        return { id: docRef.id, ...newComment };
    } catch (error) {
        console.error("Error adding comment: ", error);
        throw error;
    }
};

export const reportPost = async (postId: string, userId: string, reason: string = 'general') => {
    try {
        // In a real app, this would save to a 'reports' collection
        console.log(`Reported post ${postId} by user ${userId} for ${reason}`);
        await addDoc(collection(db, 'reports'), {
            targetId: postId,
            targetType: 'post',
            reportedBy: userId,
            reason,
            createdAt: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error reporting post:", error);
        throw error;
    }
};

export const getCommentsForPost = async (postId: number | string) => {
    try {
        const q = query(
            collection(db, 'comments'),
            where('postId', '==', String(postId)) // Always query as string
        );
        const querySnapshot = await getDocs(q);
        const comments = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (CommentData & { id: string })[];

        return comments.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
            return timeB - timeA;
        });
    } catch (error) {
        console.error("Error getting comments: ", error);
        return [];
    }
};

// --- New Interaction Functions ---

export const deletePost = async (postId: string) => {
    try {
        await deleteDoc(doc(db, 'posts', postId));
        return true;
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

export const toggleLikePost = async (postId: string, userId: string, type: 'post' | 'showreel' | 'blog' = 'post') => {
    try {
        let collectionName = type === 'showreel' ? 'showreels' : (type === 'blog' ? 'blogs' : 'posts');
        let targetRef = doc(db, collectionName, postId);
        let targetSnap = await getDoc(targetRef);

        // Fallback detection
        if (!targetSnap.exists()) {
            const possibleCollections = ['posts', 'showreels', 'blogs'];
            for (const col of possibleCollections) {
                if (col === collectionName) continue;
                const altRef = doc(db, col, postId);
                const altSnap = await getDoc(altRef);
                if (altSnap.exists()) {
                    targetRef = altRef;
                    targetSnap = altSnap;
                    collectionName = col;
                    break;
                }
            }
        }

        if (!targetSnap.exists()) throw new Error(`Content with ID ${postId} not found in any collection`);

        const data = targetSnap.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(userId);

        if (isLiked) {
            // Unlike
            await updateDoc(targetRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
            return { isLiked: false, likes: (data.likes || 1) - 1 };
        } else {
            // Like
            await updateDoc(targetRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });

            // Create notification for owner
            const ownerId = data.creatorId || data.authorId || data.userId;
            if (ownerId && ownerId !== userId) {
                const likerProfile = await getUserProfile(userId);

                let actionLink = `/post/${postId}`;
                if (collectionName === 'showreels') actionLink = `/showreel/view1?id=${postId}`;
                else if (collectionName === 'blogs') actionLink = `/blogs-events`;

                await createNotification({
                    userId: ownerId,
                    type: 'like',
                    title: 'New Like',
                    message: `${likerProfile?.displayName || 'Someone'} liked your content`,
                    image: likerProfile?.photoURL || undefined,
                    actionLink: actionLink
                });
            }
            return { isLiked: true, likes: (data.likes || 0) + 1 };
        }
    } catch (error) {
        console.error(`Error toggling like on ${type}:`, error);
        throw error;
    }
};

export const toggleLikeComment = async (commentId: string, userId: string) => {
    try {
        const commentRef = doc(db, 'comments', commentId);
        const commentSnap = await getDoc(commentRef);

        if (!commentSnap.exists()) throw new Error("Comment not found");

        const data = commentSnap.data();
        const likedBy = data.likedBy || [];
        const isLiked = likedBy.includes(userId);

        if (isLiked) {
            await updateDoc(commentRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
            return { isLiked: false, likes: (data.likes || 0) - 1 };
        } else {
            await updateDoc(commentRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });

            // Notify comment author
            if (data.authorId && data.authorId !== userId) {
                const likerProfile = await getUserProfile(userId);
                await createNotification({
                    userId: data.authorId,
                    type: 'like',
                    title: 'Comment Liked',
                    message: `${likerProfile?.displayName || 'Someone'} liked your comment: "${data.text.substring(0, 30)}..."`,
                    image: likerProfile?.photoURL || undefined,
                    actionLink: data.type === 'showreel' ? `/showreel/view1?id=${data.postId}` : `/post/${data.postId}`
                });
            }
            return { isLiked: true, likes: (data.likes || 0) + 1 };
        }
    } catch (error) {
        console.error("Error toggling like on comment:", error);
        throw error;
    }
};

export const toggleSavePost = async (postId: string, userId: string, type: 'post' | 'showreel' = 'post') => {
    try {
        const savedPostsRef = collection(db, 'saved_posts');
        const q = query(
            savedPostsRef,
            where('postId', '==', postId),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Remove bookmark
            await deleteDoc(doc(db, 'saved_posts', snapshot.docs[0].id));
            return { success: true, isSaved: false };
        } else {
            // Add bookmark
            await addDoc(savedPostsRef, {
                postId,
                userId,
                type,
                savedAt: new Date().toISOString()
            });
            return { success: true, isSaved: true };
        }
    } catch (error) {
        console.error("Error toggling save on post:", error);
        return { success: false, isSaved: false };
    }
};

export const checkIfPostSaved = async (postId: string, userId: string) => {
    try {
        const savedPostsRef = collection(db, 'saved_posts');
        const q = query(
            savedPostsRef,
            where('postId', '==', postId),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking saved status:", error);
        return false;
    }
};
