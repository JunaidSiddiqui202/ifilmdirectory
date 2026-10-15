import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
    console.error('[Firebase] Missing configuration keys:', missingKeys);
    throw new Error(`Firebase configuration incomplete. Missing: ${missingKeys.join(', ')}`);
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
