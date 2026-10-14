import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, setDoc, doc } from 'firebase/firestore';
import seedData from './seed_data.json';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import path from 'path';

// Fix for ES Modules: __dirname is not available directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedDatabase = async () => {
    console.log('🌱 Starting database seed...');

    try {
        // 1. Seed Jobs
        console.log('Uploading Jobs...');
        for (const job of seedData.jobs) {
            await addDoc(collection(db, 'jobs'), {
                ...job,
                postedAt: new Date(job.postedAt), // Convert string date to Object
                is_dummy: true
            });

            // Create user for the job poster
            if (job.postedBy && job.user_details) {
                await setDoc(doc(db, 'users', job.postedBy), {
                    uid: job.postedBy,
                    displayName: job.user_details.name,
                    photoURL: job.logo,
                    role: 'studio', // inferred
                    verification_level: job.user_details.verification_level,
                    is_dummy: true
                });
            }
        }

        // 2. Seed Showcase (Posts)
        console.log('Uploading Showcase Posts...');
        for (const post of seedData.showcase) {
            await addDoc(collection(db, 'posts'), {
                ...post,
                createdAt: new Date(),
                is_dummy: true
            });

            // Create user for the post author (generating a mock ID based on name)
            const userId = `user_${post.author.toLowerCase().replace(' ', '_')}`;
            await setDoc(doc(db, 'users', userId), {
                uid: userId,
                displayName: post.author,
                photoURL: post.user_image,
                role: post.role.toLowerCase(),
                verification_level: post.verification_level,
                is_dummy: true
            });
        }

        // 3. Seed Facilities
        console.log('Uploading Facilities...');
        for (const facility of seedData.facilities) {
            await addDoc(collection(db, 'facilities'), {
                ...facility,
                is_dummy: true
            });
            // No explicit owner ID in JSON, but we could add one if needed
        }

        // 4. Seed Blogs
        console.log('Uploading Blogs...');
        for (const blog of seedData.blogs) {
            await addDoc(collection(db, 'blogs'), {
                ...blog,
                date: new Date(),
                views: 0,
                likes: 0,
                is_dummy: true
            });
        }

        console.log('✅ Database seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
};

// --- Cleanup Function (Run this separately or uncomment to clean) ---
const deleteDummyData = async () => {
    console.log('🧹 Cleaning up dummy data...');
    const collections = ['jobs', 'posts', 'facilities', 'users', 'blogs'];

    for (const colName of collections) {
        const q = query(collection(db, colName), where('is_dummy', '==', true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`No dummy data found in ${colName}.`);
            continue;
        }

        console.log(`Found ${snapshot.size} dummy items in ${colName}. Deleting...`);
        const batchPromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(batchPromises);
    }
    console.log('✅ Cleanup complete.');
};


// Execute
const run = async () => {
    try {
        await deleteDummyData();
        await seedDatabase();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
