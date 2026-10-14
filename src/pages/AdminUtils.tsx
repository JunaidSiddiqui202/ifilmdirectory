import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showreelService } from '../services/showreelService';

export default function AdminUtils() {
    const navigate = useNavigate();
    const [isClearing, setIsClearing] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [message, setMessage] = useState('');

    const handleClearShowreels = async () => {
        if (!confirm('Are you sure you want to delete all showreels?')) return;

        setIsClearing(true);
        setMessage('');
        try {
            await showreelService.clearAllShowreels();
            setMessage('✅ All showreels cleared successfully!');
        } catch (error) {
            setMessage('❌ Error clearing showreels: ' + error);
        } finally {
            setIsClearing(false);
        }
    };

    const handleSeedShowreels = async () => {
        setIsSeeding(true);
        setMessage('');
        try {
            await showreelService.seedShowreels();
            setMessage('✅ Showreels seeded successfully!');
        } catch (error) {
            setMessage('❌ Error seeding showreels: ' + error);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleResetShowreels = async () => {
        if (!confirm('This will delete all showreels and create new demo ones. Continue?')) return;

        setIsClearing(true);
        setMessage('Clearing old showreels...');

        try {
            await showreelService.clearAllShowreels();
            setMessage('✅ Cleared! Now seeding...');
            setIsClearing(false);
            setIsSeeding(true);

            await showreelService.seedShowreels();
            setMessage('✅ All done! Showreels reset successfully. Refresh the app to see them.');
        } catch (error) {
            setMessage('❌ Error: ' + error);
        } finally {
            setIsClearing(false);
            setIsSeeding(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Admin Utilities</h1>
                </div>

                {/* Message */}
                {message && (
                    <div className="mb-6 p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white whitespace-pre-wrap">{message}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Reset Showreels (Recommended)</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            This will delete all existing showreels and create new demo showreels with working video files.
                            Use this to fix the blank screen issue.
                        </p>
                        <button
                            onClick={handleResetShowreels}
                            disabled={isClearing || isSeeding}
                            className="w-full bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            {isClearing || isSeeding ? 'Processing...' : '🔄 Reset All Showreels'}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Clear Showreels</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Delete all showreels from the database.
                        </p>
                        <button
                            onClick={handleClearShowreels}
                            disabled={isClearing}
                            className="w-full bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
                        >
                            {isClearing ? 'Clearing...' : '🗑️ Clear All Showreels'}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Seed Showreels</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Add demo showreels to the database.
                        </p>
                        <button
                            onClick={handleSeedShowreels}
                            disabled={isSeeding}
                            className="w-full bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                            {isSeeding ? 'Seeding...' : '🌱 Seed Demo Showreels'}
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900">
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">💡 How to Fix Blank Screen</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-2 list-decimal list-inside">
                        <li>Click "Reset All Showreels" button above</li>
                        <li>Wait for the success message</li>
                        <li>Go back to the home page or showreel viewer</li>
                        <li>Refresh the page to see the new videos</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
