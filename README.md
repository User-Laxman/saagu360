# 🌾 Kisan AI Shield – Hackathon 25/26

Welcome to the **Kisan AI Shield** project! This is our 48-hour hackathon mission to build a Decision Support System for farmers. 

This README is designed for **you**, the team, so we all know exactly what to do, where to code, and how to avoid breaking each other's work.

---

## 🚀 How to Run the App (Locally)
1. **Pull the latest code** from `main`.
2. Open terminal in the `kisan-ai-shield` folder:
   ```bash
   cd kisan-ai-shield
   npm install
   npx expo start
   ```
3. Use the **Expo Go** app on your phone to scan the QR code and test the app.

---

## 👥 Team Roles & Responsibilities
We have 4 distinct roles. Please stick strictly to your responsibilities to avoid massive merge conflicts!

*   **👑 Member A (Project Lead & Integration)**
    *   **Goal:** Build the Navigation (Tabs, Dashboard) and connect everything.
    *   **Rules:** You act as the gatekeeper. Nobody merges into `main` without your approval. You handle routing and taking data from APIs/Models to display it on the UI.
*   **🧠 Member B (AI/ML Engineer)**
    *   **Goal:** Make the camera work and connect the TensorFlow Lite (`.tflite`) disease detection model.
    *   **Rules:** Work inside `assets/models/` and `models/`. Do not touch the UI styles or the database. Make sure the app doesn't crash if an image is blurry!
*   **☁️ Member C (Backend/API Engineer)**
    *   **Goal:** Fetch Weather API data, Market Price API data, and configure Firebase.
    *   **Rules:** Work inside `services/` and `firebase/`. Never commit `.env` files with our actual API keys. Provide mock data (JSON) if the real API fails.
*   **🎨 Member D (UI/UX Engineer)**
    *   **Goal:** Build the buttons, cards, and screens so they look great and are easy for farmers to use.
    *   **Rules:** Work inside `components/`. Use large buttons, minimal text, and clear icons. If a farmer can't understand it in 5 seconds, it needs a redesign.

---

## 📁 Folder Structure (Where do I code?)
We use a Clean Architecture so everyone can work in parallel:

```text
kisan-ai-shield/
├── app/               👉 Member A: Build navigation & main screens here (Expo Router)
├── assets/            👉 Member B: Put your .tflite models here
├── components/        👉 Member D: Put your reusable UI Buttons and Cards here
├── constants/         👉 All: Shared colors, text, and config constants
├── firebase/          👉 Member C: Firebase setup goes here
├── models/            👉 Member B: ML inference logic goes here
├── services/          👉 Member C: API fetching (Axios) goes here
├── utils/             👉 All: Helper math or formatting functions
└── .gitignore         👉 NEVER touch this unless you know what you're doing
```

---

## 🌿 GitHub Rules (CRITICAL)

**Rule #1:** NEVER PUSH DIRECTLY TO `main`! 
**Rule #2:** Never work on the same file as someone else!

### Our Daily Workflow:
1. Every morning (or when starting a session):
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create your own feature branch:
   ```bash
   git checkout -b feature/your-task-name
   ```
   *(e.g., `feature/market-api` or `feature/ui-buttons`)*
3. Write your code, then commit:
   ```bash
   git add .
   git commit -m "feat: added weather api service"
   ```
4. Push your branch to GitHub and create a **Pull Request (PR)**.
5. Get **Member A** to review and merge your PR. Once merged, delete your branch and go back to step 1!

---

**Let's build something amazing! Good luck team!** 🚀
