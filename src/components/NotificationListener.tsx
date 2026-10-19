import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, type NotificationData } from '../services/notificationService';
import { playNotificationSound } from '../services/fcmService';
import { useNavigate } from 'react-router-dom';

export default function NotificationListener() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [toast, setToast] = useState<NotificationData | null>(null);
    const isFirstSnapshotRef = useRef<boolean>(true);
    const knownIdsRef = useRef<Set<string>>(new Set());

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
                // On initial load, register existing notification IDs without triggering alerts
                if (isFirstSnapshotRef.current) {
                    isFirstSnapshotRef.current = false;
                    notifications.forEach(n => knownIdsRef.current.add(n.id));
                    return;
                }

                // Detect truly new notifications added after listener was mounted
                const newItems = notifications.filter(n => !knownIdsRef.current.has(n.id) && !n.isRead);
                notifications.forEach(n => knownIdsRef.current.add(n.id));

                if (newItems.length > 0) {
                    const latest = newItems[0];

                    // Trigger sound safely
                    try {
                        playNotificationSound();
                    } catch (e) {
                        console.warn('[NotificationListener] Audio play failed:', e);
                    }

                    // Show in-app banner toast
                    setToast(latest);

                    // Show system notification safely if supported and permitted
                    if (isNotificationSupported) {
                        try {
                            if (window.Notification.permission === 'granted') {
                                new window.Notification(latest.title, {
                                    body: latest.message,
                                    icon: '/logo.png',
                                    badge: '/logo.png',
                                    tag: latest.id
                                });
                            }
                        } catch (e) {
                            console.warn('[NotificationListener] Error displaying system notification:', e);
                        }
                    }

                    // Auto hide toast after 6 seconds
                    setTimeout(() => setToast(null), 6000);
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
                else navigate('/messaging?tab=notifications');
            }}
        >
            <div className={`size-12 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg ${
                toast.type === 'message'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'
                    : toast.type === 'job'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                    : toast.type === 'like'
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30'
                    : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
            }`}>
                {toast.image ? (
                    <img src={toast.image} alt="" className="size-full rounded-full object-cover" />
                ) : (
                    <span className="material-symbols-outlined">
                        {toast.type === 'like' ? 'favorite' :
                            toast.type === 'comment' || toast.type === 'message' ? 'chat_bubble' :
                                toast.type === 'job' ? 'work' : 'notifications'}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    {toast.type === 'message' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Message
                        </span>
                    )}
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{toast.title}</h4>
                </div>
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
