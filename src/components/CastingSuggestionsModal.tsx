import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { aiService, type CastingMatch, type CharacterDescription } from '../services/aiService';
import AILoadingState from './AILoadingState';

interface CastingSuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectActors: (actorIds: string[]) => void;
}

export default function CastingSuggestionsModal({
    isOpen,
    onClose,
    onSelectActors
}: CastingSuggestionsModalProps) {
    const [step, setStep] = useState<'input' | 'results'>('input');
    const [loading, setLoading] = useState(false);
    const [character, setCharacter] = useState<CharacterDescription>({
        name: '',
        age: '',
        gender: '',
        physicalDescription: '',
        personality: '',
        role: 'Lead'
    });
    const [matches, setMatches] = useState<CastingMatch[]>([]);
    const [selectedActors, setSelectedActors] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const handleFindActors = async () => {
        if (!character.name || !character.age || !character.gender) {
            setError('Please fill in at least name, age, and gender');
            return;
        }

        setLoading(true);
        setError(null);

        // Minimum loading time to prevent UI flicker
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

        try {
            // Fetch all actors from Firestore
            const actorsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'actor')
            );
            const actorsSnapshot = await getDocs(actorsQuery);
            const actors = actorsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));

            if (actors.length === 0) {
                await minLoadingTime;
                setError('No actors found in the database. Please try again later.');
                setLoading(false);
                return;
            }

            // Use AI to match actors
            const result = await aiService.matchCasting(character, actors);

            // Wait for minimum loading time
            await minLoadingTime;

            if (result.success && result.data) {
                setMatches(result.data);
                setStep('results');
            } else {
                setError(result.error || 'Failed to find matching actors. Please try again.');
            }
        } catch (error) {
            console.error('Error finding actors:', error);
            await minLoadingTime;
            setError('An error occurred while searching. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleActor = (actorId: string) => {
        const newSelected = new Set(selectedActors);
        if (newSelected.has(actorId)) {
            newSelected.delete(actorId);
        } else {
            newSelected.add(actorId);
        }
        setSelectedActors(newSelected);
    };

    const handleInviteSelected = () => {
        if (selectedActors.size === 0) {
            alert('Please select at least one actor');
            return;
        }
        onSelectActors(Array.from(selectedActors));
        onClose();
    };

    const resetModal = () => {
        setStep('input');
        setCharacter({
            name: '',
            age: '',
            gender: '',
            physicalDescription: '',
            personality: '',
            role: 'Lead'
        });
        setMatches([]);
        setSelectedActors(new Set());
        setError(null);
    };

    useEffect(() => {
        if (!isOpen) {
            resetModal();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {loading && (
                <AILoadingState
                    message="Finding Perfect Actors..."
                    subMessage="Analyzing profiles and matching with your character"
                />
            )}

            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#231810] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#684831]">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-primary to-purple-600 rounded-full p-2">
                                <span className="material-symbols-outlined text-white text-2xl">
                                    person_search
                                </span>
                            </div>
                            <div>
                                <h2 className="text-black dark:text-white text-xl font-bold">
                                    AI Casting Suggestions
                                </h2>
                                <p className="text-gray-600 dark:text-[#cba990] text-sm">
                                    {step === 'input' ? 'Describe your character' : `${matches.length} matches found`}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
                        {step === 'input' ? (
                            <div className="p-6 space-y-4">
                                {/* Error Display */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                                        <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                                        <div className="flex-1">
                                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setError(null)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                )}
                                {/* Character Name */}
                                <div>
                                    <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                        Character Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={character.name}
                                        onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                                        placeholder="e.g., Sarah Connor"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Age and Gender */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                            Age Range *
                                        </label>
                                        <input
                                            type="text"
                                            value={character.age}
                                            onChange={(e) => setCharacter({ ...character, age: e.target.value })}
                                            placeholder="e.g., 25-35"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                            Gender *
                                        </label>
                                        <select
                                            value={character.gender}
                                            onChange={(e) => setCharacter({ ...character, gender: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-binary">Non-binary</option>
                                            <option value="Any">Any</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Role Type */}
                                <div>
                                    <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                        Role Type
                                    </label>
                                    <div className="flex gap-2">
                                        {(['Lead', 'Supporting', 'Cameo'] as const).map((roleType) => (
                                            <button
                                                type="button"
                                                key={roleType}
                                                onClick={() => setCharacter({ ...character, role: roleType })}
                                                className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all ${character.role === roleType
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200 dark:bg-[#342418] text-gray-700 dark:text-[#cba990] hover:bg-gray-300 dark:hover:bg-[#493222]'
                                                    }`}
                                            >
                                                {roleType}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Physical Description */}
                                <div>
                                    <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                        Physical Description
                                    </label>
                                    <textarea
                                        value={character.physicalDescription}
                                        onChange={(e) => setCharacter({ ...character, physicalDescription: e.target.value })}
                                        placeholder="e.g., Athletic build, 5'8&quot;, dark hair, strong presence"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                    />
                                </div>

                                {/* Personality */}
                                <div>
                                    <label className="block text-black dark:text-white text-sm font-bold mb-2">
                                        Personality & Traits
                                    </label>
                                    <textarea
                                        value={character.personality}
                                        onChange={(e) => setCharacter({ ...character, personality: e.target.value })}
                                        placeholder="e.g., Confident, determined, natural leader with a vulnerable side"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-[#684831] bg-white dark:bg-[#342418] text-black dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                    />
                                </div>

                                {/* Find Button */}
                                <button
                                    type="button"
                                    onClick={handleFindActors}
                                    disabled={!character.name || !character.age || !character.gender}
                                    className="w-full bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-4 rounded-lg font-bold text-lg hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                                    <span>Find Perfect Actors</span>
                                </button>
                            </div>
                        ) : (
                            <div className="p-6">
                                {matches.length === 0 ? (
                                    <div className="text-center py-12">
                                        <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-[#684831] mb-4">
                                            person_off
                                        </span>
                                        <p className="text-gray-600 dark:text-[#cba990] text-lg">
                                            No matching actors found
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setStep('input')}
                                            className="mt-4 text-primary font-bold hover:underline"
                                        >
                                            Try different criteria
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {matches.map((match) => (
                                            <div
                                                key={match.userId}
                                                className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${selectedActors.has(match.userId)
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-gray-200 dark:border-[#684831] hover:border-primary/50'
                                                    }`}
                                                onClick={() => toggleActor(match.userId)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Profile Photo */}
                                                    <div className="relative">
                                                        <img
                                                            src={match.userPhoto || 'https://via.placeholder.com/80'}
                                                            alt={match.userName}
                                                            className="w-20 h-20 rounded-full object-cover"
                                                        />
                                                        {/* Match Score Badge */}
                                                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm shadow-lg">
                                                            {match.matchScore}%
                                                        </div>
                                                    </div>

                                                    {/* Actor Info */}
                                                    <div className="flex-1">
                                                        <h3 className="text-black dark:text-white text-lg font-bold mb-1">
                                                            {match.userName}
                                                        </h3>

                                                        {/* Match Reasons */}
                                                        <div className="space-y-1 mb-2">
                                                            {match.reasons.map((reason, idx) => (
                                                                <div key={idx} className="flex items-start gap-2">
                                                                    <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">
                                                                        check_circle
                                                                    </span>
                                                                    <span className="text-gray-700 dark:text-[#cba990] text-sm">
                                                                        {reason}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Previous Roles */}
                                                        {match.portfolio.previousRoles.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {match.portfolio.previousRoles.slice(0, 3).map((role, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="bg-gray-200 dark:bg-[#342418] text-gray-700 dark:text-[#cba990] px-2 py-1 rounded text-xs font-medium"
                                                                    >
                                                                        {role}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Checkbox */}
                                                    <div className="flex items-center">
                                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selectedActors.has(match.userId)
                                                            ? 'bg-primary border-primary'
                                                            : 'border-gray-300 dark:border-[#684831]'
                                                            }`}>
                                                            {selectedActors.has(match.userId) && (
                                                                <span className="material-symbols-outlined text-white text-lg">
                                                                    check
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {step === 'results' && matches.length > 0 && (
                        <div className="p-6 border-t border-gray-200 dark:border-[#684831] bg-gray-50 dark:bg-[#1a1108]">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('input')}
                                    className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-[#684831] text-gray-700 dark:text-[#cba990] font-bold hover:bg-gray-100 dark:hover:bg-[#342418] transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleInviteSelected}
                                    disabled={selectedActors.size === 0}
                                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                    <span>Invite {selectedActors.size} Actor{selectedActors.size !== 1 ? 's' : ''}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
