import axios from 'axios';
import { BASE_URL } from './apiConfig';

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

export const sendVoiceQuery = async (audioUri, language = 'en', lat = null, lon = null) => {
    try {
        const formData = new FormData();

        // Append audio file
        formData.append('audio', {
            uri: audioUri,
            type: 'audio/m4a', // Default format for expo-av
            name: 'voice_query.m4a',
        });

        formData.append('language', language);
        if (lat) formData.append('lat', lat);
        if (lon) formData.append('lon', lon);

        const response = await axios.post(`${BASE_URL}/voice-chat`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60s timeout for STT + LLM
        });

        if (response.data.success) {
            return {
                text: response.data.transcribed_query,
                response: response.data.response
            };
        } else {
            console.error("Voice Server Error:", response.data.error);
            return { error: "Voice processing failed." };
        }
    } catch (error) {
        console.error("Axios Network Error:", error.message);
        return { error: "Voice API unreachable. Ensure Flask is running." };
    }
};

export const translateChat = async (texts, targetLang) => {
    try {
        const response = await axios.post(`${BASE_URL}/translate`, { 
            texts, 
            target: targetLang 
        });
        if (response.data.success) {
            return response.data.translations;
        }
        return texts;
    } catch (e) {
        console.warn("Translation API failed:", e.message);
        return texts;
    }
};