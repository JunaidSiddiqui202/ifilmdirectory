import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { aiService } from '../services/aiService';
import BottomNav from '../components/BottomNav';
import PostMedia from '../components/PostMedia';
import MapDiscovery from '../components/MapDiscovery';
import { facilityService, type Facility } from '../services/facilityService';
import { getUserProfile } from '../services/userService';
import { useToast } from '../context/ToastContext';

interface Service {
    id: string;
    name: string;
    description: string;
    specs?: string[];
    price?: string;
    duration?: string;
    image?: string;
}

interface Review {
    id: string;
    author: string;
    authorImage: string;
    rating: number;
    comment: string;
    date: string;
    projectType: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    image: string;
}

interface BusinessProfile {
    id: string;
    name: string;
    type: 'studio' | 'equipment' | 'post_production' | 'vanity_van' | 'location' | 'casting_agency' | 'production_house';
    tagline: string;
    description: string;
    coverImage: string;
    logo: string;
    location: string;
    city: string;
    established: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    ownerId: string;
    verified_tier?: 'gold' | 'blue' | 'gray';

    // Contact
    phone: string;
    email: string;
    website?: string;

    // Gallery
    gallery: string[];

    // Services
    services: Service[];

    // Reviews
    reviews: Review[];

    // Team
    team: TeamMember[];

    // Stats
    projectsCompleted: number;
    yearsExperience: number;

    // Availability
    isAvailable: boolean;
    nextAvailable?: string;
}

export default function BusinessProfile() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { currentUser } = useAuth();
    const { openAuthModal } = useAuthModal();
    const [activeTab, setActiveTab] = useState<'about' | 'services' | 'gallery' | 'reviews'>('about');
    const [showContactModal, setShowContactModal] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [savingBusiness, setSavingBusiness] = useState(false);
    const [enhancing, setEnhancing] = useState(false);
    const toast = useToast();

    const handleSaveBusiness = async () => {
        if (!business || !id) return;
        setSavingBusiness(true);
        try {
            const res = await facilityService.updateFacility(id, {
                name: business.name,
                description: business.description
            });
            if (res.success) {
                setIsEditing(false);
                toast.success("Profile changes saved successfully!");
            } else {
                toast.error("Failed to save changes: " + (res.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error saving business profile:", error);
            toast.error("Failed to save changes. Please try again.");
        } finally {
            setSavingBusiness(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: business.name,
                    text: business.tagline || `Check out ${business.name} on iFilmDirectory`,
                    url: window.location.href
                });
            } catch (err) {
                // User cancelled or unsupported
            }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    // Mock data - Replace with actual API call
    const [business, setBusiness] = useState<BusinessProfile>({
        id: id || '1',
        name: 'Annapurna Studios',
        type: 'studio',
        tagline: 'Where Stories Come to Life',
        description: 'Annapurna Studios is one of India\'s premier film production facilities, established in 1976. We offer state-of-the-art shooting floors, post-production facilities, and equipment rental services. Our 22-acre campus in Hyderabad has been home to countless blockbuster films and continues to be the preferred choice for filmmakers across India.',
        coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=400&fit=crop',
        logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop',
        location: 'Film Nagar, Hyderabad',
        city: 'Hyderabad',
        established: '1976',
        rating: 4.8,
        reviewCount: 247,
        verified: true,
        ownerId: 'demo_owner_123', // Demo owner ID
        phone: '+91 40 2355 5555',
        email: 'bookings@annapurnastudios.com',
        website: 'www.annapurnastudios.com',
        gallery: [
            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=800&h=600&fit=crop',
        ],
        services: [
            {
                id: '1',
                name: 'Indoor Acoustic Shooting Floor (Floor 1 & 2)',
                description: '15,000 sq ft climate-controlled sound stage with 42ft clear height, 200kW motorized lighting grid, elephant door unit access, and calibrated green screen cyc wall.',
                specs: ['15,000 Sq.Ft Clear Floor', '42ft Clear Height', 'Motorized Lighting Grid', 'Sound Transmission Class STC 65+'],
                image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop'
            },
            {
                id: '2',
                name: 'Heritage Standing Sets & Backlot',
                description: 'Permanent exterior backlot featuring South Indian courtyard streets, police stations, courtrooms, and modular mansion facades with generator points.',
                specs: ['4-Acre Standing Exterior Sets', 'Authentic Teak Corridors', 'Pre-rigged Unit Parking', '24/7 Security Clearance'],
                image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=600&fit=crop'
            },
            {
                id: '3',
                name: 'Dolby Atmos Premier Post Suite & DI Theatre',
                description: 'Certified 64-speaker Dolby Atmos mix stage, Christie 4K laser projection, Baselight color grading suite, and multi-track ADR recording booth.',
                specs: ['Dolby Atmos Theatrical Mixing', 'Christie 4K DCI Projection', 'Baselight 4K HDR DI Suite', 'ADR Voice-over Booth'],
                image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop'
            },
            {
                id: '4',
                name: 'Cine Camera & Technocrane Grip Package',
                description: 'Full cinema camera packages including ARRI ALEXA 35, Mini LF, RED V-Raptor XL, Master Anamorphic prime glass, 50ft Technocrane, and cine lighting trucks.',
                specs: ['ARRI ALEXA 35 & Mini LF', 'Cooke / ARRI Master Anamorphics', 'Technocrane 50ft & Ronin 4D', 'SkyPanel / Aputure Cine Lighting'],
                image: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=800&h=600&fit=crop'
            }
        ],
        reviews: [
            {
                id: '1',
                author: 'Rajamouli S.S.',
                authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
                rating: 5,
                comment: 'Exceptional facilities and professional staff. We shot major portions of our film here and the experience was seamless. Highly recommended!',
                date: '2 weeks ago',
                projectType: 'Feature Film'
            },
            {
                id: '2',
                author: 'Priya Sharma',
                authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                rating: 5,
                comment: 'The post-production suite is world-class. The color grading team helped us achieve the exact look we wanted.',
                date: '1 month ago',
                projectType: 'Web Series'
            },
            {
                id: '3',
                author: 'Vikram Reddy',
                authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                rating: 4,
                comment: 'Great infrastructure and equipment. The outdoor sets are particularly impressive. Booking process was smooth.',
                date: '2 months ago',
                projectType: 'Commercial'
            }
        ],
        team: [
            { id: '1', name: 'Ramesh Kumar', role: 'Studio Manager', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
            { id: '2', name: 'Anjali Menon', role: 'Booking Coordinator', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
            { id: '3', name: 'Suresh Babu', role: 'Technical Head', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
        ],
        projectsCompleted: 500,
        yearsExperience: 48,
        isAvailable: true,
        nextAvailable: 'Available Now'
    });

    useEffect(() => {
        const fetchBusinessData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Try to fetch from Facility Service first (for booking IDs)
                const facilityData: Facility | null = await facilityService.getFacilityById(id);

                if (facilityData) {
                    setBusiness({
                        id: facilityData.id,
                        name: facilityData.name,
                        type: (facilityData.type.toLowerCase().replace(/[- ]/g, '_') as any) || 'studio',
                        tagline: facilityData.description || 'Professional Media Facility',
                        description: facilityData.description || 'No description available.',
                        coverImage: facilityData.image,
                        logo: facilityData.image, // Using same image for logo if not separate
                        location: facilityData.location,
                        city: facilityData.location.split(',').pop()?.trim() || 'India',
                        established: 'N/A',
                        rating: facilityData.rating,
                        reviewCount: facilityData.reviews,
                        verified: true,
                        ownerId: 'system',
                        phone: '+91 000 000 0000',
                        email: 'contact@ifilmdirectory.com',
                        gallery: [facilityData.image],
                        services: (facilityData.amenities && facilityData.amenities.length > 0)
                            ? facilityData.amenities.map((amenity, idx) => ({
                                id: String(idx + 1),
                                name: amenity,
                                description: `Certified studio capability for feature films, web series, and cinema shoots.`,
                                specs: [amenity, 'Film Unit Ready', 'Acoustic / Power Certified'],
                                image: facilityData.image
                            }))
                            : [
                                {
                                    id: '1',
                                    name: `${facilityData.type} Floor & Facilities`,
                                    description: facilityData.description || 'Full production access to shooting stage, power backup, and crew amenities.',
                                    specs: ['Cine Certified', 'Production Unit Parking', 'Direct Studio Liaison'],
                                    image: facilityData.image
                                }
                            ],
                        reviews: [],
                        team: [],
                        projectsCompleted: 100,
                        yearsExperience: 5,
                        isAvailable: true,
                        nextAvailable: 'Available Now'
                    });
                } else {
                    // 2. Try to fetch from User Service (for service provider profiles)
                    const userProfile = await getUserProfile(id);
                    if (userProfile) {
                        setBusiness({
                            id: userProfile.uid,
                            name: userProfile.displayName || 'Service Provider',
                            type: (userProfile.role?.toLowerCase().replace(/ /g, '_') as any) || 'service',
                            tagline: userProfile.bio?.substring(0, 50) || 'Industry Professional',
                            description: userProfile.bio || 'No bio available.',
                            coverImage: userProfile.photoURL || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=400&fit=crop',
                            logo: userProfile.photoURL || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop',
                            location: userProfile.location || 'Location Not Set',
                            city: userProfile.location?.split(',').pop()?.trim() || 'India',
                            established: 'N/A',
                            rating: 4.5,
                            reviewCount: 12,
                            verified: userProfile.verification?.isVerified || false,
                            ownerId: userProfile.uid,
                            phone: '+91 000 000 0000',
                            email: userProfile.email || 'contact@ifilmdirectory.com',
                            gallery: [userProfile.photoURL || ''],
                            services: [],
                            reviews: [],
                            team: [],
                            projectsCompleted: 50,
                            yearsExperience: 3,
                            isAvailable: true,
                            nextAvailable: 'Available Now'
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching business data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBusinessData();
    }, [id]);

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={`material-symbols-outlined text-sm ${i < Math.floor(rating) ? 'text-yellow-500 filled' : 'text-zinc-300 dark:text-zinc-700'}`}
            >
                star
            </span>
        ));
    };

    const handleEnhanceDescription = async () => {
        if (!business.description || enhancing) return;
        setEnhancing(true);
        try {
            const result = await aiService.enhanceText(business.description, {
                tone: 'professional',
                purpose: 'pitch',
                languageMix: 'english'
            });
            if (result.success && result.data) {
                setBusiness({ ...business, description: result.data });
            }
        } catch (error) {
            console.error("Enhancement failed:", error);
        } finally {
            setEnhancing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#090A0C]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-slate-50 dark:bg-[#090A0C] text-zinc-900 dark:text-white pb-32 transition-colors">
            <div className="w-full max-w-5xl mx-auto flex flex-col flex-1">
            {/* Header with Cover Image */}
            <div className="relative">
                {/* Reduced Cover Image */}
                <div className="relative h-56 md:h-72 w-full overflow-hidden md:rounded-b-3xl">
                    <PostMedia
                        src={business.coverImage}
                        className="h-full w-full object-cover grayscale-[10%] brightness-90"
                        fallbackType="GENERAL"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-slate-50 dark:to-[#090A0C]"></div>

                    {/* Navigation Buttons */}
                    <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-black/40 transition-all border border-white/10"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_back</span>
                        </button>

                        <div className="flex items-center gap-2">
                            {currentUser?.uid === business.ownerId || currentUser?.email === 'ifilmdirectory@gmail.com' ? (
                                <button
                                    onClick={isEditing ? handleSaveBusiness : () => setIsEditing(true)}
                                    disabled={savingBusiness}
                                    className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl text-white transition-all border border-white/10 ${isEditing ? 'bg-primary border-primary' : 'bg-black/20 hover:bg-black/40'} disabled:opacity-50`}
                                >
                                    <span className={`material-symbols-outlined text-xl ${isEditing ? 'filled' : ''}`}>{savingBusiness ? 'hourglass_top' : isEditing ? 'save' : 'edit_square'}</span>
                                </button>
                            ) : null}
                            <button
                                onClick={handleShare}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-xl text-white hover:bg-black/40 transition-all border border-white/10"
                                title="Share Business Profile"
                            >
                                <span className="material-symbols-outlined text-xl">share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Identity Section */}
                <div className="relative -mt-12 px-6">
                    <div className="flex flex-col items-center">
                        {/* Logo / Profile Image */}
                        <div className="h-28 w-28 overflow-hidden rounded-[32px] border-4 border-white dark:border-zinc-950 bg-white shadow-2xl shadow-black/10 transition-transform hover:scale-105 duration-500">
                            <PostMedia
                                src={business.logo}
                                className="h-full w-full object-cover"
                                fallbackType="GENERAL"
                            />
                        </div>

                        {/* Name & Title Section - Made Very Clear */}
                        <div className="mt-4 text-center w-full max-w-[90%]">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={business.name}
                                        onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-2xl font-black text-center text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Business Name"
                                    />
                                    <input
                                        type="text"
                                        value={business.tagline}
                                        onChange={(e) => setBusiness({ ...business, tagline: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-2 text-sm text-center text-zinc-500 focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Business Tagline"
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                                            {business.name}
                                        </h1>
                                        {business.verified && (
                                            <span className="material-symbols-outlined text-blue-500 text-2xl filled">
                                                verified
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-primary uppercase tracking-widest bg-primary/5 dark:bg-primary/10 px-4 py-1.5 rounded-full inline-block">
                                        {business.type?.replace('_', ' ')}
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto line-clamp-2">
                                        {business.tagline}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Availability & Location Bar */}
            <div className="mx-4 md:mx-0 mt-6 flex items-center justify-between gap-3 bg-white dark:bg-[#121316] p-3.5 rounded-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg">
                <div className="flex items-center gap-2 px-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${business.isAvailable ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]`}></span>
                    <span className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white">{business.nextAvailable}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] rounded-xl">
                    <span className="material-symbols-outlined text-sm text-amber-500">location_on</span>
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">{business.city}</span>
                </div>
            </div>

            {/* Quick Stats redesigned as minimalist cards */}
            <div className="mx-4 md:mx-0 mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white dark:bg-[#121316] p-4 border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg transition-transform hover:-translate-y-0.5 duration-300 text-center">
                    <div className="flex items-center gap-1 mb-1 justify-center">
                        <span className="text-lg font-black text-zinc-900 dark:text-white">{business.rating}</span>
                        <span className="material-symbols-outlined text-amber-500 dark:text-amber-400 text-sm filled" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{business.reviewCount} Reviews</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-[#121316] p-4 border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg transition-transform hover:-translate-y-0.5 duration-300 text-center">
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400 text-center mb-1">{business.projectsCompleted}+</div>
                    <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Projects</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-[#121316] p-4 border border-zinc-200 dark:border-white/[0.08] shadow-sm dark:shadow-lg transition-transform hover:-translate-y-0.5 duration-300 text-center">
                    <div className="text-lg font-black text-zinc-900 dark:text-white text-center mb-1">{business.yearsExperience}</div>
                    <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Years</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 mt-6 border-b border-zinc-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#090A0C]/90 backdrop-blur-md">
                <div className="flex gap-2 px-4 md:px-0 overflow-x-auto no-scrollbar">
                    {(['about', 'services', 'gallery', 'reviews'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-bold capitalize transition-colors relative ${activeTab === tab
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 px-6 py-6">
                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="space-y-6">
                        {/* Description */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-lg font-black text-zinc-900 dark:text-white">About Us</h2>
                                {isEditing && (
                                    <button
                                        onClick={handleEnhanceDescription}
                                        disabled={enhancing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-primary/20 transition-all disabled:opacity-50 group"
                                    >
                                        <span className={`material-symbols-outlined text-sm ${enhancing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                                            {enhancing ? 'sync' : 'magic_button'}
                                        </span>
                                        {enhancing ? 'Applying Glitter...' : 'AI Enhance'}
                                    </button>
                                )}
                            </div>
                            {isEditing ? (
                                <textarea
                                    value={business.description}
                                    onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                                    className="w-full h-40 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                    placeholder="Tell the world about your business..."
                                />
                            ) : (
                                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    {business.description}
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Location</h2>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Address / Area</label>
                                        <input
                                            type="text"
                                            value={business.location}
                                            onChange={(e) => setBusiness({ ...business, location: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="e.g. Film Nagar"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">City</label>
                                        <input
                                            type="text"
                                            value={business.city}
                                            onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            placeholder="e.g. Hyderabad"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary mt-0.5">location_on</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-zinc-900 dark:text-white">{business.location}</p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{business.city}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setShowMap(true)}
                                            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 py-3 text-xs font-bold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">explore</span>
                                            Discovery Map
                                        </button>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.name + ' ' + business.location + ' ' + business.city)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">directions</span>
                                            Get Directions
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Contact Info (Visible only in edit mode here) */}
                        {isEditing && (
                            <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
                                <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Contact Details</h2>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Phone</label>
                                        <input
                                            type="text"
                                            value={business.phone}
                                            onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Email</label>
                                        <input
                                            type="email"
                                            value={business.email}
                                            onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Website</label>
                                        <input
                                            type="text"
                                            value={business.website}
                                            onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Our Team</h2>
                            <div className="space-y-3">
                                {business.team.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <div className="h-12 w-12 overflow-hidden rounded-full">
                                            <PostMedia
                                                src={member.image}
                                                className="h-full w-full object-cover"
                                                fallbackType="USER_MALE"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-zinc-900 dark:text-white">{member.name}</p>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div className="space-y-4">
                        {business.services.map((service) => (
                            <div
                                key={service.id}
                                className="rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden border border-zinc-200 dark:border-white/[0.08] hover:shadow-lg transition-all"
                            >
                                {service.image && (
                                    <div className="aspect-video w-full overflow-hidden max-h-64 bg-black">
                                        <PostMedia
                                            src={service.image}
                                            className="h-full w-full object-cover"
                                            fallbackType="GENERAL"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">{service.name}</h3>
                                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {service.description}
                                    </p>

                                    {/* Cinema Technical Specs Pills */}
                                    {service.specs && service.specs.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-white/[0.06]">
                                            {service.specs.map((spec, sIdx) => (
                                                <span
                                                    key={sIdx}
                                                    className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200/60 dark:border-white/5"
                                                >
                                                    <span className="material-symbols-outlined text-xs text-amber-500">check_circle</span>
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-5">
                                        <button
                                            onClick={() => {
                                                if (!currentUser) {
                                                    openAuthModal('Sign in to inquire about studio facilities');
                                                    return;
                                                }
                                                setShowContactModal(true);
                                            }}
                                            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">calendar_month</span>
                                            <span>Inquire Availability for this Stage</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Gallery Tab */}
                {activeTab === 'gallery' && (
                    <div className="grid grid-cols-2 gap-3">
                        {business.gallery.map((image, index) => (
                            <div
                                key={index}
                                className="aspect-square overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                <PostMedia
                                    src={image}
                                    className="h-full w-full object-cover"
                                    fallbackType="GENERAL"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="space-y-4">
                        {/* Rating Summary */}
                        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-6 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-5xl font-black text-primary">{business.rating}</div>
                                    <div className="mt-2 flex justify-center">{renderStars(business.rating)}</div>
                                    <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                        {business.reviewCount} reviews
                                    </div>
                                </div>
                                <div className="flex-1">
                                    {[5, 4, 3, 2, 1].map((star) => (
                                        <div key={star} className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-3">{star}</span>
                                            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500"
                                                    style={{ width: `${star === 5 ? 80 : star === 4 ? 15 : 5}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Reviews List */}
                        {business.reviews.map((review) => (
                            <div
                                key={review.id}
                                className="rounded-2xl bg-white dark:bg-zinc-900 p-5 border border-zinc-100 dark:border-zinc-800"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 overflow-hidden rounded-full shrink-0">
                                        <PostMedia
                                            src={review.authorImage}
                                            className="h-full w-full object-cover"
                                            fallbackType="USER_MALE"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-white">{review.author}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">{review.date}</p>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                                {review.projectType}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex">{renderStars(review.rating)}</div>
                                        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Fixed Bottom CTA */}
            <div className="fixed bottom-24 left-0 right-0 z-20 px-4 pointer-events-none">
                <div className="mx-auto max-w-md pointer-events-auto">
                    <div className="rounded-2xl bg-white/95 dark:bg-[#121316]/95 backdrop-blur-xl p-3 shadow-2xl border border-zinc-200 dark:border-white/[0.1]">
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => {
                                    if (!currentUser) {
                                        openAuthModal('Sign in to contact facility & inquire booking');
                                        return;
                                    }
                                    setShowContactModal(true);
                                }}
                                className="flex-1 min-w-0 rounded-xl bg-amber-500 hover:bg-amber-400 py-3.5 font-black text-white shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-xl">calendar_month</span>
                                <span className="text-sm font-bold">Contact & Inquire Booking</span>
                            </button>
                            <button 
                                onClick={handleShare}
                                className="w-12 h-12 shrink-0 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.08] transition-colors flex items-center justify-center"
                                title="Share"
                            >
                                <span className="material-symbols-outlined text-xl">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {
                showContactModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
                        onClick={() => setShowContactModal(false)}
                    >
                        <div
                            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#121316] border border-zinc-200 dark:border-white/[0.12] p-6 shadow-2xl animate-in zoom-in-95 text-zinc-900 dark:text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Contact {business.name}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Direct studio desk & booking inquiries</p>
                                </div>
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.05] hover:bg-zinc-200 dark:hover:bg-white/[0.1] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href={`tel:${business.phone}`}
                                    className="flex items-center gap-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] p-3.5 hover:border-amber-500/40 transition-all"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                                        <span className="material-symbols-outlined text-lg">call</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Direct Phone</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{business.phone}</p>
                                    </div>
                                </a>

                                <a
                                    href={`mailto:${business.email}`}
                                    className="flex items-center gap-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] p-3.5 hover:border-amber-500/40 transition-all"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                                        <span className="material-symbols-outlined text-lg">email</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-900 dark:text-white">Official Email</p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{business.email}</p>
                                    </div>
                                </a>

                                {business.website && (
                                    <a
                                        href={`https://${business.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3.5 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/[0.06] p-3.5 hover:border-amber-500/40 transition-all"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400">
                                            <span className="material-symbols-outlined text-lg">language</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Studio Website</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{business.website}</p>
                                        </div>
                                    </a>
                                )}
                            </div>

                            <button
                                onClick={() => navigate(`/messaging`)}
                                className="mt-5 w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-black text-white transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span>Message on iFilm Directory</span>
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Map Modal */}
            {
                showMap && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md animate-in fade-in"
                        onClick={() => setShowMap(false)}
                    >
                        <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
                            <MapDiscovery
                                profiles={[{
                                    uid: business.id,
                                    displayName: business.name,
                                    photoURL: business.logo,
                                    role: business.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                    location: business.location,
                                    city: business.city,
                                    verified: business.verified
                                }]}
                                onClose={() => setShowMap(false)}
                            />
                        </div>
                    </div>
                )
            }
            </div>

            <BottomNav />
        </div >
    );
}
