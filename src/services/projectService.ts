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
    format?: 'Feature Film' | 'Web Series' | 'Short Film' | 'Documentary' | 'Music Video' | 'Commercial';
    genre?: string;
    productionPhase?: 'Development' | 'Pre-Production' | 'Principal Photography' | 'Post-Production' | 'Distribution';
    budgetTier?: 'Indie Micro' | 'Medium Budget' | 'Tentpole / Large Scale';
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
                name: "Varanasi: City of Shadows",
                description: "An investigative neo-noir psychological thriller set against the ghats of Varanasi and Lucknow. Exploring deep anamorphic visuals, night river sequences, and sync sound design.",
                location: "Varanasi & Lucknow",
                format: "Feature Film" as const,
                genre: "Crime / Noir / Thriller",
                productionPhase: "Pre-Production" as const,
                budgetTier: "Medium Budget" as const,
                producerId: userId,
                status: 'active' as const,
                shortlist: [
                    {
                        userId: 'cin-santosh-sivan',
                        userName: 'Santosh Sivan, ISC',
                        role: 'Director of Photography',
                        status: 'shortlisted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop',
                        addedAt: Timestamp.now()
                    },
                    {
                        userId: 'snd-rasool-pookutty',
                        userName: 'Resul Pookutty, CAS',
                        role: 'Sound Designer',
                        status: 'contacted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop',
                        addedAt: Timestamp.now()
                    },
                    {
                        userId: 'art-sabha-cyril',
                        userName: 'Sabu Cyril',
                        role: 'Production Designer',
                        status: 'shortlisted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=500&fit=crop',
                        addedAt: Timestamp.now()
                    }
                ]
            },
            {
                name: "The Western Ghats Expedition",
                description: "Natural history and indigenous culture documentary series exploring the biodiversity corridor of Kerala and Karnataka. Minimal footprint practical documentary unit.",
                location: "Wayanad, Kerala & Coorg, Karnataka",
                format: "Web Series" as const,
                genre: "Documentary / Nature",
                productionPhase: "Development" as const,
                budgetTier: "Indie Micro" as const,
                producerId: userId,
                status: 'active' as const,
                shortlist: [
                    {
                        userId: 'edit-deepu-joseph',
                        userName: 'Deepu Joseph',
                        role: 'Film Editor & Colorist',
                        status: 'hired' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&h=500&fit=crop',
                        addedAt: Timestamp.now()
                    }
                ]
            },
            {
                name: "Salaam Hyderabad: 1983",
                description: "Period political drama chronicling cultural shifts and street cinema halls of 1980s Old City Hyderabad. Extensive vintage set recreations and practical special effects.",
                location: "Ramoji Film City & Hyderabad Studios",
                format: "Feature Film" as const,
                genre: "Period Drama / Action",
                productionPhase: "Principal Photography" as const,
                budgetTier: "Tentpole / Large Scale" as const,
                producerId: userId,
                status: 'active' as const,
                shortlist: [
                    {
                        userId: 'dp-k-k-senthil-kumar',
                        userName: 'K. K. Senthil Kumar, ISC',
                        role: 'Director of Photography',
                        status: 'hired' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop',
                        addedAt: Timestamp.now()
                    },
                    {
                        userId: 'wri-juhi-chaturvedi',
                        userName: 'Juhi Chaturvedi',
                        role: 'Screenwriter & Dialogues',
                        status: 'contacted' as const,
                        userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop',
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
