import { collection, getDocs, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Facility {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviews: number;
    price: string;
    image: string;
    type: string;
    description?: string;
    amenities?: string[];
    owner_verification?: string;
}

const MOCK_SERVICES: Facility[] = [
    {
        id: '1',
        name: 'Annapurna Studios',
        location: 'Banjara Hills, Hyderabad',
        rating: 4.9,
        reviews: 240,
        price: '₹25,000/day',
        image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&q=80',
        type: 'Studio',
        description: 'Premier film production facility in Hyderabad.'
    },
    {
        id: '2',
        name: 'Suresh Productions',
        location: 'Film Nagar, Hyderabad',
        rating: 4.8,
        reviews: 180,
        price: '₹20,000/day',
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
        type: 'Studio',
        description: 'One of Indias largest film production companies.'
    },
    {
        id: 'heritage-old-house',
        name: 'Heritage Courtyard Old House',
        location: 'Gandipet, Hyderabad',
        rating: 4.8,
        reviews: 72,
        price: '₹22,000/day',
        image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=800&q=80',
        type: 'Location',
        description: 'Authentic 70-year-old traditional courtyard house with vintage wooden pillars and antique corridors ideal for periodic & emotional cinema shoots.',
        amenities: ['Courtyard', 'Traditional Kitchen', 'Vintage Furniture', 'Generator Backup', 'Actor Green Room']
    },
    {
        id: 'chettinad-bungalow',
        name: 'Vintage Chettinad Film House',
        location: 'Film Nagar, Hyderabad',
        rating: 4.9,
        reviews: 110,
        price: '₹25,000/day',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        type: 'Location',
        description: 'Spacious retro style old house with antique verandah, vintage windows, and red oxide flooring for feature films.',
        amenities: ['Retro Verandah', 'Red Oxide Floors', '2 Acre Compound', 'AC Makeup Suite']
    },
    {
        id: 'royal-haveli',
        name: 'Old Nizam Haveli & Vintage House',
        location: 'Old City, Hyderabad',
        rating: 4.7,
        reviews: 54,
        price: '₹24,000/day',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
        type: 'Location',
        description: 'Colonial era heritage stone house with high ceilings, arched doorways and authentic vintage architecture.',
        amenities: ['Arched Doorways', 'Vintage Stone Walls', 'Spacious Parking', 'Crew Dining Space']
    },
    {
        id: 'police-court-set',
        name: 'Cinema Police Station & Jail Set',
        location: 'Ramoji Road, Hyderabad',
        rating: 4.9,
        reviews: 135,
        price: '₹18,000/day',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
        type: 'Studio',
        description: 'Full modular police station, lockup jail cells and interrogation room ready with film props.',
        amenities: ['Jail Cells', 'Commissioner Office', 'Gun Rack Props', 'Interrogation Room']
    },
    {
        id: 'abbey-road',
        name: 'Abbey Road Studios',
        location: 'London, UK',
        rating: 5.0,
        reviews: 1200,
        price: '£500/hr',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80',
        type: 'Post-Production',
        description: 'World-famous recording and post-production studio.'
    },
    {
        id: 'cine-rentals',
        name: 'CineRentals Mumbai',
        location: 'Andheri West, Mumbai',
        rating: 4.7,
        reviews: 95,
        price: '₹10,000/day',
        image: 'https://images.unsplash.com/photo-1517604101542-7994e073c6d1?w=800&q=80',
        type: 'Equipment',
        description: 'Quality camera and lighting equipment for rent.'
    }
];

export const facilityService = {
    getFacilities: async (category?: string) => {
        try {
            // 1. Fetch real data from Firestore
            const q = query(collection(db, 'facilities'));
            const snapshot = await getDocs(q);
            const dbData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Facility[];

            // 2. Start with our "Anchor" mock data
            let masterList = [...MOCK_SERVICES];

            // 3. Merge DB data (avoiding duplicates of our anchors by name)
            dbData.forEach(dbItem => {
                const isDuplicate = masterList.some(
                    mock => mock.name.toLowerCase() === dbItem.name.toLowerCase()
                );
                if (!isDuplicate) {
                    masterList.push(dbItem);
                }
            });

            // 4. Handle Filtering
            if (category && category !== 'All') {
                const targetCat = category.toLowerCase();

                return masterList.filter(item => {
                    const itemType = item.type.toLowerCase();

                    // Specific mapping for categories
                    if (targetCat === 'studio') {
                        return itemType === 'studio' || itemType === 'shooting floor' || itemType === 'sound stage';
                    }
                    if (targetCat === 'post-production') {
                        return itemType === 'post-production' || itemType === 'dubbing suite' || itemType === 'vfx studio' || itemType === 'edit suite';
                    }
                    if (targetCat === 'equipment') {
                        return itemType === 'equipment' || itemType === 'camera rental' || itemType === 'rental house';
                    }

                    return itemType === targetCat;
                });
            }

            return masterList;
        } catch (error) {
            console.error("Facility Fetch Error:", error);
            // Fallback to mock data if Firestore fails
            if (category && category !== 'All') {
                const targetCat = category.toLowerCase();
                return MOCK_SERVICES.filter(m => m.type.toLowerCase() === targetCat);
            }
            return MOCK_SERVICES;
        }
    },
    getLatestFacilities: async (limitCount: number = 5) => {
        try {
            const data = await facilityService.getFacilities();
            // Sort by createdAt if exists, otherwise by ID
            return data
                .sort((a: any, b: any) => {
                    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return timeB - timeA;
                })
                .slice(0, limitCount);
        } catch (error) {
            console.error("Error getting latest facilities:", error);
            return [];
        }
    },
    getFacilityById: async (id: string): Promise<Facility | null> => {
        try {
            const facilities = await facilityService.getFacilities();
            return facilities.find(f => f.id === id) || null;
        } catch (error) {
            console.error("Error getting facility by ID:", error);
            return null;
        }
    },
    updateFacility: async (id: string, updates: Partial<Facility>): Promise<{ success: boolean; error?: string }> => {
        try {
            const facilityRef = doc(db, 'facilities', id);
            await updateDoc(facilityRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error: any) {
            console.error("Error updating facility:", error);
            return { success: false, error: error.message || 'Failed to update facility' };
        }
    }
};
