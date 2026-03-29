/**
 * firebase/helpers.js
 * Reusable Firestore helper functions for Kisan AI Shield.
 * Handles: user profiles, disease logs, eligibility results, API call logging.
 */
import { db, auth } from './config';
import {
  collection, doc, getDoc, setDoc, addDoc,
  serverTimestamp, query, orderBy, limit, getDocs,
} from 'firebase/firestore';

// ─── User Profile ─────────────────────────────────────────────────

export const getUserProfile = async (userId) => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('[helpers] getUserProfile failed:', e.message);
    return null;
  }
};

export const updateUserProfile = async (userId, data) => {
  try {
    await setDoc(
      doc(db, 'users', userId),
      { ...data, lastUpdated: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[helpers] updateUserProfile failed:', e.message);
  }
};

// ─── Disease Scan Logs ────────────────────────────────────────────

/**
 * Save a disease scan result to Firestore.
 * Call this after every successful vision engine response.
 * @param {object} diagnosisResult — { diagnosis, confidence, severity, recommendation }
 */
export const saveDiseaseLog = async (diagnosisResult) => {
  try {
    const user = auth.currentUser;
    // Fallback: save to global collection if not authenticated
    const collPath = user
      ? `users/${user.uid}/disease_logs`
      : 'disease_logs_anonymous';

    const ref = await addDoc(collection(db, collPath), {
      ...diagnosisResult,
      timestamp: serverTimestamp(),
    });
    console.log('[helpers] Disease log saved:', ref.id);
    return ref.id;
  } catch (e) {
    console.warn('[helpers] saveDiseaseLog failed:', e.message);
    return null;
  }
};

/**
 * Fetch the last N disease scan logs for the current user.
 * @param {number} n — number of records to fetch
 */
export const getDiseaseHistory = async (n = 10) => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      collection(db, `users/${user.uid}/disease_logs`),
      orderBy('timestamp', 'desc'),
      limit(n)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[helpers] getDiseaseHistory failed:', e.message);
    return [];
  }
};

// ─── Scheme Eligibility Results ───────────────────────────────────

/**
 * Save a scheme eligibility check result to Firestore.
 * @param {object} result — eligibility result from Gemini / rule engine
 * @param {object} farmerSnapshot — the profile used for the check
 */
export const saveEligibilityResult = async (result, farmerSnapshot) => {
  try {
    const user = auth.currentUser;
    const collPath = user
      ? `users/${user.uid}/eligibility_checks`
      : 'eligibility_checks_anonymous';

    await addDoc(collection(db, collPath), {
      result,
      farmerSnapshot,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('[helpers] saveEligibilityResult failed:', e.message);
  }
};

// ─── API Call Logging ─────────────────────────────────────────────

/**
 * Log an API call for debugging/monitoring purposes.
 * @param {string} service — e.g. 'marketAPI', 'schemesAI', 'vision'
 * @param {'ok'|'error'} status
 * @param {string|null} error — error message if status is 'error'
 */
export const logApiCall = async (service, status, error = null) => {
  try {
    await addDoc(collection(db, 'api_logs'), {
      service,
      status,
      error,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    // Silent — logging failure should never break the app
  }
};

// ─── Firestore Cache Helpers ──────────────────────────────────────

export const getCachedMarketPrices = async (commodity) => {
  try {
    const ref = doc(db, 'market_prices', commodity.toLowerCase());
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
};
