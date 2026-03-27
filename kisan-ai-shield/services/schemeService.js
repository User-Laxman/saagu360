import axios from 'axios';
import { BASE_URL } from './apiConfig';

export const fetchEligibleSchemes = async (farmerProfile) => {
    try {
        const response = await axios.post(`${BASE_URL}/schemes`, farmerProfile, {
            timeout: 60000, // 60s — LLM reasoning can be slow
        });

        if (response.data.success) {
            return { success: true, schemes: response.data.schemes };
        } else {
            console.error("Schemes Error:", response.data.error);
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        console.error("Axios Schemes Error:", error.message);
        return { success: false, error: "Could not reach the Schemes AI. Ensure backend is running." };
    }
};
