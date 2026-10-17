import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, type NotificationData } from '../services/notificationService';
import { playNotificationSound } from '../services/fcmService';
import { useNavigate } from 'react-router-dom';

export default function NotificationListener() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [toast, setToast] = useState<NotificationData | null>(null);
    const lastNotifTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!currentUser) return;

        // Safely check if browser Notification API is supported (iOS Safari / WebKit compatibility)
        const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';

        if (isNotificationSupported) {
            try {
                if (window.Notification.permission === 'default') {
                    window.Notification.requestPermission().catch(() => {});
                }
            } catch (e) {
                console.warn('[NotificationListener] Could not request notification permission:', e);
            }
        }

        const unsubscribe = subscribeToNotifications(
            currentUser.uid,
            (notifications) => {
                // Find new notifications relative to mount time/last check
                const latest = notifications[0];
                if (!latest) return;

                const latestTime = latest.createdAt?.toMillis ? latest.createdAt.toMillis() : (latest.createdAt?.seconds ? latest.createdAt.seconds * 1000 : 0);

                // Only show if it's strictly newer than our ref (plus a small buffer to avoid immediate self-trigger if times match exactly)
                if (latestTime > lastNotifTimeRef.current) {
                    lastNotifTimeRef.current = latestTime;

                    // Trigger sound safely
                    try {
                        playNotificationSound();
                    } catch (e) {
                        // Ignore autoplay audio restriction
                    }
                    setToast(latest);

                    // Show system notification safely if supported
                    if (isNotificationSupported) {
                        try {
                            if (window.Notification.permission === 'granted') {
                                new window.Notification(latest.title, {
                                    body: latest.message,
                                    icon: '/logo.png',
                                    badge: '/logo.png',
                                    tag: latest.id // Prevent dupes
                                });
                            }
                        } catch (e) {
                            console.warn('[NotificationListener] Error displaying system notification:', e);
                        }
                    }

                    // Auto hide toast
                    setTimeout(() => setToast(null), 5000);
                }
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    if (!toast) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 animate-in slide-in-from-top-5 fade-in duration-300 cursor-pointer flex gap-4 items-center hover:scale-[1.02] active:scale-[0.98] transition-all ring-1 ring-black/5"
            onClick={() => {
                setToast(null);
                if (toast.actionLink) navigate(toast.actionLink);
                else navigate('/notifications');
            }}
        >
            <div className="size-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/30">
                <span className="material-symbols-outlined">
                    {toast.type === 'like' ? 'favorite' :
                        toast.type === 'comment' ? 'chat_bubble' :
                            toast.type === 'job' ? 'work' : 'notifications'}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{toast.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-0.5">{toast.message}</p>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); setToast(null); }}
                className="size-6 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );
}
