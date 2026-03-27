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

    // Absolute fallback: Since we pulled "10.98.63.238" from `ipconfig` during this session, 
    // we set it as the ultimate failsafe instead of an emulator localhost.
    return 'http://10.98.63.238:5000';
};

export const BASE_URL = getBaseUrl();
