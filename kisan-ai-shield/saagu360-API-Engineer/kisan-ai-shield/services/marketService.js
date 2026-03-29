import axios from 'axios';
import { db } from '../firebase/config';
import { 
  doc, getDoc, setDoc, serverTimestamp, collection, 
  getDocs, arrayUnion, updateDoc 
} from 'firebase/firestore';
import Constants from 'expo-constants';

const MARKET_API_URL = Constants.expoConfig?.extra?.marketApiUrl || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
const API_KEY = Constants.expoConfig?.extra?.dataGovApiKey || '579b464db66ec23bdd00000143047e5301a841ff4d7fe09facee214a';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Maps API commodity names → display names
const CROP_NAME_MAP = {
  'rice': 'Rice', 'paddy': 'Rice', 'dhan': 'Rice',
  'wheat': 'Wheat', 'gehun': 'Wheat',
  'tomato': 'Tomato', 'tomatoes': 'Tomato',
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
};

const QUINTAL_TO_KG = 100; // 1 quintal = 100 kg

/**
 * Main function: Fetch all mandi prices
 * Returns normalized data with BOTH per-quintal and per-KG prices
 */
export const getMarketPrices = async (limit = 100, force = false) => {
  try {
    // Step 1: Check Firestore cache (30 min)
    if (!force) {
      const cacheRef = doc(db, 'meta', 'market_cache');
      const cacheSnap = await getDoc(cacheRef);

      if (cacheSnap.exists()) {
        const lastUpdated = cacheSnap.data().lastUpdated?.toDate();
        const age = lastUpdated ? Date.now() - lastUpdated.getTime() : Infinity;

        if (age < CACHE_DURATION) {
          // Serve from Firestore cache
          const pricesSnap = await getDocs(collection(db, 'market_prices'));
          const cached = pricesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (cached.length > 0) {
            console.log("Serving market prices from Firestore cache (meta-checked)");
            return { data: cached, error: null, source: 'cache' };
          }
        }
      }
    }

    // Step 2: Fetch from live API
    console.log("Fetching market prices from Live API...");
    const response = await axios.get(MARKET_API_URL, {
      params: {
        'api-key': API_KEY,
        format: 'json',
        limit: limit,
        offset: 0,
      },
      timeout: 15000,
    });

    const rawRecords = response.data?.records || [];
    if (!rawRecords.length) throw new Error('Market API returned empty data');

    // Step 3: Normalize all records
    const allNormalized = rawRecords.map((record, index) => {
      const rawCommodity = (
        record.commodity || record.Commodity ||
        record.crop_name || record['Commodity Name'] || ''
      ).toLowerCase().trim();

      const displayName = mapCropName(rawCommodity);

      const minPrice = parseFloat(record.min_price || record['Min Price'] || record.min || 0);
      const maxPrice = parseFloat(record.max_price || record['Max Price'] || record.max || 0);
      const modalPrice = parseFloat(record.modal_price || record['Modal Price'] || record.modal || 0);

      return {
        rawCommodity,
        displayName,
        variety: record.variety || record.Variety || 'General',
        market: record.market || record.Market || record.mandi_name || 'Local Mandi',
        district: record.district || record.District || '',
        state: record.state || record.State || '',
        arrivalDate: record.arrival_date || record['Arrival Date'] || new Date().toISOString().split('T')[0],
        minPricePerQuintal: minPrice,
        maxPricePerQuintal: maxPrice,
        modalPricePerQuintal: modalPrice,
        minPricePerKg: parseFloat((minPrice / QUINTAL_TO_KG).toFixed(2)),
        maxPricePerKg: parseFloat((maxPrice / QUINTAL_TO_KG).toFixed(2)),
        modalPricePerKg: parseFloat((modalPrice / QUINTAL_TO_KG).toFixed(2)),
        priceUnit: 'Per Quintal',
        displayUnit: 'Per KG',
      };
    }).filter(r => r.displayName !== null);

    // Step 4: Group by crop name and average prices across mandis
    const grouped = groupByCrop(allNormalized);

    // Step 5: Fetch previous prices from Firestore to compute trend
    const enrichedWithTrends = await computeTrends(grouped);

    // Step 6: Save to Firestore
    await saveMarketPricesToFirestore(enrichedWithTrends);

    return { data: enrichedWithTrends, error: null, source: 'api' };

  } catch (error) {
    console.error('[marketService] Live fetch failed:', error.message);

    try {
      const pricesSnap = await getDocs(collection(db, 'market_prices'));
      if (!pricesSnap.empty) {
        const stale = pricesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        return { data: stale, error: null, source: 'stale_cache' };
      }
    } catch (fsErr) {
      console.error('[marketService] Firestore fallback failed:', fsErr);
    }

    return { data: REAL_FALLBACK_PRICES, error: error.message, source: 'fallback' };
  }
};

const mapCropName = (rawName) => {
  if (!rawName) return null;
  const cleaned = rawName.toLowerCase().trim();
  if (CROP_NAME_MAP[cleaned]) return CROP_NAME_MAP[cleaned];
  for (const [key, value] of Object.entries(CROP_NAME_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) return value;
  }
  return null;
};

const groupByCrop = (records) => {
  const groups = {};
  records.forEach(record => {
    const key = record.displayName;
    if (!groups[key]) {
      groups[key] = {
        id: key.toLowerCase().replace(/\s/g, '_'),
        displayName: key,
        entries: [],
        markets: [],
      };
    }
    groups[key].entries.push(record);
    groups[key].markets.push(`${record.market}, ${record.district}`);
  });

  return Object.values(groups).map(group => {
    const entries = group.entries;
    const avg = (arr, field) => parseFloat((arr.reduce((s, e) => s + (e[field] || 0), 0) / arr.length).toFixed(2));

    return {
      id: group.id,
      displayName: group.displayName,
      modalPricePerKg: avg(entries, 'modalPricePerKg'),
      minPricePerKg: avg(entries, 'minPricePerKg'),
      maxPricePerKg: avg(entries, 'maxPricePerKg'),
      modalPricePerQuintal: avg(entries, 'modalPricePerQuintal'),
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

const computeTrends = async (crops) => {
  return Promise.all(crops.map(async (crop) => {
    try {
      const prevRef = doc(db, 'market_prices', crop.id);
      const prevSnap = await getDoc(prevRef);

      if (prevSnap.exists()) {
        const prevPrice = prevSnap.data().modalPricePerKg || 0;
        const currPrice = crop.modalPricePerKg;
        const diff = currPrice - prevPrice;
        const pct = prevPrice > 0 ? ((diff / prevPrice) * 100).toFixed(1) : 0;

        const trend = Math.abs(diff) < 0.1
          ? 'Stable'
          : diff > 0 ? 'Up' : 'Down';

        return {
          ...crop,
          trend,
          changeAmountPerKg: parseFloat(diff.toFixed(2)),
          changePercent: `${diff >= 0 ? '+' : ''}${pct}%`,
          previousPricePerKg: prevPrice,
        };
      }
    } catch (e) {
      console.warn('[computeTrends] Could not get prev price for', crop.id);
    }
    return { ...crop, trend: 'New', changeAmountPerKg: 0, changePercent: 'New' };
  }));
};

const saveMarketPricesToFirestore = async (crops) => {
  const batch = crops.map(async (crop) => {
    await setDoc(doc(db, 'market_prices', crop.id), {
      ...crop,
      savedAt: serverTimestamp(),
    });
  });
  await Promise.all(batch);

  await setDoc(doc(db, 'meta', 'market_cache'), {
    lastUpdated: serverTimestamp(),
    cropCount: crops.length,
  });
};

export const searchCrops = (crops, query) => {
  if (!query || query.trim() === '') return crops;
  const q = query.toLowerCase().trim();
  return crops.filter(crop =>
    crop.displayName.toLowerCase().includes(q) ||
    crop.topMarket?.toLowerCase().includes(q) ||
    crop.state?.toLowerCase().includes(q) ||
    crop.markets?.some(m => m.toLowerCase().includes(q))
  );
};

export const getCropsByTrend = (crops, trend) => crops.filter(c => c.trend === trend);

export const getSortedCrops = (crops, field, order = 'desc') =>
  [...crops].sort((a, b) => order === 'desc' ? b[field] - a[field] : a[field] - b[field]);

// Alias for dashboard compatibility
export const fetchMarketPrices = getMarketPrices;

const REAL_FALLBACK_PRICES = [
  { id: 'rice', displayName: 'Rice', modalPricePerKg: 22, minPricePerKg: 20, maxPricePerKg: 24, modalPricePerQuintal: 2200, trend: 'Stable', changeAmountPerKg: 0, changePercent: '0%', topMarket: 'Hyderabad', state: 'Telangana', mandiCount: 1 },
  { id: 'wheat', displayName: 'Wheat', modalPricePerKg: 21.25, minPricePerKg: 19, maxPricePerKg: 23, modalPricePerQuintal: 2125, trend: 'Up', changeAmountPerKg: 0.12, changePercent: '+0.6%', topMarket: 'Warangal', state: 'Telangana', mandiCount: 1 }
];
