import { useEffect, useRef } from 'react';

interface UseModalAccessibilityOptions {
    isOpen: boolean;
    onClose: () => void;
    initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function useModalAccessibility<T extends HTMLElement = HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef,
}: UseModalAccessibilityOptions) {
    const modalRef = useRef<T>(null);
    const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

    // Save previous active element when opened and restore when closed
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

        // Prevent body scrolling while modal is open
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Initial focus
        const focusTimer = setTimeout(() => {
            if (initialFocusRef?.current) {
                initialFocusRef.current.focus();
            } else if (modalRef.current) {
                // Focus first focusable element inside modal, or modal itself
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length > 0) {
                    focusable[0].focus();
                } else {
                    modalRef.current.focus();
                }
            }
        }, 30);

        return () => {
            clearTimeout(focusTimer);
            document.body.style.overflow = originalOverflow;
            if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
                previouslyFocusedElementRef.current.focus();
            }
        };
    }, [isOpen, initialFocusRef]);

    // Handle Escape and Tab trapping
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            if (e.key === 'Tab') {
                if (!modalRef.current) return;
                const focusables = Array.from(
                    modalRef.current.querySelectorAll<HTMLElement>(
                        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                    )
                ).filter(el => el.offsetParent !== null); // only visible elements

                if (focusables.length === 0) {
                    e.preventDefault();
                    return;
                }

                const first = focusables[0];
                const last = focusables[focusables.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return { modalRef };
}
