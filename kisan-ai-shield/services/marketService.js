/**
 * Mock market service with realistic fluctuation and simulated delay.
 * @returns {Promise<object>} Market price data object.
 */
export const fetchMarketPrices = async () => {
  try {
    // 300ms simulated async delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const cropList = [
      { name: "Rice", basePrice: 2200 },
      { name: "Wheat", basePrice: 2100 },
      { name: "Maize", basePrice: 1800 },
      { name: "Cotton", basePrice: 6500 },
      { name: "Tomato", basePrice: 2500 },
      { name: "Onion", basePrice: 1500 },
      { name: "Soybean", basePrice: 4200 }
    ];

    const crops = cropList.map(crop => {
      // Fluctuates within ±5%
      const fluctuation = (Math.random() * 0.1) - 0.05;
      const currentPrice = Math.round(crop.basePrice * (1 + fluctuation));
      const changePercent = parseFloat((fluctuation * 100).toFixed(2));
      const trend = fluctuation > 0.01 ? "up" : (fluctuation < -0.01 ? "down" : "stable");

      return {
        name: crop.name,
        basePrice: crop.basePrice,
        currentPrice: currentPrice,
        unit: "₹/quintal",
        trend: trend,
        changePercent: changePercent
      };
    });

    return {
      crops,
      market: "APMC Hyderabad",
      lastUpdated: new Date().toISOString(),
      source: "mock"
    };
  } catch (error) {
    console.error("marketService Error:", error);
    return {
      crops: [],
      market: "N/A",
      lastUpdated: new Date().toISOString(),
      source: "error"
    };
  }
};
