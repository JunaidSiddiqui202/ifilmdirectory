import { useState } from 'react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { app } from '../firebaseConfig';

export default function TestNotificationButton() {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState('');
    const db = getFirestore(app);

    const sendTestNotification = async () => {
        if (!currentUser) {
            setStatus('❌ Please log in first');
            return;
        }

        try {
            setStatus('⏳ Sending...');

            await addDoc(collection(db, 'notifications'), {
                userId: currentUser.uid,
                type: 'system',
                title: '🔔 Test Notification',
                message: 'This is a test notification! If you hear a sound (beep or notification-sound.mp3), the system is working perfectly! 🎉',
                createdAt: serverTimestamp(),
                isRead: false,
                actionLink: '/notifications'
            });

            setStatus('✅ Test notification sent! Listen for the sound...');

            // Clear status after 3 seconds
            setTimeout(() => setStatus(''), 3000);
        } catch (error) {
            console.error('Error:', error);
            setStatus('❌ Error: ' + (error as Error).message);
        }
    };

    return (
        <div className="fixed bottom-24 right-4 z-50">
            <button
                onClick={sendTestNotification}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                Test Sound
            </button>
            {status && (
                <div className="mt-2 text-xs bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg shadow-lg max-w-[200px]">
                    {status}
                </div>
            )}
        </div>
    );
}
