import { db, auth } from "../firebase/config";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

/**
 * MOCK: Predicts disease from a leaf image URI.
 * @param {string} imageUri 
 * @returns {Promise<string>} Diagnosis result string.
 */
export const predictDisease = async (imageUri) => {
  // Simulated ML delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const mockResults = [
    "Maize Leaf Blight\nConfidence: 0.92",
    "Rice Blast\nConfidence: 0.88",
    "Tomato Late Blight\nConfidence: 0.95",
    "Healthy Leaf\nConfidence: 0.99"
  ];
  
  return mockResults[Math.floor(Math.random() * mockResults.length)];
};

/**
 * Saves a crop disease scan result to Firestore.
 * Matches Task 3D: saveDiseaseLog(userId, diagnosisResult)
 * Note: uses auth.currentUser.uid if userId not provided.
 */
export const saveDiseaseLog = async (userId, diagnosisResult) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) throw new Error("User ID required to save log");

    const docRef = await addDoc(collection(db, `users/${uid}/disease_logs`), {
      ...diagnosisResult,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error in saveDiseaseLog:", error);
    return null;
  }
};

/**
 * Fetches disease scan history from Firestore.
 * Matches Task 3D: getDiseaseHistory(userId)
 */
export const getDiseaseHistory = async (userId) => {
  try {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    const q = query(
      collection(db, `users/${uid}/disease_logs`),
      orderBy("timestamp", "desc"),
      limit(10)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
  } catch (error) {
    console.error("Error in getDiseaseHistory:", error);
    return [];
  }
};
