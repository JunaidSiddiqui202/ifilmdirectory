import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    Timestamp,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';

export interface ShortlistedTalent {
    userId: string;
    role: string;
    status: 'shortlisted' | 'contacted' | 'hired' | 'rejected';
    addedAt: Timestamp;
    userName?: string;
    userPhoto?: string;
}

export interface ProductionProject {
    id?: string;
    name: string;
    description: string;
    producerId: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: Timestamp;
    startDate?: string;
    location?: string;
    shortlist: ShortlistedTalent[];
}

export const projectService = {
    createProject: async (projectData: Omit<ProductionProject, 'id' | 'createdAt' | 'shortlist'>) => {
        const docRef = await addDoc(collection(db, 'projects'), {
            ...projectData,
            createdAt: Timestamp.now(),
            shortlist: []
        });
        return docRef.id;
    },

    getProducerProjects: async (producerId: string) => {
        const q = query(
            collection(db, 'projects'),
            where('producerId', '==', producerId)
        );
        const snapshot = await getDocs(q);
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProductionProject[];

        // Sort by createdAt desc in-memory to avoid index requirement
        return projects.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });
    },

    getProjectById: async (projectId: string) => {
        const docSnap = await getDoc(doc(db, 'projects', projectId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as ProductionProject;
        }
        return null;
    },

    addToShortlist: async (projectId: string, talent: Omit<ShortlistedTalent, 'addedAt'>) => {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            shortlist: arrayUnion({
                ...talent,
                addedAt: Timestamp.now()
            })
        });
    },

    removeFromShortlist: async (projectId: string, userId: string) => {
        const projectRef = doc(db, 'projects', projectId);
        const project = await projectService.getProjectById(projectId);
        if (!project) return;

        const talentToRemove = project.shortlist.find(t => t.userId === userId);
        if (talentToRemove) {
            await updateDoc(projectRef, {
                shortlist: arrayRemove(talentToRemove)
            });
        }
    },

    updateTalentStatus: async (projectId: string, userId: string, newStatus: ShortlistedTalent['status']) => {
        const projectRef = doc(db, 'projects', projectId);
        const project = await projectService.getProjectById(projectId);
        if (!project) return;

        const updatedShortlist = project.shortlist.map(talent => {
            if (talent.userId === userId) {
                return { ...talent, status: newStatus };
            }
            return talent;
        });

        await updateDoc(projectRef, { shortlist: updatedShortlist });
    },

    deleteProject: async (projectId: string) => {
        await deleteDoc(doc(db, 'projects', projectId));
    },

    seedProjects: async (userId: string) => {
        const dummyProjects = [
            {
                name: "Midnight in Mumbai",
                description: "A neo-noir thriller set in the underbelly of Mumbai. We are currently scouting for locations and technical crew. Focusing on high-contrast visuals and immersive soundscapes.",
                location: "Mumbai, India",
                producerId: userId,
                status: 'active' as const,
                shortlist: [
                    {
                        userId: 'talent-1',
                        userName: 'Arjun Mehra',
                        role: 'Cinematographer',
                        status: 'shortlisted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
                        addedAt: Timestamp.now()
                    },
                    {
                        userId: 'talent-2',
                        userName: 'Sarah Khan',
                        role: 'Production Designer',
                        status: 'contacted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
                        addedAt: Timestamp.now()
                    }
                ]
            },
            {
                name: "The Last Script",
                description: "Experimental short film about a writer's block that manifests physically. Heavy use of CGI and practical effects. Post-production intensive.",
                location: "London, UK",
                producerId: userId,
                status: 'active' as const,
                shortlist: []
            },
            {
                name: "Desert Echoes",
                description: "Documentary exploring the folk music of Rajasthan. Focus on authentic storytelling and capturing the vastness of the Thar desert.",
                location: "Jaisalmer, India",
                producerId: userId,
                status: 'active' as const,
                shortlist: [
                    {
                        userId: 'talent-3',
                        userName: 'Vikram Singh',
                        role: 'Sound Mixer',
                        status: 'hired' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
                        addedAt: Timestamp.now()
                    }
                ]
            }
        ];

        for (const project of dummyProjects) {
            await addDoc(collection(db, 'projects'), {
                ...project,
                createdAt: Timestamp.now()
            });
        }
    }
};
