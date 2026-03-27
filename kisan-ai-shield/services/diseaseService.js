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
        });

        if (response.data.success) {
            // The pipeline returns { success, diagnosis, confidence_score }
            const percentage = (response.data.confidence_score * 100).toFixed(1);
            return `${response.data.diagnosis}\nConfidence: ${percentage}%`;
        } else {
            console.error("Vision Error:", response.data.error);
            return "Unable to identify disease.";
        }
    } catch (error) {
        console.error("Axios Network Error:", error.message);
        return "Scanner is unreachable. Ensure the backend is active.";
    }
};