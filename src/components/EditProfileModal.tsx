import { useState, useEffect } from 'react';
import { type UserProfile, checkUsernameAvailability, generateUsernameFromName } from '../services/userService';
import { useToast } from '../context/ToastContext';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, profile, onSave }: EditProfileModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [loading, setLoading] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);


    useEffect(() => {
        setFormData(profile);
    }, [profile]);

    // Check username availability with debounce
    useEffect(() => {
        const checkUsername = async () => {
            if (!formData.username || formData.username === profile.username) {
                setUsernameAvailable(null);
                return;
            }

            // Validate format
            const usernameRegex = /^[a-z0-9-]+$/;
            if (!usernameRegex.test(formData.username)) {
                setUsernameAvailable(false);
                return;
            }

            setCheckingUsername(true);
            const available = await checkUsernameAvailability(formData.username);
            setUsernameAvailable(available);
            setCheckingUsername(false);
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.username, profile.username]);

    const handleChange = (field: keyof UserProfile, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (parent: keyof UserProfile, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any || {}),
                [field]: value
            }
        }));
    };

    const handleSocialChange = (network: string, value: string) => {
        handleNestedChange('socialLinks', network, value);
    };

    const handlePhysicalChange = (field: string, value: string) => {
        handleNestedChange('physicalAttributes', field, value);
    };

    const handleArrayChange = (parent: keyof UserProfile, field: string, value: string) => {
        // Split by comma and trim
        const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
        handleNestedChange(parent, field, arrayValue);
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePhone = (phone: string) => {
        // Allows +, spaces, dashes, and digits. At least 10 chars.
        return /^[\d\+\-\s]{10,}$/.test(phone);
    };

    const addPastProject = () => {
        const newProject = {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            role: '',
            year: new Date().getFullYear().toString(),
        };
        setFormData(prev => ({
            ...prev,
            pastProjects: [...(prev.pastProjects || []), newProject]
        }));
    };

    const removePastProject = (id: string) => {
        setFormData(prev => ({
            ...prev,
            pastProjects: (prev.pastProjects || []).filter(p => p.id !== id)
        }));
    };

    const updatePastProject = (id: string, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            pastProjects: (prev.pastProjects || []).map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const addUnderProductionProject = () => {
        const newProject = {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            role: '',
            status: 'In Development',
        };
        setFormData(prev => ({
            ...prev,
            underProductionProjects: [...(prev.underProductionProjects || []), newProject]
        }));
    };

    const removeUnderProductionProject = (id: string) => {
        setFormData(prev => ({
            ...prev,
            underProductionProjects: (prev.underProductionProjects || []).filter(p => p.id !== id)
        }));
    };

    const updateUnderProductionProject = (id: string, field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            underProductionProjects: (prev.underProductionProjects || []).map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Prevent double-click race conditions
        if (loading) return;

        // 2. Offline check
        if (!navigator.onLine) {
            toast.error("You are offline. Please check your internet connection.");
            return;
        }

        // 3. Name validation (cannot be empty or spaces)
        const cleanName = formData.displayName?.trim();
        if (!cleanName) {
            toast.error("Full Name is required and cannot be blank.");
            return;
        }

        const cleanEmail = formData.email?.trim() || '';
        if (cleanEmail && !validateEmail(cleanEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        const cleanPhone = formData.phoneNumber?.trim() || '';
        if (cleanPhone && !validatePhone(cleanPhone)) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        // Validate username if it's been changed
        const cleanUsername = formData.username?.trim() || '';
        if (cleanUsername && cleanUsername !== profile.username) {
            if (usernameAvailable === false) {
                toast.error("This username is already taken. Please choose another one.");
                return;
            }
            if (!cleanUsername.match(/^[a-z0-9-]+$/)) {
                toast.error("Username can only contain lowercase letters, numbers, and hyphens.");
                return;
            }
        }

        // 4. Filter out empty ghost projects
        const cleanPastProjects = (formData.pastProjects || [])
            .filter(p => p.title.trim() && p.role.trim())
            .map(p => ({ ...p, title: p.title.trim(), role: p.role.trim() }));

        const cleanUnderProduction = (formData.underProductionProjects || [])
            .filter(p => p.title.trim())
            .map(p => ({ ...p, title: p.title.trim() }));

        setLoading(true);
        try {
            await onSave({
                ...formData,
                displayName: cleanName,
                email: cleanEmail,
                phoneNumber: cleanPhone,
                username: cleanUsername,
                bio: formData.bio?.trim() || '',
                pastProjects: cleanPastProjects,
                underProductionProjects: cleanUnderProduction
            });
            onClose();
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to save profile changes.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isActor = formData.role === 'actor';
    const isServiceOrCrew = ['crew', 'service', 'studio'].includes(formData.role || '');

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl my-2 sm:my-8 flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10 rounded-t-xl">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Profile</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto max-h-[85dvh]">

                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-primary border-b border-zinc-200 dark:border-zinc-800 pb-2">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.displayName || ''}
                                    onChange={(e) => handleChange('displayName', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    Username
                                    <span className="text-xs text-zinc-400">(for profile URL)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.username || ''}
                                        onChange={(e) => {
                                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                            handleChange('username', value);
                                        }}
                                        placeholder="e.g., junaid-siddiqui"
                                        className="w-full px-3 py-2 pr-10 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {checkingUsername && (
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {!checkingUsername && usernameAvailable === true && (
                                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                                        )}
                                        {!checkingUsername && usernameAvailable === false && (
                                            <span className="material-symbols-outlined text-red-500 text-xl">cancel</span>
                                        )}
                                    </div>
                                </div>
                                {formData.username && usernameAvailable === false && (
                                    <p className="text-xs text-red-500">This username is already taken</p>
                                )}
                                {formData.username && usernameAvailable === true && (
                                    <p className="text-xs text-green-500">Username is available!</p>
                                )}
                                {!formData.username && formData.displayName && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const suggested = generateUsernameFromName(formData.displayName || '');
                                            handleChange('username', suggested);
                                        }}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Generate from name
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</label>
                                <select
                                    value={formData.role || 'other'}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        handleChange('role', value);
                                        if (value !== 'custom') {
                                            // Clear custom role if switching away from custom
                                            setFormData(prev => ({ ...prev, customRole: undefined }));
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                >
                                    <optgroup label="🎭 Performance">
                                        <option value="actor">Actor</option>
                                        <option value="voice_actor">Voice Actor</option>
                                        <option value="stunt_performer">Stunt Performer</option>
                                        <option value="choreographer">Choreographer</option>
                                    </optgroup>
                                    <optgroup label="🎬 Direction">
                                        <option value="director">Director</option>
                                        <option value="assistant_director">Assistant Director</option>
                                        <option value="script_supervisor">Script Supervisor</option>
                                    </optgroup>
                                    <optgroup label="📝 Writing">
                                        <option value="writer">Writer/Screenwriter</option>
                                        <option value="dialogue_writer">Dialogue Writer</option>
                                        <option value="lyricist">Lyricist</option>
                                    </optgroup>
                                    <optgroup label="📷 Cinematography">
                                        <option value="cinematographer">Cinematographer/DOP</option>
                                        <option value="camera_operator">Camera Operator</option>
                                        <option value="focus_puller">Focus Puller</option>
                                        <option value="gaffer">Gaffer</option>
                                        <option value="grip">Grip</option>
                                    </optgroup>
                                    <optgroup label="🎵 Sound">
                                        <option value="sound_designer">Sound Designer</option>
                                        <option value="music_composer">Music Composer</option>
                                        <option value="sound_recordist">Sound Recordist</option>
                                        <option value="boom_operator">Boom Operator</option>
                                        <option value="foley_artist">Foley Artist</option>
                                    </optgroup>
                                    <optgroup label="🎨 Art & Design">
                                        <option value="production_designer">Production Designer</option>
                                        <option value="art_director">Art Director</option>
                                        <option value="set_designer">Set Designer</option>
                                        <option value="costume_designer">Costume Designer</option>
                                        <option value="makeup_artist">Makeup Artist</option>
                                        <option value="hair_stylist">Hair Stylist</option>
                                    </optgroup>
                                    <optgroup label="✂️ Post-Production">
                                        <option value="editor">Editor</option>
                                        <option value="colorist">Colorist</option>
                                        <option value="vfx_artist">VFX Artist</option>
                                        <option value="motion_graphics">Motion Graphics Designer</option>
                                    </optgroup>
                                    <optgroup label="🎬 Production">
                                        <option value="producer">Producer</option>
                                        <option value="line_producer">Line Producer</option>
                                        <option value="production_manager">Production Manager</option>
                                        <option value="production_coordinator">Production Coordinator</option>
                                    </optgroup>
                                    <optgroup label="🏢 Business & Services">
                                        <option value="studio">Studio</option>
                                        <option value="service">Service Provider</option>
                                        <option value="casting_director">Casting Director</option>
                                        <option value="location_manager">Location Manager</option>
                                    </optgroup>
                                    <optgroup label="📱 Content Creation">
                                        <option value="content_creator">Content Creator</option>
                                        <option value="influencer">Influencer</option>
                                        <option value="photographer">Photographer</option>
                                    </optgroup>
                                    <optgroup label="Other">
                                        <option value="crew">General Crew</option>
                                        <option value="custom">✏️ Custom Role</option>
                                    </optgroup>
                                </select>
                                {formData.role === 'custom' && (
                                    <input
                                        type="text"
                                        value={(formData as any).customRole || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customRole: e.target.value }))}
                                        placeholder="Enter your custom role (e.g., Drone Pilot, Underwater Cinematographer)"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white mt-2"
                                    />
                                )}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bio</label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location</label>
                                <input
                                    type="text"
                                    value={formData.location || ''}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="e.g. Mumbai, India"
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Skills (comma separated)</label>
                                <textarea
                                    value={formData.skills?.join(', ') || ''}
                                    onChange={(e) => {
                                        const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        handleChange('skills', skills);
                                    }}
                                    placeholder="e.g. Monologue, Stunt Work, Improvisation"
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Status & Availability */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-primary border-b border-zinc-200 dark:border-zinc-800 pb-2">Status & Availability</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status Message (WhatsApp Style)</label>
                                <input
                                    type="text"
                                    value={formData.statusMessage || ''}
                                    onChange={(e) => handleChange('statusMessage', e.target.value)}
                                    placeholder="e.g. On set, Busy, Available for work"
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Availability Status</label>
                                <select
                                    value={formData.availabilityStatus || 'available'}
                                    onChange={(e) => handleChange('availabilityStatus', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                >
                                    <option value="available">Available ✅</option>
                                    <option value="busy">Busy (No Calls) 🚫</option>
                                    <option value="working">Currently Working 💼</option>
                                    <option value="on_set">On Set 🎬</option>
                                    <option value="out_of_office">Out of Office 🏖️</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Physical Attributes (Only for Actors) */}
                    {isActor && (
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-primary border-b border-zinc-200 dark:border-zinc-800 pb-2">Physical Attributes</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Height</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAttributes?.height || ''}
                                        onChange={(e) => handlePhysicalChange('height', e.target.value)}
                                        placeholder="e.g. 5' 9''"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Eye Color</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAttributes?.eyeColor || ''}
                                        onChange={(e) => handlePhysicalChange('eyeColor', e.target.value)}
                                        placeholder="e.g. Brown"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hair Color</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAttributes?.hairColor || ''}
                                        onChange={(e) => handlePhysicalChange('hairColor', e.target.value)}
                                        placeholder="e.g. Black"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Weight</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAttributes?.weight || ''}
                                        onChange={(e) => handlePhysicalChange('weight', e.target.value)}
                                        placeholder="e.g. 70kg"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-4 space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Languages (comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.physicalAttributes?.languages?.join(', ') || ''}
                                        onChange={(e) => handleArrayChange('physicalAttributes', 'languages', e.target.value)}
                                        placeholder="e.g. English, Hindi, Marathi"
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Service/Crew Details */}
                    {isServiceOrCrew && (
                        <section className="space-y-4">
                            <h4 className="text-lg font-bold text-primary border-b border-zinc-200 dark:border-zinc-800 pb-2">Service Details</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Services Offered (comma separated)</label>
                                    <textarea
                                        value={formData.serviceDetails?.servicesOffered?.join(', ') || ''}
                                        onChange={(e) => handleArrayChange('serviceDetails', 'servicesOffered', e.target.value)}
                                        placeholder="e.g. Video Editing, Color Grading, Sound Mixing"
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Equipment / Amenities (comma separated)</label>
                                    <textarea
                                        value={formData.serviceDetails?.equipment?.join(', ') || ''}
                                        onChange={(e) => handleArrayChange('serviceDetails', 'equipment', e.target.value)}
                                        placeholder="e.g. RED Komodo, DaVinci Resolve Studio, Sound Booth"
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Under Production Projects */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <h4 className="text-lg font-bold text-primary">Under Production Films/Works</h4>
                            <button
                                type="button"
                                onClick={addUnderProductionProject}
                                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Add Project
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(formData.underProductionProjects || []).map((project) => (
                                <div key={project.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-black/20">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Project Title</label>
                                                <input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => updateUnderProductionProject(project.id, 'title', e.target.value)}
                                                    placeholder="Project Name"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Your Role</label>
                                                <input
                                                    type="text"
                                                    value={project.role}
                                                    onChange={(e) => updateUnderProductionProject(project.id, 'role', e.target.value)}
                                                    placeholder="e.g. Director, Lead Actor"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Status</label>
                                                <input
                                                    type="text"
                                                    value={project.status}
                                                    onChange={(e) => updateUnderProductionProject(project.id, 'status', e.target.value)}
                                                    placeholder="e.g. Pre-production, Shooting"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Expected Release</label>
                                                <input
                                                    type="text"
                                                    value={project.expectedRelease || ''}
                                                    onChange={(e) => updateUnderProductionProject(project.id, 'expectedRelease', e.target.value)}
                                                    placeholder="e.g. Late 2025"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Short Description</label>
                                                <textarea
                                                    value={project.description || ''}
                                                    onChange={(e) => updateUnderProductionProject(project.id, 'description', e.target.value)}
                                                    placeholder="Briefly describe the project..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary resize-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeUnderProductionProject(project.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(formData.underProductionProjects || []).length === 0 && (
                                <p className="text-sm text-zinc-500 italic text-center py-4 bg-zinc-50 dark:bg-black/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    No under-production projects listed.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Past Projects */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                            <h4 className="text-lg font-bold text-primary">Past Films/Works</h4>
                            <button
                                type="button"
                                onClick={addPastProject}
                                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add</span> Add Project
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(formData.pastProjects || []).map((project) => (
                                <div key={project.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-black/20">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Project Title</label>
                                                <input
                                                    type="text"
                                                    value={project.title}
                                                    onChange={(e) => updatePastProject(project.id, 'title', e.target.value)}
                                                    placeholder="Project Name"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Your Role</label>
                                                <input
                                                    type="text"
                                                    value={project.role}
                                                    onChange={(e) => updatePastProject(project.id, 'role', e.target.value)}
                                                    placeholder="Role (e.g. Director)"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Year</label>
                                                <input
                                                    type="text"
                                                    value={project.year}
                                                    onChange={(e) => updatePastProject(project.id, 'year', e.target.value)}
                                                    placeholder="e.g. 2023"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Link (Optional)</label>
                                                <input
                                                    type="url"
                                                    value={project.link || ''}
                                                    onChange={(e) => updatePastProject(project.id, 'link', e.target.value)}
                                                    placeholder="IMDb or Watch Link"
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[10px] uppercase font-bold text-zinc-500">Short Description</label>
                                                <textarea
                                                    value={project.description || ''}
                                                    onChange={(e) => updatePastProject(project.id, 'description', e.target.value)}
                                                    placeholder="Key achievements or notes..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 outline-none focus:border-primary resize-none"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePastProject(project.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(formData.pastProjects || []).length === 0 && (
                                <p className="text-sm text-zinc-500 italic text-center py-4 bg-zinc-50 dark:bg-black/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                    No past projects listed.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Contact Info */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-primary border-b border-zinc-200 dark:border-zinc-800 pb-2">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber || ''}
                                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email (Public)</label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Social Links</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 w-6"><i className="fab fa-instagram"></i> IG</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.instagram || ''}
                                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                        placeholder="Instagram Username/URL"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 w-6">FB</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.facebook || ''}
                                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                        placeholder="Facebook URL"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 w-6">X</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.twitter || ''}
                                        onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                        placeholder="Twitter/X Handle"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 w-6">in</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.linkedin || ''}
                                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                                        placeholder="LinkedIn URL"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 md:col-span-2">
                                    <span className="text-zinc-400 w-6">Web</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.website || ''}
                                        onChange={(e) => handleSocialChange('website', e.target.value)}
                                        placeholder="Portfolio Website URL"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex items-center gap-2 md:col-span-2">
                                    <span className="text-zinc-400 w-6">IMDb</span>
                                    <input
                                        type="text"
                                        value={formData.socialLinks?.imdb || ''}
                                        onChange={(e) => handleSocialChange('imdb', e.target.value)}
                                        placeholder="IMDb Profile URL"
                                        className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
