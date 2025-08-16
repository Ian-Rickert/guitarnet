import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAV6O60ckyH85RPdidw96HxnDZQGb-4ei0",
  authDomain: "guitarnet-6a13f.firebaseapp.com",
  projectId: "guitarnet-6a13f",
  storageBucket: "guitarnet-6a13f.firebasestorage.app",
  messagingSenderId: "220242683677",
  appId: "1:220242683677:web:c16b3ed9f99a7fc038e3f4",
  measurementId: "G-2ZCG6JV3LL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app; 

 