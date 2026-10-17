import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

export interface AdCampaign {
    id?: string;
    title: string;
    imageUrl: string;
    targetUrl: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'paused' | 'ended';
    placement: 'home_feed' | 'sidebar' | 'profile_top' | 'cinema_wire' | 'directory_pinned';
    views: number;
    clicks: number;
    createdAt?: string;
    clientName?: string;
    clientContact?: string;
    dealValue?: string | number;
    notes?: string;
}

export const createCampaign = async (campaign: Omit<AdCampaign, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'ads'), campaign);
        return { id: docRef.id, ...campaign };
    } catch (error) {
        console.error("Error creating ad campaign:", error);
        throw error;
    }
};

export const getCampaigns = async (): Promise<AdCampaign[]> => {
    try {
        const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign));
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return [];
    }
};

export const updateCampaignStatus = async (id: string, status: 'active' | 'paused' | 'ended') => {
    try {
        const adRef = doc(db, 'ads', id);
        await updateDoc(adRef, { status });
    } catch (error) {
        console.error("Error updating campaign status:", error);
        throw error;
    }
};

export const deleteCampaign = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'ads', id));
    } catch (error) {
        console.error("Error deleting campaign:", error);
        throw error;
    }
};

export const trackAdClick = async (id: string, currentClicks: number) => {
    try {
        const adRef = doc(db, 'ads', id);
        await updateDoc(adRef, { clicks: currentClicks + 1 });
    } catch (error) {
        console.error("Error tracking ad click:", error);
    }
};

export const calculateCommercialMetrics = (campaigns: AdCampaign[]) => {
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.views || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const activeCount = campaigns.filter(c => c.status === 'active').length;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return {
        totalImpressions,
        totalViews: totalImpressions,
        totalClicks,
        activeCount,
        ctr: `${ctr}%`
    };
};
