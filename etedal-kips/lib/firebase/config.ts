import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyDMKU1TvrMALcHfFoW0veOkZb5qY_0_Ym8',
    authDomain: 'e3tdal-32697.firebaseapp.com',
    projectId: 'e3tdal-32697',
    storageBucket: 'e3tdal-32697.firebasestorage.app',
    messagingSenderId: '580897973084',
    appId: '1:580897973084:web:5565fa18f554433b229799',
    measurementId: 'G-DXXC17K6MN',
};

// Initialize Firebase (client-side only)
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
    // Only initialize on client side
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApps()[0];
    }
    db = getFirestore(app);
}

export { app, db };
