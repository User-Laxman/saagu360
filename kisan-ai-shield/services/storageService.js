import { db } from "../firebase/config";
import { collection, addDoc, getDocs, orderBy, query, limit } from "firebase/firestore";

/**
 * Saves weather record to weatherLogs collection.
 * @param {object} weatherData - Current weather snapshot.
 * @returns {Promise<string|null>} Doc ID or null.
 */
export const saveWeatherLog = async (weatherData) => {
  try {
    const docRef = await addDoc(collection(db, "weatherLogs"), {
      ...weatherData,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Storage Error (saveWeatherLog):", error);
    return null;
  }
};

/**
 * Retrieves the most recent weather log.
 * @returns {Promise<object|null>} Data object or null.
 */
export const getLatestWeatherLog = async () => {
  try {
    const q = query(collection(db, "weatherLogs"), orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error("Storage Error (getLatestWeatherLog):", error);
    return null;
  }
};

/**
 * Saves irrigation advice to irrigationLogs collection.
 * @param {object} adviceData - Advice object.
 * @returns {Promise<string|null>} Doc ID or null.
 */
export const saveIrrigationLog = async (adviceData) => {
  try {
    const docRef = await addDoc(collection(db, "irrigationLogs"), {
      ...adviceData,
      timestamp: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Storage Error (saveIrrigationLog):", error);
    return null;
  }
};

/**
 * Fetches irrigation history.
 * @param {number} limitCount - Records to fetch (default 5).
 * @returns {Promise<Array|null>} Array of logs or null.
 */
export const getIrrigationHistory = async (limitCount = 5) => {
  try {
    const q = query(collection(db, "irrigationLogs"), orderBy("timestamp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Storage Error (getIrrigationHistory):", error);
    return null;
  }
};
