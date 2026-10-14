import { useState } from 'react';
import { uploadFile } from '../services/storageService';

interface BlogImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (url: string) => void;
}

export default function BlogImageUploadModal({ isOpen, onClose, onUpload }: BlogImageUploadModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setLoading(true);
            try {
                const response = await uploadFile(file);
                if (response.url) {
                    onUpload(response.url);
                    onClose();
                } else {
                    alert('Upload failed: ' + response.error);
                }
            } catch (error) {
                console.error(error);
                alert('Upload failed');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 border-t sm:border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Upload Images</h3>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 text-orange-500">
                        <span className="material-symbols-outlined text-7xl">image</span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Upload Images</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8">Add visual elements to enhance your blog post</p>

                    <label className={`w-full p-8 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="w-16 h-16 mb-4 relative">
                            <span className="material-symbols-outlined text-6xl text-orange-500">image</span>
                            <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-1 text-white">
                                <span className="material-symbols-outlined text-sm">add</span>
                            </div>
                        </div>
                        <span className="text-orange-500 font-bold text-lg mb-1">
                            {loading ? 'Uploading...' : 'Choose from Library'}
                        </span>
                        <span className="text-zinc-400 text-sm">JPEG, PNG, HEIC supported</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
