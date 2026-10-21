import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA0Cy6uodQxw7mC05S5f09XVww9X9P6nnE',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ifilmdirectory-94b82.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ifilmdirectory-94b82',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ifilmdirectory-94b82.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '298452830640',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:298452830640:web:b289b737a323bd3f2e6e75'
};

// Validate Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
    console.error('[Firebase] Missing configuration keys:', missingKeys);
}

console.log('[Firebase] Initializing with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

// Initialize Firebase services
export const app: FirebaseApp = initializeApp(firebaseConfig);
console.log('[Firebase] App initialized successfully');

export const auth: Auth = getAuth(app);
console.log('[Firebase] Auth initialized successfully');

export const db: Firestore = getFirestore(app);
console.log('[Firebase] Firestore initialized successfully');

export const storage: FirebaseStorage = getStorage(app);
console.log('[Firebase] Storage initialized successfully');

export const googleProvider = new GoogleAuthProvider();

// Customize Google Sign-In
googleProvider.setCustomParameters({
    prompt: 'select_account',
    display: 'popup'
});
