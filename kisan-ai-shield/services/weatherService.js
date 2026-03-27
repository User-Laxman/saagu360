import axios from 'axios';
import * as Location from 'expo-location';
import { BASE_URL } from './apiConfig';
export const fetchWeather = async () => {
    try {
        let lat = 17.2473;
        let lon = 80.1514;
        
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                // Use a strict timeout so the UI doesn't hang if GPS is disabled on the phone
                let loc = await Location.getCurrentPositionAsync({ 
                    accuracy: Location.Accuracy.Balanced,
                    timeout: 5000 
                });
                lat = loc.coords.latitude;
                lon = loc.coords.longitude;
            }
        } catch(e) { console.log('Location fetch timed out or failed. Falling back to default.'); }

        const response = await axios.get(`${BASE_URL}/weather`, {
            params: { lat, lon },
            timeout: 10000,
        });

        if (response.data.success) {
            return {
                current: response.data.current,
                forecast: response.data.forecast,
            };
        }
        return null;
    } catch (error) {
        console.error("Weather Service Error:", error.message);
        return null;
    }
};
