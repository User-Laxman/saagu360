# 🌾 Kisan AI Shield — Team Task Contracts
> **Version:** 25-Mar-2026 | **Lead:** Member A (Laxman)
> Each section defines exactly what the **Backend must output** and what the **Frontend must consume**.  
> Use the exact function names and object shapes listed here — do NOT rename them.

---

## 🗺️ Architecture Overview

```
Hardware / APIs
      │
      ▼
services/          ← Member C writes ALL functions here
      │  returns typed objects
      ▼
screens/           ← Member D builds UI here, imports from services/
      │  user taps navigate()
      ▼
app/(tabs)/        ← Member A wires navigation & integration
```

---

## 🌦️ Feature 1 — Weather Forecast + Irrigation Advice

### 🟠 Member C — Backend (`services/weatherService.js`)

**Existing function (DO NOT CHANGE signature):**
```js
export const fetchWeatherData = async (lat, lon, fallbackCity = "Hyderabad")
```
**Currently returns (already working ✅):**
```js
{
  temp: number,          // e.g. 28
  feelsLike: number,     // e.g. 30
  rain: number,          // 0–100 (%), derived from condition codes
  humidity: number,      // e.g. 65
  windSpeed: number,     // m/s
  description: string,   // e.g. "partly cloudy"
  city: string,          // e.g. "Hyderabad"
  fetchedAt: string,     // ISO timestamp
  source: "live" | "fallback"
}
```

**🆕 ADD this new function:**
```js
export const fetchWeatherForecast = async (lat, lon, fallbackCity = "Hyderabad")
```
**Must return:**
```js
{
  city: string,
  forecast: [            // exactly 5 items (next 5 days)
    {
      date: string,        // e.g. "Wed, 26 Mar"
      tempMin: number,
      tempMax: number,
      rain: number,        // 0–100 %
      description: string, // e.g. "light rain"
      irrigationAdvice: "Safe to Irrigate" | "Delay Irrigation" | "Skip — Heavy Rain"
    }
    // ...×5
  ],
  source: "live" | "fallback"
}
```
> **Logic:** `rain > 70` → `"Skip — Heavy Rain"`, `rain > 40` → `"Delay Irrigation"`, else → `"Safe to Irrigate"`
> **API:** `https://api.openweathermap.org/data/2.5/forecast?lat=&lon=&appid=&units=metric&cnt=40`

---

### 🟡 Member D — Frontend (`screens/WeatherScreen.tsx`)

**Import:**
```ts
import { fetchWeatherData, fetchWeatherForecast } from '../services/weatherService';
```

**Call on mount:**
```ts
const today    = await fetchWeatherData(lat, lon, city);   // current weather
const forecast = await fetchWeatherForecast(lat, lon, city); // 5-day
```

**UI to build:**
| Section | Data field to use |
|---|---|
| Header pill (temp + city) | `today.temp`, `today.city`, `today.description` |
| Humidity & wind row | `today.humidity`, `today.windSpeed` |
| Irrigation alert banner | `today.rain` → if >50 show red warning, else green |
| Forecast cards (horizontal scroll, 5 cards) | `forecast.forecast[i].date`, `.tempMax`, `.rain`, `.irrigationAdvice` |

---

## 📈 Feature 2 — Real-Time Mandi Prices

### 🟠 Member C — Backend (`services/marketService.js`)

**Existing function (UPDATE to use real API):**
```js
export const fetchMarketPrices = async ()
```
**Must return (shape UNCHANGED — only `source` and data changes):**
```js
{
  market: string,          // e.g. "APMC Hyderabad"
  lastUpdated: string,     // ISO timestamp
  source: "live" | "mock" | "error",
  crops: [
    {
      name: string,         // e.g. "Rice"
      currentPrice: number, // ₹ per quintal
      basePrice: number,
      unit: "₹/quintal",
      trend: "up" | "down" | "stable",
      changePercent: number // e.g. 2.4
    }
    // ...
  ]
}
```
> **Real API option:** `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`  
> Keep mock fallback if API key is unavailable or call fails.

---

### 🟡 Member D — Frontend (`screens/MarketScreen.tsx`)

**Import:**
```ts
import { fetchMarketPrices } from '../services/marketService';
```

**Call on mount:**
```ts
const data = await fetchMarketPrices();
// data.crops → array of crop objects
// data.lastUpdated → show as "Last updated: HH:MM"
// data.source → show "LIVE" badge if "live", "MOCK" if "mock"
```

**UI to build:**
| Section | Data field to use |
|---|---|
| "Last updated" header | `data.lastUpdated` |
| Source badge | `data.source` → "LIVE" (orange) or "MOCK" (grey) |
| Crop list rows | `crop.name`, `crop.currentPrice`, `crop.unit` |
| Trend indicator | `crop.trend` → ▲ green / ▼ red / — grey |
| Change % | `crop.changePercent` |

---

## 🏛️ Feature 3 — Govt. Schemes Eligibility (Gemini AI)

### 🟠 Member C — Backend (`services/schemeService.js`)

**Existing functions (keep as-is for listing):**
```js
export const fetchAllSchemes = async ()   // Returns all schemes from Firestore
export const saveSchemes    = async ()    // Saves mock schemes to Firestore
```

**🆕 ADD this new function:**
```js
export const checkSchemeEligibility = async (farmerProfile)
```

**Input `farmerProfile` object:**
```js
{
  landAcres: number,      // e.g. 2.5
  annualIncome: number,   // e.g. 80000 (in ₹)
  category: "General" | "OBC" | "SC" | "ST",
  state: string,          // e.g. "Telangana"
  cropTypes: string[],    // e.g. ["Rice", "Wheat"]
  hasBankAccount: boolean,
  hasAadhaar: boolean
}
```

**Must return:**
```js
{
  eligible: [
    { scheme: string, benefit: string, reason: string }
    // e.g. { scheme: "PM-KISAN", benefit: "₹6000/year", reason: "Land < 2 hectares" }
  ],
  ineligible: [
    { scheme: string, reason: string }
  ],
  source: "gemini" | "rules" | "error"
}
```

> **Implementation:** Call Gemini API (`generativelanguage.googleapis.com`) with strict JSON-mode prompt.  
> Key → `process.env.EXPO_PUBLIC_GEMINI_KEY`  
> Fallback: use hard-coded rule-based logic if Gemini fails.

---

### 🟡 Member D — Frontend (`screens/SchemesScreen.tsx`)

**Import:**
```ts
import { checkSchemeEligibility, fetchAllSchemes } from '../services/schemeService';
```

**UI Flow:**
1. On load → call `fetchAllSchemes()` → show list of all available schemes
2. User fills form → on Submit → call `checkSchemeEligibility(farmerProfile)`
3. Show result cards

**Form fields to collect:**
```
Land Holding (acres)    → number input
Annual Income (₹)       → number input
Category                → picker: General / OBC / SC / ST
State                   → text input or picker
Crops Grown             → multi-select chips: Rice, Wheat, Cotton…
Bank Account?           → toggle
Aadhaar Linked?         → toggle
```

**Result UI:**
| Section | Data field to use |
|---|---|
| Eligible schemes | `result.eligible[i].scheme`, `.benefit`, `.reason` → green card ✅ |
| Ineligible schemes | `result.ineligible[i].scheme`, `.reason` → grey card ❌ |
| Source tag | `result.source` → "Powered by Gemini AI" or "Rule-based" |

---

## 🔬 Feature 4 — Leaf Disease Detection (AI/ML)

### 🔴 Member B — ML (`models/inferenceEngine.js`)

**🆕 CREATE this file and export this function:**
```js
export const detectDisease = async (imageUri)
```

**Input:**
```js
imageUri: string  // local file path from expo-camera, e.g. "file:///data/..."
```

**Must return:**
```js
{
  disease: string,       // e.g. "Rice Leaf Blight"
  confidence: number,    // 0.0 – 1.0, e.g. 0.87
  remedy: string,        // e.g. "Apply copper-based fungicide. Remove infected leaves."
  cropType: string,      // e.g. "Rice"
  isHealthy: boolean     // true if no disease found
}
```

> **Model file:** `assets/models/disease_model.tflite`  
> **Library to use:** `expo-task-manager` + `react-native-fast-tflite`  
> Fallback: if model fails, return `{ disease: "Unknown", confidence: 0, remedy: "Consult an agronomist", isHealthy: false }`

**Also save completed scan to Firestore using the existing function:**
```js
import { saveDiseaseScan } from '../services/diseaseService';
// saveDiseaseScan({ cropName, diseaseName, confidence, solution })
```

---

### 🟡 Member D — Frontend (`screens/DiseaseScreen.tsx`)

**Import:**
```ts
import { detectDisease } from '../models/inferenceEngine';
import { saveDiseaseScan, fetchLastScans } from '../services/diseaseService';
```

**UI Flow:**
1. Show camera preview using `expo-camera`
2. User taps **Capture** → photo saved to `imageUri`
3. Call `detectDisease(imageUri)` → show loading spinner
4. Show result card
5. Call `saveDiseaseScan(...)` → save to history
6. Show last 3 scans from `fetchLastScans()`

**Result card UI:**
| Section | Data field to use |
|---|---|
| Disease name | `result.disease` |
| Confidence bar | `result.confidence * 100` → e.g. "87% confident" |
| Healthy indicator | `result.isHealthy` → show ✅ "Crop looks healthy!" |
| Remedy text | `result.remedy` |
| Crop detected | `result.cropType` |

---

## 👑 Member A — Integration Checklist

After C and D deliver their branches:

- [ ] Add `EXPO_PUBLIC_GEMINI_KEY` to `.env`
- [ ] Wire `fetchWeatherForecast` in `WeatherScreen`
- [ ] Wire `fetchMarketPrices` (live) in `MarketScreen`
- [ ] Wire `checkSchemeEligibility` form submit in `SchemesScreen`  
- [ ] Install `expo-camera` → wire capture to `detectDisease` in `DiseaseScreen`
- [ ] Final QA on physical Android device
- [ ] Update `README.md` before demo

---

## 🔑 Environment Variables (`.env`)

```env
EXPO_PUBLIC_WEATHER_KEY=<your_openweathermap_key>
EXPO_PUBLIC_GEMINI_KEY=<your_google_gemini_key>
EXPO_PUBLIC_AGMARKET_KEY=<data.gov.in_key_optional>
```

---

## 📦 Branch & PR Rules

```
feature/weather-forecast    → Member C
feature/mandi-live-api      → Member C
feature/scheme-eligibility  → Member C + D
feature/disease-ml          → Member B
feature/disease-screen      → Member D
```
> PR → reviewed by **Member A** → merged to `main`.  
> **Never push directly to `main`.**
