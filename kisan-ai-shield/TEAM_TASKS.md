# 🌾 Kisan AI Shield — Team Task Division

> **Sprint Goal:** Complete all 4 core features for the Hackathon demo.
> **Deadline:** Push all feature branches by event day.

---

## ✅ Completed Work (as of 25 Mar 2026)

| Area | Done by |
|---|---|
| Navigation (5 tabs), Dashboard shell | Member A |
| Weather & Market API services | Member C |
| UI design system (`appTheme.ts`, screens, tab bar) | Member D |
| Interactive Dashboard (live weather + market + design) | Member A + D integrated |

---

## 🔴 Member B — AI/ML Engineer
**Branch:** `AI_ML_Branch`

### Feature: Leaf Disease Detection
- [ ] Export TFLite crop disease model → `assets/models/disease_model.tflite`
- [ ] Write `models/inferenceEngine.js`:
  - Input: image URI (from camera)  
  - Output: `{ disease: string, confidence: number, remedy: string }`
- [ ] Test model locally on at least 3 sample leaf images
- [ ] Push branch — Member A will wire it to the camera UI

> ⚠️ **This is the CRITICAL path. Zero progress exists here. Escalate immediately if blocked.**

---

## 🟠 Member C — Backend/API Engineer
**Branch:** `API-Engineer`

### Feature 1: Real-Time Mandi Prices
- [ ] Upgrade `services/marketService.js` to fetch live data from `data.gov.in` Agmarknet or similar
- [ ] Keep mock JSON fallback if the real API is down
- [ ] Add `lastUpdated` timestamp to the response object

### Feature 2: Govt. Schemes Eligibility (Gemini API)
- [ ] Create `services/schemeService.js`:
  - Input: farmer profile `{ landAcres, annualIncome, caste, state, cropTypes[] }`
  - Call Gemini API with a strict system prompt listing PM-KISAN, PMFBY, KCC scheme rules
  - Output: `{ eligible: string[], ineligible: string[], reasons: string[] }`
- [ ] Store prompt in `constants/schemePrompt.ts` for easy tuning

### Feature 3: Weather Forecast (5-day)
- [ ] Extend `services/weatherService.js` to return `forecast[]` — next 5 days with `{ date, temp, rain, description }`
- [ ] Add irrigation advice rule: rain > 50% → `"Delay"`, else → `"Safe"`

---

## 🟡 Member D — UI/UX Engineer
**Branch:** `UI_Role`

### Feature 1: Weather Screen
- [ ] Update `screens/WeatherScreen.tsx` to consume live data from `weatherService`
- [ ] Show 5-day forecast as horizontal scrollable cards
- [ ] Add a colored irrigation advice banner (green = safe, red = delay)

### Feature 2: Market Screen
- [ ] Update `screens/MarketScreen.tsx` to consume live data from `marketService`
- [ ] Show crop price list with trend arrows ▲▼ and "Last updated" text
- [ ] Add optional search/filter by crop name

### Feature 3: Schemes Screen (Form)
- [ ] Update `screens/SchemesScreen.tsx` with farmer eligibility form:
  - Fields: Land (acres), Annual Income, Category (General/OBC/SC/ST), State, Crop
  - Submit button → loading state → result cards per scheme
- [ ] Show result as `Eligible ✅` / `Not Eligible ❌` cards with reason

### Feature 4: Disease Screen (Camera UI)
- [ ] Update `screens/DiseaseScreen.tsx` with camera preview using `expo-camera`
- [ ] Add a capture button and a result card: disease name, confidence %, remedy text
- [ ] Show placeholder state while Member B's model is pending

---

## 🟢 Member A — Project Lead & Integration
**Branch:** `main`

- [ ] Wire `weatherService` forecast to `WeatherScreen` after Member C delivers
- [ ] Wire `marketService` live data to `MarketScreen` after Member C delivers  
- [ ] Wire `schemeService` (Gemini) to `SchemesScreen` form after Member C delivers
- [ ] Add `EXPO_PUBLIC_GEMINI_KEY` to `.env` + `app.json` plugins
- [ ] Integrate `expo-camera` + Member B's `inferenceEngine.js` into `DiseaseScreen`
- [ ] Final QA pass: run app end-to-end on physical Android device
- [ ] Update `README.md` with final run instructions before demo

---

## 📦 Environment Variables Needed (`.env`)

```env
EXPO_PUBLIC_WEATHER_KEY=<openweathermap_api_key>
EXPO_PUBLIC_GEMINI_KEY=<google_gemini_api_key>
```

---

## 🌿 Git Workflow Reminder

```bash
# Start your feature
git checkout main && git pull origin main
git checkout -b feature/your-task

# When done
git push origin feature/your-task
# → Open PR → Member A reviews & merges into main
```

**Rule: Never push directly to `main`.**
