import MediaUploadModal from './MediaUploadModal';

export interface GalleryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
}

/**
 * @deprecated Use `MediaUploadModal` with `variant="gallery"` instead.
 */
export default function GalleryUploadModal({ isOpen, onClose, onSave }: GalleryUploadModalProps) {
    return (
        <MediaUploadModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            variant="gallery"
            aspectRatio={null}
        />
    );
}
