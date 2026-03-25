import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

/**
 * Saves a crop disease scan result to Firestore collection: disease_logs.
 * @param {object} scanResult - { cropName, diseaseName, confidence, solution }
 * @returns {Promise<string|null>} Document ID or null on failure
 */
export const saveDiseaseScan = async (scanResult) => {
  try {
    const docRef = await addDoc(collection(db, "disease_logs"), {
      ...scanResult,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error in saveDiseaseScan:", error);
    return null;
  }
};

/**
 * Fetches the last 10 disease scan results from Firestore.
 * @returns {Promise<Array>} List of scan results or fallback
 */
export const fetchLastScans = async () => {
  try {
    const q = query(
      collection(db, "disease_logs"),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
  } catch (error) {
    console.error("Error in fetchLastScans:", error);
    return []; // Return empty array as fallback
  }
};
