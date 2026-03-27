# 🌾 Kisan AI Shield

![Kisan AI Shield Banner](https://via.placeholder.com/1200x400/2E7D32/FFFFFF?text=Kisan+AI+Shield+-+Empowering+Farmers+with+AI)

**Kisan AI Shield** is a production-grade, offline-first, multilingual agricultural intelligence platform. Built with a React Native frontend and a Flask AI backend, it equips farmers with cutting-edge tools to maximize yield, minimize crop loss, and navigate market dynamics effortlessly.

## ✨ Core Features

*   **🔬 Computer Vision Disease Scanner:** Real-time crop disease detection powered by a highly optimized TensorFlow model (EfficientNet-B0 / MobileNetV2 architecture).
*   **🤖 Multilingual Voice Assistant (Ask AI):** Conversational agricultural intelligence available in English, Hindi, and Telugu. Understands natural language and voice queries via OpenRouter's `stepfun/step-3.5-flash:free` LLM.
*   **🌦 Micro-climate & Irrigation Engine:** Hyper-local weather forecasting with predictive irrigation scheduling and extreme weather alerts.
*   **📈 Dynamic Mandi Prices:** Live, AI-aggregated market prices for various crops to ensure farmers get the best rates.
*   **🏛 Government Scheme Finder:** Matches farmers with relevant federal and state agricultural subsidies and grants.

## 🚀 Technical Architecture

The platform operates on a robust, decoupled client-server architecture:

### Frontend (User App)
*   **Framework:** React Native / Expo
*   **Navigation:** Expo Router (`expo-router`)
*   **Styling:** Custom Design System (`appTheme.js`) with responsive micro-animations, multi-level shadows, and dynamic spacing.
*   **Typography:** Google Fonts (Inter & Poppins) dynamically loaded for native-feel readability.
*   **State & Persistence:** React Context API (Language/Theming) and `AsyncStorage` for local persistence (My Crops, Scan History, Chat Logs).
*   **Localization:** Built-in localization engine supporting EN, HI, and TE without requiring app reloads.

### Backend (AI Services)
*   **Framework:** Python Flask
*   **AI Orchestration:** Centralized `KisanAIPipeline` facade pattern routing requests to specialized sub-engines.
*   **Vision Engine:** TensorFlow/Keras-based image classification for plant disease diagnosis.
*   **Language Engine:** `deep-translator` library with robust fallback mechanisms for seamless EN/HI/TE translation.
*   **External APIs:** 
    *   OpenWeatherMap (Meteorology data)
    *   OpenRouter (LLM reasoning and dynamic data aggregation)

## 🛠 Prerequisites & Installation

### 1. Backend Setup
```bash
cd ai-backend
python -m venv ai_env
ai_env\Scripts\activate  # On Windows
pip install -r requirements.txt
python app.py
```

### 2. Frontend Setup
```bash
# In the project root (kisan-ai-shield)
npm install
# Set up environment variables (API keys, Backend IP)
npx expo start
```
*Note: Ensure the frontend `apiConfig.js` points to your active backend IP address (`10.0.2.2` for Android Emulators, `localhost` for iOS/Web, or your local network IP for physical devices).*

## 🎨 Design Philosophy
The UI was meticulously crafted to ensure high readability and ease-of-use for farmers outdoors:
*   **Sunlight Readability:** High-contrast text (`COLORS.gray800` on light backgrounds), large touch targets (min 38pt), and +1pt base font sizes.
*   **Micro-interactions:** Spring animations on press, animated AI typing indicators, and smooth fade-ins create a premium, responsive feel.
*   **Data Density:** Information is packed efficiently using horizontal scroll views, visual hierarchy (bold headings), and subtle section dividers.

## 🔒 Security & Reliability
*   **Graceful Degradation:** The UI handles backend timeouts gracefully without crashing.
*   **Data Privacy:** All personal data, crop configurations, and chat history are stored exclusively on the device using `AsyncStorage`.
*   **Strict Typing:** API responses are strictly parsed into JSON objects (replacing fragile string parsing) to prevent frontend crashes.

---
*Built with ❤️ for the future of agriculture.*
