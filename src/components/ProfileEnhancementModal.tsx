import { useState } from 'react';
import { aiService, type EnhancedProfile } from '../services/aiService';
import AIButton from './AIButton';

interface ProfileEnhancementModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: any;
    onApply: (enhancedData: EnhancedProfile) => void;
}

export default function ProfileEnhancementModal({ isOpen, onClose, currentProfile, onApply }: ProfileEnhancementModalProps) {
    const [loading, setLoading] = useState(false);
    const [enhancedProfile, setEnhancedProfile] = useState<EnhancedProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedBio, setSelectedBio] = useState<'short' | 'standard' | 'creative'>('standard');

    if (!isOpen) return null;

    const handleEnhance = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await aiService.enhanceProfile(currentProfile);
            if (result.success && result.data) {
                setEnhancedProfile(result.data);
            } else {
                setError(result.error || 'Failed to enhance profile');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (enhancedProfile) {
            onApply(enhancedProfile);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">auto_awesome</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">AI Profile Enhancer</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Transform your profile into an industry-standard portfolio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {!enhancedProfile ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center border border-purple-500/20">
                                <span className="material-symbols-outlined text-4xl text-purple-600 dark:text-purple-400">magic_button</span>
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Ready to Polish Your Profile?</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-8">
                                Our AI will analyze your current details and rewrite them to match Hollywood standards, optimizing for casting directors and search visibility.
                            </p>

                            <AIButton
                                onClick={handleEnhance}
                                label={loading ? "Analyzing Profile..." : "✨ Enhance My Profile"}
                                variant="primary"
                                className="mx-auto text-lg px-8 py-4"
                                disabled={loading}
                            />

                            {loading && (
                                <div className="mt-8 space-y-3 max-w-xs mx-auto">
                                    <div className="h-2 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 animate-progress"></div>
                                    </div>
                                    <p className="text-xs text-zinc-500 animate-pulse">Analyzing bio, skills, and experience...</p>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Bio & Headline */}
                            <div className="space-y-6">
                                <div className="p-5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Professional Headline</h3>
                                    <div className="text-xl font-bold text-zinc-900 dark:text-white bg-white dark:bg-black/20 p-4 rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                        {enhancedProfile.headline}
                                    </div>
                                </div>

                                <div className="p-5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bio Options</h3>
                                        <div className="flex bg-zinc-200 dark:bg-black/40 rounded-lg p-1">
                                            {(['short', 'standard', 'creative'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedBio(type)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${selectedBio === type
                                                        ? 'bg-purple-600 text-white shadow-lg'
                                                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                                        }`}
                                                >
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-black/20 p-4 rounded-lg min-h-[150px] border border-zinc-200 dark:border-transparent">
                                        {enhancedProfile.bio[selectedBio]}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Skills & Keywords */}
                            <div className="space-y-6">
                                <div className="p-5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Optimized Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {enhancedProfile.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Search Keywords (SEO)</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {enhancedProfile.keywords.map((keyword, i) => (
                                            <span key={i} className="px-2 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 rounded text-xs">
                                                #{keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Full Width: Experience */}
                            {enhancedProfile.experience.length > 0 && (
                                <div className="lg:col-span-2 p-5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10">
                                    <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Polished Experience</h3>
                                    <div className="grid gap-4">
                                        {enhancedProfile.experience.map((exp, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-white dark:bg-black/20 rounded-lg border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                                                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">movie</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-zinc-900 dark:text-white font-medium">{exp.title}</h4>
                                                    <p className="text-purple-600 dark:text-purple-400 text-sm mb-2">{exp.role}</p>
                                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">{exp.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {enhancedProfile && (
                    <div className="sticky bottom-0 p-6 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur border-t border-zinc-200 dark:border-white/10 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            Apply Improvements
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
