# 🌾 Kisan AI Shield

An AI-powered mobile application designed to assist farmers with disease detection, advisory responses, and voice interactions.

---

## 👨‍💻 AI Experience Engineer - Implementation Guide

As the **AI Experience Engineer**, your core mission is to bridge the gap between perception, reasoning, and communication. You own the **Python AI backend**, the **AI API integration**, and the **Speech Pipeline**.

The current state is a functional prototype using mock endpoints. The next evolution is to connect and train real AI layers.

---

## 🎯 What You Will Implement (Next Evolution Path)

Below is your immediate roadmap to take this platform from prototype to an intelligent system.

### 1. 🧠 Replace Mock Chatbot with Real LLM API
*   **Current State:** Rule-based/mock JSON replies in `ai-backend/chatbot_model.py`.
*   **To Implement:**
    *   Integrate an LLM API (e.g., Google Gemini, OpenAI).
    *   Design a prompt structure optimized for agricultural advisory.
    *   Update the `/chat` Flask endpoint to handle natural language query routing.

### 2. 📸 Implement Image Upload to Backend
*   **Current State:** `AIScreen.js` captures images, but robust FormData sending to the backend needs wiring.
*   **To Implement:**
    *   Send base64 or multipart form data from React Native using Axios.
    *   Handle the image upload securely in `app.py` (`POST /predict`).

### 3. 🦠 Integrate Real ML Vision Model
*   **Current State:** `ai-backend/disease_model.py` has mock placeholder logic.
*   **To Implement:**
    *   Train or import a Convolutional Neural Network (e.g., PyTorch/TensorFlow, MobileNet) trained on plant leaf diseases (e.g., PlantVillage dataset).
    *   Process incoming images using OpenCV/Pillow, run inference, and return the disease prediction and confidence score.

### 4. 🗣️ Enhance the Speech & UI Pipeline
*   **Current State:** Expo Speech module is active (`utils/speech.js`).
*   **To Implement:**
    *   **Multilingual Support:** Add translation layers in the backend so TTS can read out Hindi/Telugu/Tamil instructions.
    *   **Voice Inputs:** Integrate Speech-to-Text so farmers can ask questions visually and vocally without typing.

### 5. ⚡ Architecture & Latency Optimization
*   **Current State:** Basic API communication pending final connection.
*   **To Implement:**
    *   Optimize end-to-end response times from the LLM.
    *   Implement basic edge-caching for frequent agricultural Q&A.
    *   Provide graceful error handling and timeouts in the frontend (`services/aiService.js`).

---

## 📂 System Architecture Overview

### Frontend (Expo React Native)
Handles User Input, UI Rendering, and Speech Output.
*   `screens/AIScreen.js` - Main Interaction Layer
*   `services/` - `aiService.js` and `diseaseService.js` (API communication)
*   `utils/speech.js` - Text-to-Speech handler

### Backend (Flask & Python)
Handles AI Processing, Model Inference, and API Exposure.
*   `ai-backend/app.py` - Flask Router and API Gateway
*   `ai-backend/chatbot_model.py` - Text and LLM Logic
*   `ai-backend/disease_model.py` - Image processing and Vision Logic

---

## 🚀 Running the Development Environment

### 1. Start the React Native Frontend
```bash
npm install
npx expo start
```

### 2. Start the AI Backend
```bash
cd ai-backend
# Activate your virtual environment (Windows)
ai_env\Scripts\activate
pip install flask flask-cors numpy pillow opencv-python
python app.py
```
*Note: The backend will run on `http://<your-local-ip>:5000`. Ensure your mobile device and backend server are on the same local Wi-Fi network when testing on physical devices.*
