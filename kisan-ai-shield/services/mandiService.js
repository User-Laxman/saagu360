/**
 * services/mandiService.js
 * Production-grade Mandi (APMC) market price service.
 *
 * Data flow:
 * 1. Firestore cache (30-min TTL) — zero latency
 * 2. Live data.gov.in APMC API — real government data
 * 3. AI-generated fallback (OpenRouter) — if both fail
 * 4. Hardcoded fallback — absolute last resort
 */
import axios from 'axios';
import { db } from '../firebase/config';
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, getDocs,
} from 'firebase/firestore';
import { BASE_URL } from './apiConfig';

// ── Configuration ─────────────────────────────────────────────────
const MARKET_API_URL = process.env.EXPO_PUBLIC_MARKET_API_URL
  || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const DATA_GOV_KEY = process.env.EXPO_PUBLIC_DATA_GOV_API_KEY
  || '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a';
const CACHE_MS = 30 * 60 * 1000; // 30 minutes
const QUINTAL_TO_KG = 100;

// ── Crop name normalization map (EN + Hindi aliases) ──────────────
const CROP_NAME_MAP = {
  'rice': 'Rice', 'paddy': 'Rice', 'dhan': 'Rice',
  'wheat': 'Wheat', 'gehun': 'Wheat',
  'tomato': 'Tomato', 'tamatar': 'Tomato',
  'onion': 'Onion', 'pyaz': 'Onion',
  'potato': 'Potato', 'aloo': 'Potato',
  'cotton': 'Cotton', 'kapas': 'Cotton',
  'maize': 'Maize', 'corn': 'Maize', 'makka': 'Maize',
  'soybean': 'Soybean', 'soya bean': 'Soybean',
  'sugarcane': 'Sugarcane', 'ganna': 'Sugarcane',
  'groundnut': 'Groundnut', 'peanut': 'Groundnut', 'moongfali': 'Groundnut',
  'turmeric': 'Turmeric', 'haldi': 'Turmeric',
  'chilli': 'Chilli', 'red chilli': 'Chilli', 'mirch': 'Chilli',
  'banana': 'Banana', 'kela': 'Banana',
  'mango': 'Mango', 'aam': 'Mango',
  'sorghum': 'Sorghum', 'jowar': 'Sorghum',
  'chickpea': 'Chickpea', 'chana': 'Chickpea',
  'pigeonpea': 'Pigeonpea', 'arhar': 'Pigeonpea', 'tur': 'Pigeonpea',
};

// ── Absolute last-resort hardcoded fallback ───────────────────────
const HARDCODED_FALLBACK = [
  { id: 'rice', displayName: 'Rice', emoji: '🌾', modalPricePerKg: 22, minPricePerKg: 20, maxPricePerKg: 24, modalPricePerQuintal: 2200, trend: 'Stable', changePercent: '0%', changeAmountPerKg: 0, topMarket: 'Khammam', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'wheat', displayName: 'Wheat', emoji: '🌾', modalPricePerKg: 21.5, minPricePerKg: 19, maxPricePerKg: 23, modalPricePerQuintal: 2150, trend: 'Up', changePercent: '+2.4%', changeAmountPerKg: 0.5, topMarket: 'Warangal', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'tomato', displayName: 'Tomato', emoji: '🍅', modalPricePerKg: 34, minPricePerKg: 28, maxPricePerKg: 40, modalPricePerQuintal: 3400, trend: 'Up', changePercent: '+5.2%', changeAmountPerKg: 1.7, topMarket: 'Khammam', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'onion', displayName: 'Onion', emoji: '🧅', modalPricePerKg: 16.5, minPricePerKg: 14, maxPricePerKg: 19, modalPricePerQuintal: 1650, trend: 'Down', changePercent: '-1.3%', changeAmountPerKg: -0.22, topMarket: 'Hyderabad', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'chilli', displayName: 'Chilli', emoji: '🫑', modalPricePerKg: 92, minPricePerKg: 80, maxPricePerKg: 105, modalPricePerQuintal: 9200, trend: 'Up', changePercent: '+3.7%', changeAmountPerKg: 3.3, topMarket: 'Khammam', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'maize', displayName: 'Maize', emoji: '🌽', modalPricePerKg: 18.2, minPricePerKg: 16, maxPricePerKg: 21, modalPricePerQuintal: 1820, trend: 'Down', changePercent: '-0.8%', changeAmountPerKg: -0.15, topMarket: 'Karimnagar', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'soybean', displayName: 'Soybean', emoji: '🌿', modalPricePerKg: 41, minPricePerKg: 38, maxPricePerKg: 44, modalPricePerQuintal: 4100, trend: 'Up', changePercent: '+1.1%', changeAmountPerKg: 0.45, topMarket: 'Nizamabad', state: 'Telangana', mandiCount: 1, arrivalDate: 'Today' },
  { id: 'groundnut', displayName: 'Groundnut', emoji: '🥜', modalPricePerKg: 58, minPricePerKg: 54, maxPricePerKg: 62, modalPricePerQuintal: 5800, trend: 'Up', changePercent: '+0.6%', changeAmountPerKg: 0.35, topMarket: 'Kurnool', state: 'Andhra Pradesh', mandiCount: 1, arrivalDate: 'Today' },
];

// ── Crop emoji lookup ─────────────────────────────────────────────
export const getCropEmoji = (name) => {
  if (!name) return '🍃';
  const n = name.toLowerCase();
  if (n.includes('rice') || n.includes('paddy')) return '🌾';
  if (n.includes('wheat')) return '🌾';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('onion')) return '🧅';
  if (n.includes('potato')) return '🥔';
  if (n.includes('cotton')) return '☁️';
  if (n.includes('maize') || n.includes('corn')) return '🌽';
  if (n.includes('soybean')) return '🌿';
  if (n.includes('sugarcane')) return '🎋';
  if (n.includes('groundnut') || n.includes('peanut')) return '🥜';
  if (n.includes('turmeric')) return '🟡';
  if (n.includes('chilli')) return '🫑';
  if (n.includes('banana')) return '🍌';
  if (n.includes('mango')) return '🥭';
  if (n.includes('sorghum') || n.includes('jowar')) return '🌾';
  return '🍃';
};

// ── Name mapper ───────────────────────────────────────────────────
const mapCropName = (rawName) => {
  if (!rawName) return null;
  const cleaned = rawName.toLowerCase().trim();
  if (CROP_NAME_MAP[cleaned]) return CROP_NAME_MAP[cleaned];
  for (const [key, value] of Object.entries(CROP_NAME_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) return value;
  }
  return null;
};

// ── Group and average across mandis ──────────────────────────────
const groupByCrop = (records) => {
  const groups = {};
  records.forEach(record => {
    const key = record.displayName;
    if (!groups[key]) {
      groups[key] = { id: key.toLowerCase().replace(/\s/g, '_'), displayName: key, entries: [], markets: [] };
    }
    groups[key].entries.push(record);
    groups[key].markets.push(`${record.market}, ${record.district}`);
  });

  return Object.values(groups).map(group => {
    const entries = group.entries;
    const avg = (field) =>
      parseFloat((entries.reduce((s, e) => s + (e[field] || 0), 0) / entries.length).toFixed(2));

    return {
      id: group.id,
      displayName: group.displayName,
      emoji: getCropEmoji(group.displayName),
      modalPricePerKg: avg('modalPricePerKg'),
      minPricePerKg: avg('minPricePerKg'),
      maxPricePerKg: avg('maxPricePerKg'),
      modalPricePerQuintal: avg('modalPricePerQuintal'),
      mandiCount: entries.length,
      topMarket: entries[0].market,
      state: entries[0].state,
      arrivalDate: entries[0].arrivalDate,
      markets: [...new Set(group.markets)].slice(0, 3),
      trend: 'Stable',
      changeAmountPerKg: 0,
      changePercent: '0%',
      lastFetched: new Date().toISOString(),
    };
  });
};

// ── Trend computation vs cached previous price ────────────────────
const computeTrends = async (crops) => {
  return Promise.all(crops.map(async (crop) => {
    try {
      const prevSnap = await getDoc(doc(db, 'market_prices', crop.id));
      if (prevSnap.exists()) {
        const prevPrice = prevSnap.data().modalPricePerKg || 0;
        const diff = crop.modalPricePerKg - prevPrice;
        const pct = prevPrice > 0 ? ((diff / prevPrice) * 100).toFixed(1) : '0';
        const trend = Math.abs(diff) < 0.1 ? 'Stable' : diff > 0 ? 'Up' : 'Down';
        return {
          ...crop,
          trend,
          changeAmountPerKg: parseFloat(diff.toFixed(2)),
          changePercent: `${diff >= 0 ? '+' : ''}${pct}%`,
          previousPricePerKg: prevPrice,
        };
      }
    } catch (e) { /* silent */ }
    return { ...crop, trend: 'New', changePercent: 'New' };
  }));
};

// ── Save to Firestore ─────────────────────────────────────────────
const saveToFirestore = async (crops) => {
  try {
    await Promise.all(crops.map(crop =>
      setDoc(doc(db, 'market_prices', crop.id), {
        ...crop, savedAt: serverTimestamp(),
      }).catch(() => {})
    ));
    await setDoc(doc(db, 'meta', 'market_cache'), {
      lastUpdated: serverTimestamp(),
      cropCount: crops.length,
    });
  } catch (e) {
    console.warn('[mandiService] Firestore save failed:', e.message);
  }
};

// ── MAIN EXPORT — getMarketPrices ─────────────────────────────────
/**
 * Fetch mandi prices with full fallback chain.
 * @param {number} limit — max records from API
 * @param {boolean} force — bypass Firestore cache
 * @returns {{ data: Crop[], source: string, error: string|null }}
 */
export const getMarketPrices = async (limit = 100, force = false) => {
  // ── Step 1: Firestore cache ────────────────────────────────────
  if (!force) {
    try {
      const metaSnap = await getDoc(doc(db, 'meta', 'market_cache'));
      if (metaSnap.exists()) {
        const lastUpdated = metaSnap.data().lastUpdated?.toDate();
        const age = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;
        if (age < CACHE_MS) {
          const pricesSnap = await getDocs(collection(db, 'market_prices'));
          const cached = pricesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.displayName);
          if (cached.length > 0) {
            console.log('[mandiService] Serving from Firestore cache');
            return { data: cached, source: 'cache', error: null };
          }
        }
      }
    } catch (e) {
      console.warn('[mandiService] Cache check failed:', e.message);
    }
  }

  // ── Step 2: Live data.gov.in APMC API ─────────────────────────
  try {
    console.log('[mandiService] Fetching from data.gov.in APMC API...');
    const response = await axios.get(MARKET_API_URL, {
      params: { 'api-key': DATA_GOV_KEY, format: 'json', limit, offset: 0 },
      timeout: 15000,
    });

    const rawRecords = response.data?.records || [];
    if (!rawRecords.length) throw new Error('APMC API returned empty data');

    const normalized = rawRecords.map(record => {
      const rawCommodity = (
        record.commodity || record.Commodity || record.crop_name || ''
      ).toLowerCase().trim();
      const displayName = mapCropName(rawCommodity);
      if (!displayName) return null;

      const min   = parseFloat(record.min_price   || record['Min Price']   || 0);
      const max   = parseFloat(record.max_price   || record['Max Price']   || 0);
      const modal = parseFloat(record.modal_price || record['Modal Price'] || 0);

      return {
        rawCommodity,
        displayName,
        market:      record.market   || record.Market   || 'Local Mandi',
        district:    record.district || record.District || '',
        state:       record.state    || record.State    || '',
        arrivalDate: record.arrival_date || new Date().toISOString().split('T')[0],
        minPricePerKg:      parseFloat((min   / QUINTAL_TO_KG).toFixed(2)),
        maxPricePerKg:      parseFloat((max   / QUINTAL_TO_KG).toFixed(2)),
        modalPricePerKg:    parseFloat((modal / QUINTAL_TO_KG).toFixed(2)),
        modalPricePerQuintal: modal,
      };
    }).filter(Boolean);

    const grouped  = groupByCrop(normalized);
    const withTrends = await computeTrends(grouped);
    await saveToFirestore(withTrends);

    console.log(`[mandiService] Live data fetched: ${withTrends.length} crops`);
    return { data: withTrends, source: 'api', error: null };

  } catch (apiErr) {
    console.error('[mandiService] APMC API failed:', apiErr.message);

    // ── Step 3: Stale Firestore cache ─────────────────────────
    try {
      const pricesSnap = await getDocs(collection(db, 'market_prices'));
      if (!pricesSnap.empty) {
        const stale = pricesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log('[mandiService] Serving stale Firestore cache');
        return { data: stale, source: 'stale_cache', error: null };
      }
    } catch (fsErr) { /* silent */ }

    // ── Step 4: AI fallback via Flask ─────────────────────────
    try {
      console.log('[mandiService] Trying Flask AI fallback...');
      const res = await axios.post(`${BASE_URL}/mandi-prices`, {
        mandi: 'Khammam', language: 'en',
      }, { timeout: 25000 });

      if (res.data.success && res.data.data?.prices?.length > 0) {
        return { data: res.data.data.prices, source: 'ai_fallback', error: null };
      }
    } catch (aiErr) { /* silent */ }

    // ── Step 5: Hardcoded absolute fallback ───────────────────
    console.log('[mandiService] Using hardcoded fallback data');
    return { data: HARDCODED_FALLBACK, source: 'fallback', error: apiErr.message };
  }
};

// ── Utility functions ─────────────────────────────────────────────
export const searchCrops = (crops, query) => {
  if (!query?.trim()) return crops;
  const q = query.toLowerCase().trim();
  return crops.filter(c =>
    c.displayName?.toLowerCase().includes(q) ||
    c.topMarket?.toLowerCase().includes(q) ||
    c.state?.toLowerCase().includes(q)
  );
};

export const getCropsByTrend = (crops, trend) => crops.filter(c => c.trend === trend);

export const getSortedCrops = (crops, field, order = 'desc') =>
  [...crops].sort((a, b) => order === 'desc' ? b[field] - a[field] : a[field] - b[field]);

// Alias for backward compatibility
export const fetchMandiPricesFromAI = getMarketPrices;
export const getLocalPrices = () => ({ prices: HARDCODED_FALLBACK, signal: null });
