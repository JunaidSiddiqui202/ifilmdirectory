import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/imageUtils';
import { uploadFile } from '../services/storageService';

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
}

export default function ImageUploadModal({ isOpen, onClose, onSave }: ImageUploadModalProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setLoading(true);
        try {
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedImageBlob) {
                const file = new File([croppedImageBlob], "profile_pic.jpg", { type: "image/jpeg" });
                const response = await uploadFile(file);
                if (response.url) {
                    onSave(response.url);
                    onClose();
                } else {
                    alert('Upload failed: ' + response.error);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Update Profile Picture</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 p-4 flex flex-col items-center justify-center min-h-[300px] relative bg-zinc-100 dark:bg-black">
                    {!imageSrc ? (
                        <div className="text-center">
                            <label className="cursor-pointer flex flex-col items-center gap-2 p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-primary hover:text-primary transition-colors text-zinc-500 dark:text-zinc-400">
                                <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                                <span className="font-medium">Select Image</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                    ) : (
                        <div className="relative w-full h-64 bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                    )}
                </div>

                {imageSrc && (
                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs text-zinc-500">Zoom</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-primary"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setImageSrc(null)}
                                className="flex-1 py-2.5 rounded-lg font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Change Image
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                {loading ? 'Saving...' : 'Save & Update'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
