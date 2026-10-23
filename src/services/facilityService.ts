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
        id: 'annapurna-studios',
        name: 'Annapurna Studios & 7Acres',
        location: 'Banjara Hills & Jubilee Hills, Hyderabad',
        rating: 4.9,
        reviews: 320,
        price: '',
        image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1200&q=80',
        type: 'Studio',
        description: 'India\'s premier full-service production hub founded in 1976. Features 5 ultra-modern sound stages, 10,000 to 20,000 sq.ft climate-controlled shooting floors, high-capacity lighting grids, and Dolby Atmos certified sound mixing stages.',
        amenities: ['20,000 sq.ft Sound Stages', '40ft Clear Ceiling Height', 'Dolby Atmos Premier Mix', 'Motorized Lighting Grid', 'VIP Star Green Rooms', '100% Acoustic Isolation (STC 65+)']
    },
    {
        id: 'ramoji-film-city',
        name: 'Ramoji Film City Production Facilities',
        location: 'Ramoji Film City, Hyderabad',
        rating: 5.0,
        reviews: 950,
        price: '',
        image: 'https://images.unsplash.com/photo-1518929458119-e5bf404ecb0f?w=1200&q=80',
        type: 'Location',
        description: 'Guinness World Record holder as the world\'s largest film studio complex (2,000 acres). Offers 47 international thematic standing sets, Mughal/Rajasthani palaces, central jail blocks, vintage railway stations, and 40+ massive indoor sound floors.',
        amenities: ['47 Standing Sets', 'Central Airport & Railway Sets', 'Palace Courtyards & Old Streets', 'Prop & Wardrobe Vaults', 'Post-Production Labs', 'Production Basecamp Lodging']
    },
    {
        id: 'yash-raj-studios',
        name: 'YRF Studios (Yash Raj Films)',
        location: 'Andheri West, Mumbai',
        rating: 4.9,
        reviews: 410,
        price: '',
        image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80',
        type: 'Studio',
        description: 'State-of-the-art cinematic complex designed to strict Hollywood Hollywood/SMPTE acoustic standards. Features 3 acoustic sound stages, audio post suites, DI color grading theater, and full production crew support in Mumbai\'s film core.',
        amenities: ['SMPTE Acoustic Certified Stages', 'Barco 4K Cinema Grading Suite', 'Pre-lit Chroma Stages', 'Silent Central Air Handling', 'Fiber-Linked Post Suites', 'Underground Star Parking']
    },
    {
        id: 'prasad-post-labs',
        name: 'Prasad Film Laboratories & EFX',
        location: 'Saligramam, Chennai & Hyderabad',
        rating: 4.9,
        reviews: 280,
        price: '',
        image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80',
        type: 'Post-Production',
        description: 'Pioneers of Indian film processing and digital intermediate. Renowned for Academy-award winning preservation, 4K/8K HDR color grading on Baselight, Dolby Vision master mastering, visual effects, and multi-lingual audio mastering.',
        amenities: ['Baselight 4K HDR Grading Theatre', 'Dolby Vision Mastering Suite', 'Film Scanning 65mm/35mm/16mm', 'VFX Pipeline Integration', 'High-Speed SAN Infrastructure', 'Auro-3D & Atmos Dubbing']
    },
    {
        id: 'arri-cine-rentals-india',
        name: 'ARRI Cinema & Prime Cine Rentals',
        location: 'Goregaon West, Mumbai & Film Nagar, Hyderabad',
        rating: 4.9,
        reviews: 215,
        price: '',
        image: 'https://images.unsplash.com/photo-1517604101542-7994e073c6d1?w=1200&q=80',
        type: 'Equipment',
        description: 'Certified rental house stocking top-tier digital cinema camera packages, Master Anamorphic and Supreme Prime lenses, Technocrane, Ronin 4D rigs, and high-output ARRI SkyPanel/Orbiter LED lighting trucks.',
        amenities: ['ARRI ALEXA 35 & Mini LF Packages', 'Cooke & Master Anamorphic Glass', '50ft Technocrane & Grip Packages', 'Generator Van & Power Distribution', 'Wireless Video Village Transmitters', 'On-Set DIT Mobile Carts']
    },
    {
        id: 'abbey-road-studios',
        name: 'Abbey Road Studios',
        location: 'St John\'s Wood, London, UK',
        rating: 5.0,
        reviews: 1420,
        price: '',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80',
        type: 'Dubbing',
        description: 'The world\'s most revered recording studio and orchestral scoring stage. Studio One accommodates a 110-piece symphony orchestra and 100-piece choir for iconic Hollywood and world cinema feature film scores.',
        amenities: ['110-Piece Orchestral Scoring Stage', 'Neve 88RS 72-Channel Console', 'Dolby Atmos Spatial Mixing', 'Vintage Tube Microphones', 'Steinway Model D Concert Grands', 'Dedicated Film Playback Engineers']
    },
    {
        id: 'pinewood-studios-uk',
        name: 'Pinewood Studios Group',
        location: 'Iver Heath, Buckinghamshire, UK',
        rating: 5.0,
        reviews: 860,
        price: '',
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
        type: 'Studio',
        description: 'Home of the legendary 007 Stage and blockbuster international cinema franchises. Provides 200+ acres of world-class sound stages, exterior water filming tanks, green screen stages, and global backlots.',
        amenities: ['59,000 sq.ft 007 Sound Stage', 'Underwater Filming Stage & Deep Tank', 'Permanent Exterior Backlot Streets', 'Full Production Workshops', 'Cine VFX Virtual Production Volumes', 'International Customs Clearances']
    },
    {
        id: 'heritage-old-house',
        name: 'Heritage Courtyard Ancestral Estate',
        location: 'Gandipet & Chilkur, Hyderabad',
        rating: 4.8,
        reviews: 94,
        price: '',
        image: 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=1200&q=80',
        type: 'Location',
        description: 'Authentic 80-year-old traditional South Indian courtyard mansion with carved teakwood pillars, antique corridors, red oxide verandahs, and expansive quiet grounds perfect for period and dramatic feature cinema.',
        amenities: ['Open Central Courtyard', 'Heritage Carved Teakwood Pillars', 'Dedicated AC Makeup & Vanity Bay', 'Quiet Acoustic Perimeter', 'Ample Unit Parking & Generator Bays', 'Pre-lit Outdoor Garden Grounds']
    },
    {
        id: 'chettinad-bungalow',
        name: 'Vintage Chettinad Film Heritage House',
        location: 'Jubilee Hills / Film Nagar, Hyderabad',
        rating: 4.9,
        reviews: 130,
        price: '',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&q=80',
        type: 'Location',
        description: 'Grand colonial and Chettinad-style heritage bungalow featuring high ceilings, stained glass windows, brass fixtures, and lush green lawns suited for wedding, drama, and retro period film sequences.',
        amenities: ['High Ceilings & Large Windows', 'Authentic Vintage Period Furniture', 'Private Green Room Suites', '2-Acre Secured Perimeter', '24/7 Security & Shooting Permissions', 'Easy Heavy Vehicle Access']
    },
    {
        id: 'saradhi-studios',
        name: 'Saradhi Studios & Shooting Floors',
        location: 'Ameerpet, Hyderabad',
        rating: 4.7,
        reviews: 165,
        price: '',
        image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80',
        type: 'Studio',
        description: 'Historic and centrally located production institution offering spacious shooting floors, outdoor sets, ready-to-rig lighting grids, and dedicated soundproof dubbing suites serving Telugu and Indian cinema since 1956.',
        amenities: ['3 Historic Shooting Stages', 'Central City Access', 'Dedicated Audio Dubbing Bays', 'Heavy Duty Overhead Grids', 'Costume & Makeup Suites', 'Art Department Workshops']
    },
    {
        id: 'royal-haveli',
        name: 'Old Nizam Heritage Haveli & Courtyards',
        location: 'Old City, Hyderabad',
        rating: 4.8,
        reviews: 82,
        price: '',
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
        type: 'Location',
        description: 'Colonial and Indo-Islamic era heritage stone palace with high arches, ornate stucco work, antique chandeliers, and authentic royal courtyards for historical epics and commercials.',
        amenities: ['Arched Stone Corridors', 'Vintage Chandeliers & Stucco Work', 'Expansive Courtyard for Jib/Crane', 'Night Lighting Readiness', 'Unit Dining & Rest Areas']
    },
    {
        id: 'police-court-set',
        name: 'Cinema Police Station & Modular Courtroom Set',
        location: 'Ramoji / Hayathnagar Road, Hyderabad',
        rating: 4.9,
        reviews: 155,
        price: '',
        image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80',
        type: 'Studio',
        description: 'Fully dressed and ready-to-roll modular police station, lockup jail cells, commissioner office, and realistic courtroom set with pre-installed props, benches, and cinematic lighting setups.',
        amenities: ['Full Lockup Jail Cells', 'Modular Judge & Courtroom Benches', 'Police Commissioner Cabin Props', 'Interrogation Room & Two-Way Mirror', 'Pre-rigged Dimmer Panels', 'Air-Conditioned Cast Lounges']
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
