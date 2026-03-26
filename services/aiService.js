import axios from 'axios';

// IMPORTANT: Replace with your computer's local IPv4 address if you are testing on a 
// physical phone over Wi-Fi (e.g. 'http://192.168.1.xxx:5000').
// For Android Studio Emulator, '10.0.2.2' maps to your computer's localhost.
const BASE_URL = 'http://10.57.94.44:5000';

export const getAIResponse = async (prompt, language = 'en', lat = null, lon = null) => {
    try {
        const response = await axios.post(`${BASE_URL}/chat`, {
            text: prompt,
            language: language,
            lat: lat,
            lon: lon
        }, {
            timeout: 45000, // 45s timeout for AI reasoning
        });
        
        if (response.data.success) {
            // response.data structured per ai_pipeline.py output
            return response.data.response;
        } else {
            console.error("AI Server Error:", response.data.error);
            return "AI failed to process the request.";
        }
    } catch (error) {
        console.error("Axios Network Error:", error.message);
        return "AI is unreachable. Ensure Flask is running & URL is correct.";
    }
};