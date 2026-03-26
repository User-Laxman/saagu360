<p align="center">
  <img src="https://img.shields.io/badge/🌾_Kisan_AI_Shield-v2.0-2e7d32?style=for-the-badge&labelColor=1b5e20" />
  <img src="https://img.shields.io/badge/Platform-Android_%7C_iOS-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI_Backend-Flask_%7C_PyTorch_%7C_OpenRouter-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Language-Python_%7C_JavaScript-yellow?style=for-the-badge" />
</p>

# 🌾 Kisan AI Shield — Intelligent Crop Protection System

> **An AI-powered mobile application for Indian farmers** that provides real-time crop disease detection, multilingual AI advisory, live weather intelligence, dynamic market pricing, and government scheme discovery — all powered by a custom-built Machine Learning pipeline.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    📱 MOBILE CLIENT (Expo / React Native)       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ │
│  │  Home    │ │  Ask AI  │ │ Disease  │ │Weather │ │ Mandi  │ │
│  │Dashboard │ │ Chatbot  │ │  Scanner │ │& Irrig.│ │ Prices │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └───┬────┘ │
│       │             │            │            │          │      │
│  ┌────┴─────────────┴────────────┴────────────┴──────────┴────┐ │
│  │              Axios Service Layer (REST API)                │ │
│  │   aiService │ diseaseService │ weatherService │ mandiService│ │
│  └────────────────────────┬───────────────────────────────────┘ │
│                           │ HTTP (JSON / FormData)              │
│  ┌────────────────────────┴───────────────────────────────────┐ │
│  │         🌐 LanguageContext (Global i18n: EN/HI/TE)         │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │  Flask Server │
                    │  (Port 5000)  │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│ 🔬 Disease    │  │ 🧠 Advisory    │  │ 🌦️ Weather     │
│ Vision Engine │  │ LLM Engine     │  │ Proxy (OWM)    │
│ (PyTorch CNN) │  │ (OpenRouter)   │  │                │
└───────────────┘  └────────────────┘  └────────────────┘
```

---

## 🤖 Machine Learning & AI Pipeline

> **Engineered by:** AI & Machine Learning Engineer

### 🔬 Disease Vision Engine (`disease_vision_engine.py`)

| Component | Detail |
|---|---|
| **Architecture** | Custom CNN built on PyTorch |
| **Hardware Acceleration** | NVIDIA CUDA GPU-mapped inference |
| **Input** | Raw crop leaf images captured via mobile camera |
| **Output** | Disease classification + confidence score |
| **Training Script** | `train_vision_model.py` — Full training loop with data augmentation, learning rate scheduling, and checkpointing |
| **Model Persistence** | `torch.save()` / `torch.load()` with `map_location` for cross-device portability |

**Key ML Engineering Decisions:**
- Migrated from TensorFlow to **PyTorch** for native Windows CUDA support
- Implemented `weights_only=False` loading for backward compatibility with legacy checkpoints
- Designed the inference pipeline to accept raw byte streams from mobile uploads and process them end-to-end

### 🧠 Advisory LLM Engine (`advisory_llm_engine.py`)

| Component | Detail |
|---|---|
| **Model** | `stepfun/step-3.5-flash:free` via OpenRouter API |
| **Architecture** | RAG-style prompt engineering with domain-specific agricultural context |
| **Capabilities** | Conversational Q&A, disease explanation, irrigation scheduling, crop lifecycle advice |
| **Multilingual** | Dynamic language injection — responses generated natively in English, Hindi, or Telugu |

**Key AI Engineering Decisions:**
- Engineered structured JSON prompts that force the LLM to return machine-parseable responses for the Schemes and Mandi features
- Built regex-based JSON extraction (`re.search(r'\{.*\}')`) to safely parse LLM output even when wrapped in markdown
- Implemented graceful fallback architecture — if LLM times out, the system degrades to cached data without user disruption

### 🎙️ Speech & Language Engine (`speech_language_engine.py`)

| Component | Detail |
|---|---|
| **Speech-to-Text** | Audio file processing pipeline with secure temp-file management |
| **Text-to-Speech** | Expo Speech API with language-code awareness |
| **Languages** | English (`en`), Hindi (`hi`), Telugu (`te`) |

### 📊 AI Pipeline Facade (`ai_pipeline.py`)

A **unified orchestration layer** that initializes all ML models and AI engines at server startup:
- Loads the PyTorch disease model onto GPU/CPU
- Initializes the OpenRouter LLM context
- Exposes clean facade methods: `process_plant_image()`, `process_advisory_chat()`, `process_voice_chat()`

### 🧪 Testing & Validation Suite (`testing/`)

| Script | Purpose |
|---|---|
| `test_pipeline.py` | End-to-end integration test for all AI pipeline components |
| `laptop_vision_test.py` | Local webcam-based disease detection test |
| `visual_accuracy_test.py` | Matplotlib-rendered confusion matrix and accuracy visualization |

---

## 📱 Application Features

### 🏠 Smart Dashboard (HomeScreen)
- **Live Weather Pill** — Real-time temperature, humidity, and conditions from OpenWeatherMap API via GPS coordinates
- **Dynamic Farm Alerts** — Context-aware alerts generated from live weather (Rain → delay irrigation, Heat → early watering, Frost → monitor crops)
- **Crop Portfolio** — Quick-access crop chips for personalized farm management
- **Quick Action Grid** — One-tap access to Disease Scanner, Weather, Market Prices, and Schemes

### 🔬 AI Disease Scanner (DiseaseScreen)
- Camera-based crop leaf photography
- Real-time PyTorch CNN inference on the backend
- Multilingual disease diagnosis with treatment recommendations
- Confidence scoring for prediction reliability

### 💬 AI Agricultural Advisor (AIScreen)
- Full conversational chatbot interface with message bubbles
- Powered by OpenRouter LLM with agricultural domain expertise
- Text-to-Speech capability for hands-free farming advice
- Multilingual responses based on selected language

### 🌦️ Weather & Irrigation Intelligence (WeatherScreen)
- **GPS-Powered Location Tracking** — `expo-location` captures exact farm coordinates
- **5-Day Forecast Carousel** — Parsed from OpenWeatherMap 3-hour interval data
- **AI Irrigation Engine** — Dynamically calculates watering recommendations based on temperature, humidity, and precipitation
- **Temperature Trend Chart** — Visual bar chart showing 5-day temperature patterns
- **Manual Refresh** — One-tap GPS re-sync for updated forecasts

### 📈 Dynamic Mandi Prices (MarketScreen)
- **Two-Phase Loading Architecture:**
  - Phase 1: Instant local data (zero network latency)
  - Phase 2: Background AI upgrade with LLM-generated market analysis
- **Multi-Mandi Support** — Tap to switch between Khammam, Hyderabad, Warangal, and more
- **AI Sell Signals** — LLM-generated trading recommendations
- **Searchable Crop Table** — Filter crops with real-time search

### 🏛️ Government Scheme Discovery (SchemesScreen)
- Farmer profile form (name, state, land, crop, category, irrigation)
- LLM-powered scheme matching — finds the top 5 most relevant Indian agricultural schemes
- Structured JSON response parsing for clean UI rendering

### 🌐 Global Multilingual System
- **Languages:** English 🇬🇧 | हिंदी 🇮🇳 | తెలుగు 🇮🇳
- **Floating Language Selector** — Accessible from every screen
- **Full UI Translation** — All labels, buttons, and headers localize instantly
- **AI Response Translation** — Backend LLM receives language code and responds natively

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile Framework** | React Native + Expo SDK 54 |
| **Navigation** | Expo Router (File-based) |
| **State Management** | React Context API |
| **Network** | Axios with timeout guards |
| **Backend** | Python Flask + Flask-CORS |
| **ML Framework** | PyTorch (CUDA-accelerated) |
| **LLM Provider** | OpenRouter API (`stepfun/step-3.5-flash:free`) |
| **Weather API** | OpenWeatherMap (Current + Forecast) |
| **Location** | Expo Location (GPS) |
| **Speech** | Expo Speech (TTS) |
| **Styling** | Custom Design System (`appTheme.js` + `sharedStyles.js`) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- NVIDIA GPU with CUDA (recommended for ML inference)
- Expo Go app on Android/iOS

### 1. Clone & Install Frontend
```bash
git clone https://github.com/your-repo/kisan-ai-shield.git
cd kisan-ai-shield
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the project root:
```env
AI_API_KEY=your_openrouter_api_key
EXPO_PUBLIC_WEATHER_KEY=your_openweathermap_api_key
```

### 3. Set Up AI Backend
```bash
cd ai-backend
python -m venv ai_env
ai_env\Scripts\activate       # Windows
pip install flask flask-cors torch torchvision python-dotenv requests openai
```

### 4. Start the Backend Server
```bash
cd ai-backend
python app.py
# Server starts on http://0.0.0.0:5000
```

### 5. Start the Mobile App
```bash
npx expo start -c
# Scan QR code with Expo Go
```

> **Note:** Update `BASE_URL` in all service files (`services/*.js`) to match your machine's local IP address.

---

## 📁 Project Structure

```
kisan-ai-shield/
├── ai-backend/
│   ├── app.py                    # Flask API server (5 endpoints)
│   ├── ai_pipeline.py            # ML/AI orchestration facade
│   ├── train_vision_model.py     # PyTorch CNN training script
│   ├── features/
│   │   ├── disease_vision_engine.py   # 🔬 PyTorch CNN inference
│   │   ├── advisory_llm_engine.py     # 🧠 OpenRouter LLM integration
│   │   ├── speech_language_engine.py  # 🎙️ Multilingual speech
│   │   ├── weather_advisory.py        # 🌦️ Weather-based recommendations
│   │   ├── market_prices.py           # 📈 Market data processing
│   │   ├── gov_schemes.py             # 🏛️ Scheme matching logic
│   │   └── crop_lifecycle.py          # 🌱 Crop stage tracking
│   └── testing/
│       ├── test_pipeline.py           # Integration tests
│       ├── laptop_vision_test.py      # Local webcam test
│       └── visual_accuracy_test.py    # Accuracy visualization
├── screens/
│   ├── HomeScreen.js             # Dashboard with live weather
│   ├── AIScreen.js               # Chatbot interface
│   ├── DiseaseScreen.js          # Camera disease scanner
│   ├── WeatherScreen.js          # Weather & irrigation
│   ├── MarketScreen.js           # Dynamic mandi prices
│   └── SchemesScreen.js          # Government schemes
├── services/
│   ├── aiService.js              # AI chatbot network layer
│   ├── diseaseService.js         # Disease prediction network
│   ├── weatherService.js         # Weather + GPS integration
│   ├── mandiService.js           # Market prices (two-phase)
│   └── schemeService.js          # Scheme fetching
├── context/
│   └── LanguageContext.js        # Global i18n provider
├── components/
│   └── LanguageSelector.js       # Floating language FAB
├── constants/
│   ├── appTheme.js               # Design tokens & colors
│   ├── sharedStyles.js           # Reusable style objects
│   └── translations.js           # EN/HI/TE dictionaries
└── app/
    └── (tabs)/
        └── _layout.tsx           # Tab navigation config
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/predict` | Upload crop image → Disease classification (PyTorch CNN) |
| `POST` | `/chat` | Send text + language → AI advisory response (LLM) |
| `POST` | `/voice-chat` | Upload audio → Transcribe + AI response |
| `POST` | `/schemes` | Farmer profile → Top 5 eligible government schemes |
| `GET`  | `/weather` | Lat/Lon → Current weather + 5-day forecast (OWM proxy) |
| `POST` | `/mandi-prices` | Mandi name + language → Dynamic crop market prices |

---

## 📄 License

This project is developed as part of the **Saagu360** agricultural technology initiative.

---

<p align="center">
  <b>Built with 🌾 for Indian Farmers</b><br/>
  <i>AI & Machine Learning Engineering | Full-Stack Mobile Development</i>
</p>
