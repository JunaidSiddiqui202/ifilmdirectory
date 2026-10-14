import { useState } from 'react';
import { type UserProfile } from '../services/userService';
import { uploadFile } from '../services/storageService';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: UserProfile;
    onSave: (updatedProfile: UserProfile) => Promise<void>;
}

export default function VerificationModal({ isOpen, onClose, profile, onSave }: VerificationModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingAadhar, setUploadingAadhar] = useState(false);
    const [uploadingUnion, setUploadingUnion] = useState(false);
    const [proofType, setProofType] = useState<'union_card' | 'imdb' | 'invites' | 'content_creator'>('union_card');
    const [imdbLink, setImdbLink] = useState('');
    const [inviteCode1, setInviteCode1] = useState('');
    const [inviteCode2, setInviteCode2] = useState('');
    const [contentLink1, setContentLink1] = useState('');
    const [contentLink2, setContentLink2] = useState('');

    const [formData, setFormData] = useState(profile.verification || {
        isVerified: false,
        isMobileVerified: !!profile.phoneNumber, // Assume verified if exists for now, or use logic
        isEmailVerified: !!profile.email, // Firebase auth usually handles this
        aadharCardUrl: '',
        officeOwnerAadharCardUrl: '',
        filmUnionCardUrl: '',
        status: 'none' as const,
    });

    if (!isOpen) return null;

    const isServiceOrStudio = ['service', 'studio'].includes(profile.role || '');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'aadharCardUrl' | 'filmUnionCardUrl' | 'officeOwnerAadharCardUrl') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            if (field === 'aadharCardUrl' || field === 'officeOwnerAadharCardUrl') setUploadingAadhar(true);
            if (field === 'filmUnionCardUrl') setUploadingUnion(true);

            try {
                const response = await uploadFile(file);
                if (response.url) {
                    setFormData(prev => ({ ...prev, [field]: response.url }));
                } else {
                    alert('Upload failed: ' + response.error);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Upload failed');
            } finally {
                setUploadingAadhar(false);
                setUploadingUnion(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Contact Verification Check
            if (!formData.isMobileVerified && !formData.isEmailVerified) {
                alert("Please verify either your mobile number or email address before submitting.");
                setLoading(false);
                return;
            }

            // 2. Identity Proof Check
            const isAadharUploaded = isServiceOrStudio ? formData.officeOwnerAadharCardUrl : formData.aadharCardUrl;
            if (!isAadharUploaded) {
                alert(`Please upload ${isServiceOrStudio ? "Office Owner's" : "your"} Aadhar Card.`);
                setLoading(false);
                return;
            }

            // 3. Professional Proof Check
            let professionalProofValid = false;

            if (proofType === 'union_card' && formData.filmUnionCardUrl) professionalProofValid = true;
            else if (proofType === 'imdb' && imdbLink.trim().length > 10) professionalProofValid = true;
            else if (proofType === 'invites' && inviteCode1.length > 3 && inviteCode2.length > 3) professionalProofValid = true;
            else if (proofType === 'content_creator' && contentLink1.length > 10) professionalProofValid = true;

            if (!professionalProofValid) {
                if (proofType === 'union_card') alert("Please upload your Film Industry Union Card.");
                else if (proofType === 'imdb') alert("Please provide a valid IMDb Profile URL.");
                else if (proofType === 'invites') alert("Please provide valid invite codes or user IDs from 2 existing users.");
                else if (proofType === 'content_creator') alert("Please provide at least one valid link to your work (OTT/YouTube).");
                setLoading(false);
                return;
            }

            const updatedVerification = {
                ...formData,
                proofType,
                imdbUrl: proofType === 'imdb' ? imdbLink : undefined,
                inviteCodes: proofType === 'invites' ? [inviteCode1, inviteCode2] : undefined,
                contentLinks: proofType === 'content_creator' ? [contentLink1, contentLink2].filter(Boolean) : undefined,
                status: 'pending' as const,
                submittedAt: new Date().toISOString(),
            };

            const updatedProfile = {
                ...profile,
                verification: updatedVerification
            };

            await onSave(updatedProfile);
            onClose();
            alert("Verification documents submitted successfully! Admin will review your application.");

        } catch (error) {
            console.error("Failed to submit verification:", error);
            alert("Failed to submit verification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-lg my-8 flex flex-col shadow-2xl max-h-[90vh]">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 z-10 rounded-t-xl shrink-0">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">verified</span>
                        Get Verified
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">

                    {/* Status Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                            Verified users get a blue tick badge and higher trust.
                            {proofType === 'content_creator' && " Content Creators will receive an exclusive signup link after approval."}
                        </p>
                    </div>

                    {/* Step 1: Contact Verification */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
                            1. Contact Verification <span className="text-xs font-normal text-zinc-500">(One Required)</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className={`flex items-center justify-between p-3 rounded-lg border ${formData.isMobileVerified ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm">Mobile</p>
                                    <p className="text-xs text-zinc-500">{profile.phoneNumber || 'N/A'}</p>
                                </div>
                                {formData.isMobileVerified ? (
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                ) : (
                                    <button type="button" className="text-primary text-xs font-bold hover:underline">Verify</button>
                                )}
                            </div>
                            <div className={`flex items-center justify-between p-3 rounded-lg border ${formData.isEmailVerified ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
                                <div>
                                    <p className="font-bold text-zinc-900 dark:text-white text-sm">Email</p>
                                    <p className="text-xs text-zinc-500">{profile.email || 'N/A'}</p>
                                </div>
                                {formData.isEmailVerified ? (
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                ) : (
                                    <button type="button" className="text-primary text-xs font-bold hover:underline">Verify</button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Mandatory Documents */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
                            2. Identity Proof <span className="text-red-500">*</span>
                        </h4>

                        {/* Aadhar Card Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">
                                {isServiceOrStudio ? "Office Owner's Aadhar Card" : "Your Aadhar Card"}
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer flex flex-col items-center gap-2 p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-primary hover:text-primary transition-colors text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900">
                                    {isServiceOrStudio && formData.officeOwnerAadharCardUrl ? (
                                        <div className="text-green-500 flex flex-col items-center">
                                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                                            <span className="text-xs mt-1">Uploaded</span>
                                        </div>
                                    ) : !isServiceOrStudio && formData.aadharCardUrl ? (
                                        <div className="text-green-500 flex flex-col items-center">
                                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                                            <span className="text-xs mt-1">Uploaded</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-2xl">upload_file</span>
                                            <span className="text-sm">Click to Upload</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, isServiceOrStudio ? 'officeOwnerAadharCardUrl' : 'aadharCardUrl')}
                                        className="hidden"
                                    />
                                </label>
                                {uploadingAadhar && <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>}
                            </div>
                            <p className="text-xs text-zinc-400">Your ID will be handled securely and used only for verification.</p>
                        </div>
                    </section>

                    {/* Step 3: Professional Verification */}
                    <section className="space-y-4">
                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white pb-2 border-b border-zinc-200 dark:border-zinc-800">
                            3. Professional Verification <span className="text-red-500">*</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setProofType('union_card')}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${proofType === 'union_card' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined mb-1">badge</span>
                                <span className="text-xs font-bold text-center">Union Card</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProofType('imdb')}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${proofType === 'imdb' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined mb-1">movie</span>
                                <span className="text-xs font-bold text-center">IMDb</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProofType('invites')}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${proofType === 'invites' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined mb-1">diversity_3</span>
                                <span className="text-xs font-bold text-center">User Invites</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProofType('content_creator')}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${proofType === 'content_creator' ? 'border-primary bg-primary/10 text-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                            >
                                <span className="material-symbols-outlined mb-1">video_library</span>
                                <span className="text-xs font-bold text-center">Content Creator</span>
                            </button>
                        </div>

                        {/* Union Card Input */}
                        {proofType === 'union_card' && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload Film Industry Union Card</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer flex flex-col items-center gap-2 p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-primary hover:text-primary transition-colors text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900">
                                        {formData.filmUnionCardUrl ? (
                                            <div className="text-green-500 flex flex-col items-center">
                                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                                                <span className="text-xs mt-1">Uploaded</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-2xl">upload_file</span>
                                                <span className="text-sm">Click to Upload</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, 'filmUnionCardUrl')}
                                            className="hidden"
                                        />
                                    </label>
                                    {uploadingUnion && <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>}
                                </div>
                            </div>
                        )}

                        {/* IMDb Input */}
                        {proofType === 'imdb' && (
                            <div className="space-y-2 animate-fadeIn">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">IMDb Profile URL</label>
                                <input
                                    type="url"
                                    value={imdbLink}
                                    onChange={(e) => setImdbLink(e.target.value)}
                                    placeholder="https://www.imdb.com/name/nm1234567/"
                                    className="w-full px-3 py-3 rounded-lg bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-primary/50 outline-none text-zinc-900 dark:text-white"
                                />
                                <p className="text-xs text-zinc-500">Provide the full URL to your IMDb page.</p>
                            </div>
                        )}

                        {/* Invite Codes Input */}
                        {proofType === 'invites' && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Enter the Unique ID or Invite Code of 2 existing verified users who recommended you.
                                </p>
                                <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recommendation 1</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Invite Code / User ID"
                                        value={inviteCode1}
                                        onChange={(e) => setInviteCode1(e.target.value)}
                                        className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black/20 text-sm"
                                    />
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recommendation 2</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Invite Code / User ID"
                                        value={inviteCode2}
                                        onChange={(e) => setInviteCode2(e.target.value)}
                                        className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black/20 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content Creator Input */}
                        {proofType === 'content_creator' && (
                            <div className="space-y-4 animate-fadeIn">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    If you are a content creator (YouTube/OTT), provide links to your best work.
                                    <br /><span className="text-primary font-bold">Note:</span> After admin approval, we will email you an exclusive signup link.
                                </p>
                                <div className="space-y-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Work Link 1 (Mandatory)</label>
                                    <input
                                        type="url"
                                        placeholder="https://youtube.com/..."
                                        value={contentLink1}
                                        onChange={(e) => setContentLink1(e.target.value)}
                                        className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black/20 text-sm"
                                    />
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Work Link 2 (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={contentLink2}
                                        onChange={(e) => setContentLink2(e.target.value)}
                                        className="w-full px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black/20 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Submit Button */}
                    <div className="pt-2 sticky bottom-0 bg-white dark:bg-zinc-900 pb-2">
                        <button
                            type="submit"
                            disabled={loading || uploadingAadhar || uploadingUnion}
                            className="w-full py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? 'Submitting...' : 'Submit to Admin Check'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
