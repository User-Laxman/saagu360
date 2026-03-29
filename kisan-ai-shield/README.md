# 🌾 Kisan AI Shield

![Kisan AI Shield Banner](https://img.shields.io/badge/Status-Production%20Ready-success) ![React Native](https://img.shields.io/badge/React_Native-Expo-blue) ![Python](https://img.shields.io/badge/Backend-Flask-yellow) ![Firebase](https://img.shields.io/badge/Database-Firebase-orange) ![AI](https://img.shields.io/badge/AI-OpenRouter%20%7C%20Gemini-purple)

**Kisan AI Shield** is a state-of-the-art agricultural intelligence platform designed to empower farmers with real-time, AI-driven insights. By combining a highly responsive React Native mobile frontend with a powerful Python Flask AI engine and robust Firebase cloud persistence, the platform delivers critical farming data across connectivity constraints.

---

## ✨ Key Features & Architecture

### 1. 🔍 Crop Disease Recognition (Vision AI)
- **Engine:** HuggingFace Vision Models + OpenRouter LLM through a Flask backend.
- **Functionality:** Farmers upload or snap photos of affected crops. The system classifies the disease, calculates confidence scores (e.g., 94%), assesses severity, and prescribes actionable, organic recommendations.
- **Persistence:** Scan results are permanently archived in **Firestore** (`disease_logs`) for historical tracking.

### 2. 📈 Real-Time Mandi Prices (APMC)
- **Engine:** Direct integration with `data.gov.in` Government APIs.
- **Functionality:** Live tracking of daily market prices across multiple mandis (e.g., Khammam, Warangal). Normalizes data across 30+ major crops.
- **5-Tier Fallback System (Unmatched Reliability):**
  1. **Firestore Cache** (< 30 min old) → Instant load, saves API calls.
  2. **Live APMC API** → Fetches raw data from the government portal.
  3. **Stale Cache** → Displays older data with a UI warning if offline.
  4. **AI Fallback (Flask)** → Uses LLMs to estimate current market dynamics.
  5. **Offline Static Payload** → Hardcoded fallback ensuring the screen never breaks.

### 3. 💧 Smart Agronomy & Irrigation Advice
- **Engine:** OpenWeatherMap API + Custom 5-Tier Logic Engine.
- **Functionality:** Fetches hyper-local weather metrics (Temp, Humidity, Wind Speed, UV) and derives a *Rain Probability* percentage from OWM condition codes.
- **Actionable AI:** The `irrigationService` cross-references these variables to generate actionable advice (e.g., "Heavy Watering" vs. "Halt Sprinklers due to high wind").
- **Persistence:** Daily weather snapshots are stored in Firestore for seasonal analytics.

### 4. 🏛️ Government Scheme Eligibility (AI Wizard)
- **Engine:** Gemini AI (1.5 Flash) + `MASTER_SCHEMES` Database.
- **Functionality:** A curated database of 8+ major Indian agricultural schemes (PM-KISAN, Rythu Bandhu, etc.).
- **Smart Matrix:** Users fill out a 4-step wizard with their profile (Land acreage, Caste, State, Crop). Gemini AI analyzes the profile against official scheme requirements, generating an *Eligibility Score (0-100)*.
- **Actionable UI:** Visually highlights matched criteria (✅) and missing requirements (❌) along with the time to apply and nearest office.

### 5. 🌍 Multi-Lingual Core (i18n)
- **Engine:** Deep `LanguageContext` + Flask `/translate` API.
- **Functionality:** Real-time localization in **English, Hindi, and Telugu**. The entire App UI, AI responses, and dynamic data are seamlessly translated, overcoming regional language barriers.

---

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **Framework:** React Native (Expo)
- **State/Caching:** Context API, `@tanstack/react-query`
- **Storage:** AsyncStorage (Offline Fallback)
- **Styling:** Custom Design Token System (`COLORS`, `FONTS`, `SHADOW`, aliases)

### Backend (AI Pipeline)
- **Server:** Python (Flask, Waitress)
- **AI/ML Integration:** OpenRouter (`stepfun/step-3.5-flash`), Google Gemini API (`@google/generative-ai`)
- **Audio Processing:** AssemblyAI / SpeechRecognition integration.

### Infrastructure & APIs
- **Database:** Firebase / Firestore (NoSQL Cloud Database)
- **Authentication:** Firebase Auth
- **Government Data:** `data.gov.in` (Mandi & Scheme details)
- **Weather:** OpenWeatherMap API

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Expo CLI
- API Keys: Firebase, Gemini API, OpenRouter, OpenWeather, Data.gov.in.

### 1. Frontend Setup
Navigate to the mobile app directory:
```bash
git clone <repository-url>
cd <repository-directory>
```

Install dependencies:
```bash
npm install
```

Configure Environment Variables (`.env` file in the root):
```env
# Backend & General
AI_API_KEY="your_openrouter_or_flask_key"
EXPO_PUBLIC_WEATHER_KEY="your_openweathermap_key"

# Firebase Config
EXPO_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your_firebase_project_id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
EXPO_PUBLIC_FIREBASE_APP_ID="your_app_id"

# AI & Govt APIs
EXPO_PUBLIC_GEMINI_API_KEY="your_google_gemini_key"
EXPO_PUBLIC_DATA_GOV_API_KEY="your_data_gov_in_key"
EXPO_PUBLIC_MARKET_API_URL="https://api.data.gov.in/resource/...format=json"
EXPO_PUBLIC_SCHEMES_API_URL="https://api.data.gov.in/resource/...format=json"
```

Start the application:
```bash
npx expo start --clear
```

### 2. Backend Setup
Navigate to the `backend` directory (assumed Flask folder):
```bash
# Set up virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py
```
*Note: Ensure your Windows Firewall or network configurations allow the React Native app (typically running on your phone or emulator) to communicate with your localhost Flask backend on port 5000.*

---

## 🏗️ Project Structure & Design Patterns

The codebase adheres strictly to enterprise-grade React Native patterns:

- `/services` - A highly decoupled network and business logic layer. Implements the multi-tiered offline/online fallback mechanisms.
- `/components` - Reusable UI widgets and complex functional modals (e.g., `EligibilityModal.js`).
- `/screens` - View controllers bound to Context and Tanstack Query, maintaining a thin-UI paradigm.
- `/constants` - A unified `appTheme.js` handling all padding (`SPACING`), border-radii (`RADIUS`), hex colors (`COLORS`), and typography aliases ensuring rapid and consistent UI iteration.
- `/firebase` - Isolated Cloud logic containing single-responsibility helper functions (`helpers.js` for `saveDiseaseLog`, `saveWeatherLog`, etc.)

---

## 🔒 Security & Performance Considerations

- **Secret Management:** API keys are never hardcoded. Handled via `app.config.js` securely piping `.env` variables into `Constants.expoConfig.extra`. Deep backend APIs (like the OpenRouter integration) remain hidden on the Python server.
- **Graceful Degradation:** Native `AsyncStorage` acts as a safety net. If Firebase is unreachable or the user loses cellular service in a rural farm, the app utilizes localized caches preventing white-screens of death.
- **Optimized Caching:** Mandi data writes to Firestore with specific timestamp expiry logic to heavily restrict expensive API outbound hits to `data.gov.in`.

---

## 👨‍💻 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
*Built with ❤️ for the farming community.*
