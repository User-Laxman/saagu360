import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

/**
 * Mock data for government agricultural schemes.
 */
const MOCK_SCHEMES = [
  { name: "PM Kisan", benefit: "₹6000/year direct transfer", eligibility: "All small farmers" },
  { name: "Fasal Bima Yojana", benefit: "Crop insurance coverage", eligibility: "Farmers with crop loans" },
  { name: "Kisan Credit Card", benefit: "Low interest crop loans", eligibility: "All farmers" }
];

/**
 * Saves mock schemes to Firestore collection: schemes.
 * @returns {Promise<string|null>} Document ID or null on failure
 */
export const saveSchemes = async () => {
  try {
    const promises = MOCK_SCHEMES.map(scheme => 
      addDoc(collection(db, "schemes"), {
        ...scheme,
        timestamp: serverTimestamp(),
      })
    );
    const results = await Promise.all(promises);
    return results.map(doc => doc.id);
  } catch (error) {
    console.error("Error in saveSchemes:", error);
    return [];
  }
};

/**
 * Fetches all schemes from the Firestore collection: schemes.
 * @returns {Promise<Array>} List of schemes or fallback
 */
export const fetchAllSchemes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "schemes"));
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    // Fallback if no data is in Firestore yet, return mock data
    return MOCK_SCHEMES;
  } catch (error) {
    console.error("Error in fetchAllSchemes:", error);
    return MOCK_SCHEMES; // Always return fallback
  }
};
