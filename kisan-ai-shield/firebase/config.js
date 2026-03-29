/**
 * firebase/config.js
 * Firebase initialization for Kisan AI Shield (Saagu360 project)
 * Uses EXPO_PUBLIC_* env vars exposed via app.config.js extra fields
 */
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

/**
 * Firestore with offline persistence.
 * Falls back to memory-only cache if persistence isn't supported (rare edge case).
 */
let db;
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
  console.log('[Firebase] Firestore initialized with memory cache.');
} catch (e) {
  console.warn('[Firebase] Primary Firestore init failed, falling back:', e.message);
  db = getFirestore(app);
}

/**
 * Firebase Auth with AsyncStorage persistence —
 * keeps user logged in across app restarts.
 */
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { db };
export default app;
