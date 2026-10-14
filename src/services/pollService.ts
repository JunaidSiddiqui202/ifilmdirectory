import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
    voters: string[]; // User IDs to prevent double voting
    active: boolean;
    type: 'daily' | 'general';
    createdAt: any;
}

class PollService {
    private collectionName = 'polls';

    async getActiveDailyPoll(): Promise<Poll | null> {
        try {
            // Ultimate simplification to avoid any index requirement
            const q = query(
                collection(db, this.collectionName),
                where('active', '==', true)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const polls = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Poll))
                .filter(p => p.type === 'daily');

            // Sort in memory instead of Firestore to avoid index requirement
            return polls.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeB - timeA;
            })[0] || null;
        } catch (error) {
            console.error("Error getting active daily poll:", error);
            return null;
        }
    }

    async vote(pollId: string, optionId: string, userId: string) {
        try {
            const pollRef = doc(db, this.collectionName, pollId);
            const pollSnap = await getDoc(pollRef);

            if (!pollSnap.exists()) throw new Error("Poll not found");

            const pollData = pollSnap.data() as Poll;
            if (pollData.voters.includes(userId)) {
                throw new Error("User has already voted on this poll");
            }

            const updatedOptions = pollData.options.map(opt => {
                if (opt.id === optionId) {
                    return { ...opt, votes: (opt.votes || 0) + 1 };
                }
                return opt;
            });

            await updateDoc(pollRef, {
                options: updatedOptions,
                totalVotes: increment(1),
                voters: [...pollData.voters, userId]
            });

            return true;
        } catch (error) {
            console.error("Error voting on poll:", error);
            throw error;
        }
    }

    // Admin helper to create a default daily poll if none exists
    async createDailyPoll(question: string, optionTexts: string[]) {
        const options: PollOption[] = optionTexts.map((text, index) => ({
            id: String(index + 1),
            text,
            votes: 0
        }));

        const pollData: Omit<Poll, 'id'> = {
            question,
            options,
            totalVotes: 0,
            voters: [],
            active: true,
            type: 'daily',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, this.collectionName), pollData);
        return docRef.id;
    }
}

export const pollService = new PollService();
