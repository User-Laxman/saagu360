/**
 * Mock data for Mandi Market Prices (Fallback).
 * Primarily focuses on Telangana/Hyderabad market data.
 */
export const MOCK_MARKET_DATA = [
  { commodity: "Rice", minPrice: 2000, maxPrice: 2400, modalPrice: 2250, market: "Yellandu", district: "Bhadradri Kothagudem", state: "Telangana" },
  { commodity: "Wheat", minPrice: 2100, maxPrice: 2500, modalPrice: 2350, market: "Hyderabad", district: "Hyderabad", state: "Telangana" },
  { commodity: "Tomato", minPrice: 800, maxPrice: 1500, modalPrice: 1200, market: "Bowenpally", district: "Hyderabad", state: "Telangana" },
  { commodity: "Onion", minPrice: 1500, maxPrice: 2500, modalPrice: 2100, market: "Malakpet", district: "Hyderabad", state: "Telangana" },
  { commodity: "Potato", minPrice: 1200, maxPrice: 1800, modalPrice: 1600, market: "Bowenpally", district: "Hyderabad", state: "Telangana" },
  { commodity: "Cotton", minPrice: 6500, maxPrice: 7500, modalPrice: 7100, market: "Warangal", district: "Warangal", state: "Telangana" },
  { commodity: "Maize", minPrice: 1800, maxPrice: 2100, modalPrice: 1950, market: "Nizamabad", district: "Nizamabad", state: "Telangana" },
  { commodity: "Soybean", minPrice: 4000, maxPrice: 4800, modalPrice: 4400, market: "Adilabad", district: "Adilabad", state: "Telangana" },
  { commodity: "Sugarcane", minPrice: 280, maxPrice: 320, modalPrice: 300, market: "Sangareddy", district: "Sangareddy", state: "Telangana" },
  { commodity: "Groundnut", minPrice: 5500, maxPrice: 6500, modalPrice: 6000, market: "Mahabubnagar", district: "Mahabubnagar", state: "Telangana" },
  { commodity: "Turmeric", minPrice: 7000, maxPrice: 12000, modalPrice: 9500, market: "Nizamabad", district: "Nizamabad", state: "Telangana" },
  { commodity: "Chilli", minPrice: 15000, maxPrice: 22000, modalPrice: 18500, market: "Guntur", district: "Guntur", state: "Andhra Pradesh" },
  { commodity: "Banana", minPrice: 1000, maxPrice: 3000, modalPrice: 2000, market: "Hyderabad", district: "Hyderabad", state: "Telangana" },
  { commodity: "Mango", minPrice: 3000, maxPrice: 8000, modalPrice: 5000, market: "Khammam", district: "Khammam", state: "Telangana" },
  { commodity: "Sorghum", minPrice: 2200, maxPrice: 2800, modalPrice: 2500, market: "Mahabubnagar", district: "Mahabubnagar", state: "Telangana" }
].map(item => ({
  ...item,
  id: `${item.commodity.toLowerCase()}_${item.market.toLowerCase()}`,
  variety: "Common",
  arrivalDate: new Date().toISOString().split('T')[0],
  priceUnit: "Per Quintal",
  trend: "Stable",
  changePercent: "0.0%",
  lastUpdated: new Date().toISOString()
}));
