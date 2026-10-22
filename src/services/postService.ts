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
    quotedText?: string;
    blockId?: string;
    inlineIndex?: number;
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

export const getPosts = async (limitCount: number = 40, bypassCache: boolean = false) => {
    if (!bypassCache && postsCache && Date.now() - postsCache.timestamp < POSTS_CACHE_TTL) {
        return postsCache.posts;
    }

    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PostData[];
        postsCache = { posts, timestamp: Date.now() };
        return posts;
    } catch (error) {
        console.error("Error getting posts: ", error);
        return postsCache?.posts || [];
    }
};

export const subscribeToPosts = (callback: (posts: PostData[]) => void, limitCount: number = 40) => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PostData[];
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
