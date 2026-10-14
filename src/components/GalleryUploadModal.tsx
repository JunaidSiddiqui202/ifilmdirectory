import { useState } from 'react';
import { uploadFile } from '../services/storageService';

interface GalleryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
}

export default function GalleryUploadModal({ isOpen, onClose, onSave }: GalleryUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const response = await uploadFile(selectedFile);
            if (response.url) {
                onSave(response.url);
                onClose();
                setSelectedFile(null);
                setPreviewUrl(null);
            } else {
                alert('Upload failed: ' + response.error);
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong during upload');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Add Photo to Gallery</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-1">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6">
                    {!previewUrl ? (
                        <label className="flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                            <div className="size-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-4xl">add_photo_alternate</span>
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-zinc-900 dark:text-white">Click to select photo</p>
                                <p className="text-sm text-zinc-500">JPG, PNG or WEBP (Max 5MB)</p>
                            </div>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="flex-1 py-3 rounded-xl font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                            Add to Gallery
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
