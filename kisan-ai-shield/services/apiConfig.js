import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    try {
        const host = 
            Constants?.expoConfig?.hostUri || 
            Constants?.manifest?.debuggerHost || 
            Constants?.manifest2?.extra?.expoGo?.debuggerHost;

        if (host) {
            const ip = host.split(':')[0];
            return `http://${ip}:5000`;
        }
    } catch (e) {
        console.warn("Could not automatically resolve Expo host URL.", e);
    }

    // Platform-aware fallback: Android emulator → 10.0.2.2, iOS/Web → localhost
    const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${fallbackHost}:5000`;
};

export const BASE_URL = getBaseUrl();
console.log('[apiConfig] Resolved BASE_URL:', BASE_URL);
