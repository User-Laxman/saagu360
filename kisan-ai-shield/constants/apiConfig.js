/**
 * Centralized API configuration and constants for Kisan AI Shield.
 */
export const API_CONFIG = {
  // Endpoints
  SCHEMES_URL: process.env.EXPO_PUBLIC_SCHEMES_API_URL || 'https://api.data.gov.in/resource/47a0970a-9fef-427d-8cdd-767085fda87b',
  MARKET_URL: process.env.EXPO_PUBLIC_MARKET_API_URL || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
  DATA_GOV_KEY: process.env.EXPO_PUBLIC_DATA_GOV_API_KEY || '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a',
  GEMINI_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  WEATHER_KEY: process.env.EXPO_PUBLIC_WEATHER_KEY,

  // Cache Durations (in milliseconds)
  CACHE_DURATION: {
    SCHEMES: 24 * 60 * 60 * 1000, // 24 hours
    MARKET: 30 * 60 * 1000,       // 30 minutes
    WEATHER: 15 * 60 * 1000,      // 15 minutes
  },

  // Network Settings
  TIMEOUT: 10000, // 10 seconds
  RETRY_COUNT: 2,

  // Crop Mapping (Normalization List)
  CROP_LIST: [
    'Rice', 'Wheat', 'Tomato', 'Onion', 'Potato', 'Cotton', 'Maize', 'Soybean',
    'Sugarcane', 'Groundnut', 'Turmeric', 'Chilli', 'Banana', 'Mango', 'Sorghum'
  ]
};
