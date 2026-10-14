import {
    collection,
    addDoc,
    query,
    getDocs,
    getDoc,
    deleteDoc,
    doc,
    updateDoc,
    orderBy,
    limit,
    increment,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Showreel {
    id: string;
    title: string;
    creator: string;
    creatorId: string;
    creatorPhoto?: string;
    views: number;
    likes: number;
    comments: number;
    thumbnail: string;
    videoUrl: string;
    type: 'video' | 'embed';
    category?: string;
    createdAt: any;
    isTrending?: boolean;
    isLiked?: boolean;
}

class ShowreelService {
    private collectionName = 'showreels';

    async createShowreel(data: Omit<Showreel, 'id' | 'createdAt' | 'views' | 'likes' | 'comments'>) {
        try {
            const docRef = await addDoc(collection(db, this.collectionName), {
                ...data,
                views: 0,
                likes: 0,
                comments: 0,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating showreel:", error);
            throw error;
        }
    }

    async getShowreelById(id: string): Promise<Showreel | null> {
        try {
            const docRef = doc(db, this.collectionName, id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return { id: snap.id, ...snap.data() } as Showreel;
            }
            return null;
        } catch (error) {
            console.error("Error fetching showreel by ID:", error);
            return null;
        }
    }

    async getTrendingShowreels(count: number = 10): Promise<Showreel[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy('createdAt', 'desc'),
                limit(count)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || 0,
                comments: doc.data().comments || 0
            } as Showreel));
        } catch (error) {
            console.error("Error fetching showreels:", error);
            return [];
        }
    }

    async getFollowingShowreels(_userId: string, count: number = 10): Promise<Showreel[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                orderBy('createdAt', 'desc'),
                limit(count)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                likes: doc.data().likes || 0,
                comments: doc.data().comments || 0
            } as Showreel));
        } catch (error) {
            console.error("Error fetching following showreels:", error);
            return [];
        }
    }

    async incrementViews(showreelId: string) {
        try {
            const docRef = doc(db, this.collectionName, showreelId);
            await updateDoc(docRef, {
                views: increment(1)
            });
        } catch (error) {
            console.error("Error incrementing views:", error);
        }
    }

    async seedShowreels() {
        const demoShowreels = [
            {
                title: 'Dramatic Monologue',
                creator: 'Priya Sharma',
                creatorId: 'demo_priya',
                thumbnail: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=360&h=640&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                type: 'video' as const,
                views: 1200000,
                likes: 45000,
                comments: 1240
            },
            {
                title: 'Action Audition',
                creator: 'Aditya Singh',
                creatorId: 'demo_aditya',
                thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=360&h=640&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
                type: 'video' as const,
                views: 980000,
                likes: 32000,
                comments: 890
            },
            {
                title: 'Classical Dance',
                creator: 'Ananya Reddy',
                creatorId: 'demo_ananya',
                thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=360&h=640&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
                type: 'video' as const,
                views: 854000,
                likes: 21000,
                comments: 450
            },
            {
                title: 'Viral Comedy',
                creator: 'Rohan Joshi',
                creatorId: 'demo_rohan',
                thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=360&h=640&fit=crop',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                type: 'video' as const,
                views: 712000,
                likes: 15600,
                comments: 230
            }
        ];

        for (const reel of demoShowreels) {
            try {
                await addDoc(collection(db, this.collectionName), {
                    ...reel,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                console.error("Seeding item failed:", e);
            }
        }
    }

    async clearAllShowreels() {
        try {
            const snapshot = await getDocs(collection(db, this.collectionName));
            const deletePromises = snapshot.docs.map(doc =>
                deleteDoc(doc.ref)
            );
            await Promise.all(deletePromises);
            console.log(`Cleared ${snapshot.docs.length} showreels`);
        } catch (error) {
            console.error("Error clearing showreels:", error);
            throw error;
        }
    }
}

export const showreelService = new ShowreelService();
