/**
 * services/storageService.js
 * Firestore-backed persistence for weather and irrigation history.
 * Enables cross-session history that survives app reinstall.
 */
import { db } from '../firebase/config';
import {
  collection, addDoc, getDocs,
  orderBy, query, limit,
} from 'firebase/firestore';

// ── Weather Logs ──────────────────────────────────────────────────

/**
 * Save a weather snapshot to Firestore.
 * Call after each successful weather fetch.
 * @param {object} weatherData — current weather object
 * @returns {string|null} Firestore doc ID or null on error
 */
export const saveWeatherLog = async (weatherData) => {
  try {
    const ref = await addDoc(collection(db, 'weatherLogs'), {
      ...weatherData,
      timestamp: new Date(),
    });
    return ref.id;
  } catch (e) {
    console.warn('[storageService] saveWeatherLog failed:', e.message);
    return null;
  }
};

/**
 * Retrieve the most recent weather log entry.
 * Useful for offline/stale display.
 * @returns {object|null}
 */
export const getLatestWeatherLog = async () => {
  try {
    const q = query(
      collection(db, 'weatherLogs'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  } catch (e) {
    console.warn('[storageService] getLatestWeatherLog failed:', e.message);
    return null;
  }
};

// ── Irrigation Logs ───────────────────────────────────────────────

/**
 * Save an irrigation advice record to Firestore.
 * @param {object} adviceData — { advice, urgency, reason, timestamp }
 * @returns {string|null}
 */
export const saveIrrigationLog = async (adviceData) => {
  try {
    const ref = await addDoc(collection(db, 'irrigationLogs'), {
      ...adviceData,
      timestamp: new Date(),
    });
    return ref.id;
  } catch (e) {
    console.warn('[storageService] saveIrrigationLog failed:', e.message);
    return null;
  }
};

/**
 * Fetch irrigation advice history.
 * @param {number} n — max records to return (default: 5)
 * @returns {Array}
 */
export const getIrrigationHistory = async (n = 5) => {
  try {
    const q = query(
      collection(db, 'irrigationLogs'),
      orderBy('timestamp', 'desc'),
      limit(n)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[storageService] getIrrigationHistory failed:', e.message);
    return [];
  }
};
