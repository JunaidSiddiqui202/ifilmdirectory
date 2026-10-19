import MediaUploadModal from './MediaUploadModal';

export interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
}

/**
 * @deprecated Use `MediaUploadModal` with `variant="avatar"` instead.
 */
export default function ImageUploadModal({ isOpen, onClose, onSave }: ImageUploadModalProps) {
    return (
        <MediaUploadModal
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            variant="avatar"
            aspectRatio={1}
        />
    );
}
