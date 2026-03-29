/**
 * Centralized Service Exports for Kisan AI Shield.
 */

// Weather & Irrigation
export { fetchWeatherData } from './weatherService';
export { getIrrigationAdvice } from './irrigationService';

// Market & Mandi Prices
export { 
  getMarketPrices,
  fetchMarketPrices, 
  searchCrops, 
  getCropsByTrend,
  getSortedCrops
} from './marketService';

// Government Schemes & AI
export { fetchSchemes, checkEligibility } from './schemeService';

// Disease Detection & History
export { predictDisease, saveDiseaseLog, getDiseaseHistory } from './diseaseService';
