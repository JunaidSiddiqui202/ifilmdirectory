import { collection, addDoc, getDocs, getDoc, doc, query, orderBy, where, Timestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface ContentBlock {
    id: string;
    type: 'text' | 'image' | 'heading';
    content: string;
    style?: 'bold' | 'italic' | 'normal';
    imageSize?: 'small' | 'medium' | 'large' | 'full';
    imageAlign?: 'left' | 'center' | 'right';
}

export interface EventDetails {
    eventDate: string;
    eventTime: string;
    location: string;
    ticketLink?: string;
    ticketPrice?: string;
    organizer?: string;
}

export interface BlogPost {
    id?: string;
    title: string;
    excerpt: string;
    content: string; // Legacy: plain text or HTML
    contentBlocks?: ContentBlock[]; // New: structured content blocks
    eventDetails?: EventDetails; // New: Event specific details
    author: string;
    authorId: string;
    authorPhoto?: string;
    image: string; // Cover image (first image from contentBlocks or uploaded)
    category: string;
    language?: string;
    views: number;
    likes: number;
    date: any; // Timestamp
    updatedAt?: any;
}

export const blogService = {
    // Create a new blog post or event
    createBlog: async (blogData: {
        title: string;
        contentBlocks: ContentBlock[];
        category: string;
        language: string;
        authorId: string;
        author: string;
        authorPhoto?: string;
        eventDetails?: EventDetails;
    }) => {
        try {
            // Extract first image as cover image
            const firstImage = blogData.contentBlocks.find(block => block.type === 'image');
            const coverImage = firstImage?.content || '';

            // Generate excerpt from first text block
            const firstText = blogData.contentBlocks.find(block => block.type === 'text');
            let excerpt = '';
            if (firstText) {
                // Strip HTML tags and limit to 150 chars
                excerpt = firstText.content.replace(/<[^>]*>/g, '').substring(0, 150);
                if (firstText.content.length > 150) excerpt += '...';
            }

            // Convert contentBlocks to plain content for legacy support
            const plainContent = blogData.contentBlocks
                .filter(b => b.type === 'text')
                .map(b => b.content.replace(/<[^>]*>/g, ''))
                .join('\n\n');

            const docRef = await addDoc(collection(db, 'blogs'), {
                title: blogData.title,
                content: plainContent,
                contentBlocks: blogData.contentBlocks,
                excerpt,
                image: coverImage,
                category: blogData.category,
                language: blogData.language,
                author: blogData.author,
                authorId: blogData.authorId,
                authorPhoto: blogData.authorPhoto || '',
                date: Timestamp.now(),
                eventDetails: blogData.eventDetails || null,
                views: 0,
                likes: 0
            });

            // Also create a social post so the blog appears in the main feed
            await addDoc(collection(db, 'posts'), {
                author: blogData.author,
                authorId: blogData.authorId,
                authorImage: blogData.authorPhoto || '',
                role: 'Blogger',
                content: `📝 New Blog Post: "${blogData.title}"\n\n${excerpt}\n\n👉 Read the full article on Blogs & Events`,
                authorVerified: false,
                image: coverImage,
                images: coverImage ? [coverImage] : [],
                likes: 0,
                likedBy: [],
                comments: 0,
                createdAt: Timestamp.now(),
                blogId: docRef.id, // Link to the full blog
                postType: 'blog'
            });

            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error creating blog:", error);
            return { success: false, error };
        }
    },

    // Update an existing blog post
    updateBlog: async (blogId: string, blogData: {
        title: string;
        contentBlocks: ContentBlock[];
        category: string;
        language: string;
    }) => {
        try {
            const blogRef = doc(db, 'blogs', blogId);

            // Extract first image as cover image
            const firstImage = blogData.contentBlocks.find(block => block.type === 'image');
            const coverImage = firstImage?.content || '';

            // Generate excerpt
            const firstText = blogData.contentBlocks.find(block => block.type === 'text');
            let excerpt = '';
            if (firstText) {
                excerpt = firstText.content.replace(/<[^>]*>/g, '').substring(0, 150);
                if (firstText.content.length > 150) excerpt += '...';
            }

            // Convert to plain content
            const plainContent = blogData.contentBlocks
                .filter(b => b.type === 'text')
                .map(b => b.content.replace(/<[^>]*>/g, ''))
                .join('\n\n');

            await updateDoc(blogRef, {
                title: blogData.title,
                content: plainContent,
                contentBlocks: blogData.contentBlocks,
                excerpt,
                image: coverImage,
                category: blogData.category,
                language: blogData.language,
                updatedAt: Timestamp.now()
            });

            return { success: true };
        } catch (error) {
            console.error("Error updating blog:", error);
            return { success: false, error };
        }
    },

    // Get a single blog post by ID
    getBlogById: async (blogId: string): Promise<BlogPost | null> => {
        try {
            const blogRef = doc(db, 'blogs', blogId);
            const blogSnap = await getDoc(blogRef);

            if (blogSnap.exists()) {
                return {
                    id: blogSnap.id,
                    ...blogSnap.data()
                } as BlogPost;
            }
            return null;
        } catch (error) {
            console.error("Error fetching blog:", error);
            return null;
        }
    },

    // Get all blogs, optionally filtered by category
    getBlogs: async (category?: string): Promise<BlogPost[]> => {
        try {
            let q = query(collection(db, 'blogs'), orderBy('date', 'desc'));
            if (category && category !== 'All') {
                q = query(collection(db, 'blogs'), where('category', '==', category), orderBy('date', 'desc'));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BlogPost[];
        } catch (error) {
            console.error("Error fetching blogs:", error);
            return [];
        }
    },

    // Delete a blog post
    deleteBlog: async (blogId: string) => {
        try {
            await deleteDoc(doc(db, 'blogs', blogId));
            return { success: true };
        } catch (error) {
            console.error("Error deleting blog:", error);
            return { success: false, error };
        }
    },

    // Increment view count
    incrementViews: async (blogId: string) => {
        try {
            const blogRef = doc(db, 'blogs', blogId);
            const blogSnap = await getDoc(blogRef);
            if (blogSnap.exists()) {
                const currentViews = blogSnap.data().views || 0;
                await updateDoc(blogRef, { views: currentViews + 1 });
            }
        } catch (error) {
            console.error("Error incrementing views:", error);
        }
    },

    // Like/unlike a blog post
    toggleLike: async (blogId: string, increment: boolean) => {
        try {
            const blogRef = doc(db, 'blogs', blogId);
            const blogSnap = await getDoc(blogRef);
            if (blogSnap.exists()) {
                const currentLikes = blogSnap.data().likes || 0;
                await updateDoc(blogRef, {
                    likes: increment ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }
};
