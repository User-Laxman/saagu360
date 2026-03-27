import axios from 'axios';
import { BASE_URL } from './apiConfig';

export const predictDisease = async (imageUri, language = 'en') => {
    try {
        // We must use FormData to upload binary images in React Native
        const formData = new FormData();

        formData.append('image', {
            uri: imageUri,
            name: 'crop_scan.jpg',
            type: 'image/jpeg'
        });

        // Pass language to Python backend
        formData.append('language', language);

        // The headers are CRITICAL here so Flask knows how to parse request.files
        const response = await axios.post(`${BASE_URL}/predict`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30s timeout for vision inference
        });

        if (response.data.success) {
            // Return the structured object directly — screens consume this as-is
            return {
                success: true,
                diagnosis: response.data.diagnosis,
                confidence: response.data.confidence_score,
                severity: response.data.visual_severity,
                recommendation: response.data.recommendation,
            };
        } else {
            console.error("Vision Error:", response.data.error);
            return { success: false, error: response.data.error || "Unable to identify disease." };
        }
    } catch (error) {
        console.error("Axios Network Error:", error.message);
        return { success: false, error: "Scanner is unreachable. Ensure the backend is active." };
    }
};