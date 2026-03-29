import 'dotenv/config';

export default {
  expo: {
    name: 'Kisan AI Shield',
    slug: 'kisan-ai-shield',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'kisanaishield',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.praanai.kisanshield',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1B5E20',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      package: 'com.praanai.kisanshield',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#1B5E20',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow Kisan AI Shield to use your location to fetch accurate local weather conditions.',
        },
      ],
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    // ── All API keys exposed safely via Constants.expoConfig.extra ──
    extra: {
      // Flask backend
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || '',

      // Firebase
      firebaseApiKey:           process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      firebaseAuthDomain:       process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId:        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket:    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId:process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId:            process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',

      // AI Keys
      geminiApiKey:    process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
      openWeatherKey:  process.env.EXPO_PUBLIC_WEATHER_KEY || '',

      // Government Data APIs
      dataGovApiKey:   process.env.EXPO_PUBLIC_DATA_GOV_API_KEY || '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a',
      marketApiUrl:    process.env.EXPO_PUBLIC_MARKET_API_URL   || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070',
      schemesApiUrl:   process.env.EXPO_PUBLIC_SCHEMES_API_URL  || 'https://api.data.gov.in/resource/47a0970a-9fef-427d-8cdd-767085fda87b',
    },
  },
};
