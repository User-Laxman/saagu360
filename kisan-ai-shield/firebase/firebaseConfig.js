import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

/**
 * Firebase configuration for Saagu360.
 */
const firebaseConfig = {
  apiKey: "AIzaSyATTRtyCcKyo5L7QNg5llKLnR9vzFoNzT8",
  authDomain: "saagu360.firebaseapp.com",
  projectId: "saagu360",
  storageBucket: "saagu360.firebasestorage.app",
  messagingSenderId: "93084798783",
  appId: "1:93084798783:web:960b492b1e25f9d8b4cd8a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

/**
 * Firestore database instance.
 */
export const db = getFirestore(app);

/**
 * Firebase Auth instance with Persistence.
 */
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
