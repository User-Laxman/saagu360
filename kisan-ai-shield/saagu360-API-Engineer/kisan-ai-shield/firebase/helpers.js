import { db, auth } from './config';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  addDoc, serverTimestamp, query, where, getDocs 
} from "firebase/firestore";

/**
 * --- User Profile Management ---
 */

export const getUserProfile = async (userId) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateUserProfile = async (userId, data) => {
  const docRef = doc(db, "users", userId);
  return await setDoc(docRef, { ...data, lastUpdated: serverTimestamp() }, { merge: true });
};

/**
 * --- Caching Utilities ---
 */

export const getCachedSchemes = async () => {
  const docRef = doc(db, "schemes_cache", "global");
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateSchemesCache = async (schemes) => {
  const docRef = doc(db, "schemes_cache", "global");
  return await setDoc(docRef, { 
    data: schemes, 
    lastUpdated: serverTimestamp() 
  });
};

export const getCachedMarketPrices = async (commodity) => {
  const docRef = doc(db, "market_prices", commodity.toLowerCase());
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

/**
 * --- Logs & History ---
 */

export const logApiCall = async (service, status, error = null) => {
  try {
    await addDoc(collection(db, "api_logs"), {
      service,
      status,
      error,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.warn("Logging failed:", e);
  }
};

export const saveDiseaseLog = async (diagnosisResult) => {
  const user = auth.currentUser;
  if (!user) return;
  return await addDoc(collection(db, `users/${user.uid}/disease_logs`), {
    ...diagnosisResult,
    timestamp: serverTimestamp()
  });
};

export const saveEligibilityResult = async (result, farmerSnapshot) => {
  const user = auth.currentUser;
  if (!user) return;
  return await addDoc(collection(db, `users/${user.uid}/eligibility_checks`), {
    result,
    farmerSnapshot,
    timestamp: serverTimestamp()
  });
};
