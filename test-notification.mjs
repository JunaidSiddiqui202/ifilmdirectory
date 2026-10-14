import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from './src/firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

// Wait for auth to initialize
setTimeout(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.error('No user logged in! Please log in first.');
        process.exit(1);
    }

    console.log('Creating test notification for user:', currentUser.uid);

    try {
        await addDoc(collection(db, 'notifications'), {
            userId: currentUser.uid,
            type: 'system',
            title: '🔔 Test Notification',
            message: 'This is a test notification to check the sound! If you hear a beep or notification sound, everything is working perfectly! 🎉',
            createdAt: serverTimestamp(),
            isRead: false,
            actionLink: '/notifications'
        });

        console.log('✅ Test notification created successfully!');
        console.log('You should hear a sound and see a popup notification.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating notification:', error);
        process.exit(1);
    }
}, 1000);
