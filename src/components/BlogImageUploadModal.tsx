import MediaUploadModal from './MediaUploadModal';

export interface BlogImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (url: string) => void;
}

/**
 * @deprecated Use `MediaUploadModal` with `variant="blog"` instead.
 */
export default function BlogImageUploadModal({ isOpen, onClose, onUpload }: BlogImageUploadModalProps) {
    return (
        <MediaUploadModal
            isOpen={isOpen}
            onClose={onClose}
            onUpload={onUpload}
            variant="blog"
            aspectRatio={null}
        />
    );
}
