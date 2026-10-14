import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function SuccessModal({
    isOpen,
    onClose,
    title = "Success!",
    message = "Your work has been uploaded successfully.",
    actionLabel = "View in Showcase",
    onAction
}: SuccessModalProps) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5">
                {/* Top Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent pointer-events-none" />

                <div className="relative p-8 flex flex-col items-center text-center">
                    {/* Success Icon */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse" />
                        <div className="size-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30 relative z-10">
                            <span className="material-symbols-outlined text-white text-4xl filled">check_circle</span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-2 uppercase">
                        {title}
                    </h3>

                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={() => {
                                if (onAction) onAction();
                                else navigate('/showcase');
                                onClose();
                            }}
                            className="w-full py-4 rounded-2xl bg-primary text-background-dark font-black tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                        >
                            {actionLabel}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-zinc-400 dark:text-zinc-500 font-bold text-sm uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Animated Bottom Glow */}
                <div className="absolute -bottom-12 -left-12 size-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>
        </div>
    );
}
