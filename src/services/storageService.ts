import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';

export interface UploadResponse {
    url?: string;
    error?: string;
    provider?: 'cloudinary' | 'firebase' | 'local';
}

const uploadToFirebaseStorage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const filePath = `user_uploads/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};

// Helper to compress image
const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        width = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/jpeg', 0.7); // 70% quality
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const uploadFile = async (file: File): Promise<UploadResponse> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Validation for Free Tier limits
    const MAX_VIDEO_SIZE = 35 * 1024 * 1024; // 35MB
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB

    if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
        return { error: 'Video file too large. Max size is 35MB for free storage.' };
    }

    if (file.type.startsWith('audio/') && file.size > MAX_VIDEO_SIZE) {
        return { error: 'Audio file too large. Max size is 35MB for free storage.' };
    }

    let fileToUpload = file;

    // Compress Image if enabled and it's an image
    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
        return { error: 'Image file too large. Max size is 5MB for free storage.' };
    } else if (file.type.startsWith('image/')) {
        try {
            // Compress even if under 5MB to save bandwidth/storage
            fileToUpload = await compressImage(file);
        } catch (e) {
            console.warn("Compression failed, using original file", e);
        }
    }

    // Try Cloudinary Primary
    if (cloudName && uploadPreset) {
        try {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('upload_preset', uploadPreset);
            formData.append('folder', 'ifilm_user_uploads');

            const resourceType = fileToUpload.type.startsWith('image/') ? 'image' : 'video';
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.secure_url) {
                return { url: data.secure_url, provider: 'cloudinary' };
            }
            console.warn('[Cloudinary] Upload responded with issue, trying Firebase Storage fallback:', data.error);
        } catch (cloudinaryErr) {
            console.warn('[Cloudinary] Network/quota failure, falling back to Firebase Storage:', cloudinaryErr);
        }
    }

    // Secondary Free Cloud Fallback: Firebase Storage (5 GB Free Tier)
    try {
        const firebaseUrl = await uploadToFirebaseStorage(fileToUpload);
        return { url: firebaseUrl, provider: 'firebase' };
    } catch (firebaseErr: any) {
        console.error('[Storage] Both Cloudinary and Firebase Storage uploads failed:', firebaseErr);
        // Local preview fallback for development/offline
        if (typeof window !== 'undefined') {
            return { url: URL.createObjectURL(fileToUpload), provider: 'local' };
        }
        return { error: firebaseErr?.message || 'Upload failed across all storage providers' };
    }
};
