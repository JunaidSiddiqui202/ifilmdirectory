import { useState, type ReactNode } from 'react';

interface ExternalLinkProps {
    href: string;
    children: ReactNode;
    className?: string;
}

// Extract domain from URL for display
const extractDomain = (url: string): string => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
};

// External Link Confirmation Modal
function ExternalLinkModal({
    isOpen,
    url,
    onClose,
    onConfirm
}: {
    isOpen: boolean;
    url: string;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">open_in_new</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white text-center">
                    Leaving iFilmDirectory
                </h3>

                {/* Message */}
                <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center">
                    You're about to open an external link. This will take you to:
                </p>

                {/* URL Preview */}
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-center">
                    <span className="material-symbols-outlined text-sm text-zinc-500 mr-1">link</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium break-all">
                        {extractDomain(url)}
                    </span>
                </div>

                {/* Warning */}
                <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
                    iFilmDirectory is not responsible for content on external sites.
                </p>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 px-4 rounded-full bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                    >
                        <span>Open Link</span>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ExternalLink({ href, children, className = "" }: ExternalLinkProps) {
    const [showModal, setShowModal] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowModal(true);
    };

    const handleConfirm = () => {
        window.open(href, '_blank', 'noopener,noreferrer');
        setShowModal(false);
    };

    return (
        <>
            <a
                href={href}
                onClick={handleClick}
                className={className}
            >
                {children}
            </a>
            <ExternalLinkModal
                isOpen={showModal}
                url={href}
                onClose={() => setShowModal(false)}
                onConfirm={handleConfirm}
            />
        </>
    );
}
