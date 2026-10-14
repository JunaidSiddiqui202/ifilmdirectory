import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebaseConfig';

async function check() {
  try {
    const snapshot = await getDocs(collection(db, 'facilities'));
    console.log('--- FIRESTORE FACILITIES ---');
    snapshot.docs.forEach(doc => {
      console.log(`ID: ${doc.id}, Name: ${doc.get('name')}, Type: ${doc.get('type')}`);
    });
    console.log('--- END ---');
  } catch (e) {
    console.error(e);
  }
}

check();
