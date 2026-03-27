import axios from 'axios';
import { BASE_URL } from './apiConfig';

// Instant local fallback data — always available, zero network dependency
const LOCAL_PRICES = {
    signal: { crop: "Chilli", emoji: "🫑", title: "Sell Signal - Chilli", desc: "Prices trending up this week. Good time to sell." },
    prices: [
        { emoji: "🌾", name: "Wheat", price: "₹2,150", change: "+2.4%", up: true },
        { emoji: "🌽", name: "Maize", price: "₹1,820", change: "-0.8%", up: false },
        { emoji: "🍅", name: "Tomato", price: "₹3,400", change: "+5.2%", up: true },
        { emoji: "🧅", name: "Onion", price: "₹1,650", change: "-1.3%", up: false },
        { emoji: "🫑", name: "Chilli", price: "₹9,200", change: "+3.7%", up: true },
        { emoji: "🌱", name: "Soybean", price: "₹4,100", change: "+1.1%", up: true },
        { emoji: "🥜", name: "Groundnut", price: "₹5,800", change: "+0.6%", up: true },
        { emoji: "🌿", name: "Cotton", price: "₹7,300", change: "-2.1%", up: false },
    ]
};

export const getLocalPrices = (mandi) => {
    // Return instant local data with customized mandi name
    return {
        ...LOCAL_PRICES,
        signal: { ...LOCAL_PRICES.signal, title: `Sell Signal - Chilli (${mandi})` }
    };
};

export const fetchMandiPricesFromAI = async (mandi = 'Khammam', language = 'en') => {
    try {
        const response = await axios.post(`${BASE_URL}/mandi-prices`, {
            mandi, language
        }, { timeout: 25000 });

        if (response.data.success && response.data.data?.prices?.length > 0) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.log("Mandi AI upgrade skipped:", error.message);
        return null;
    }
};
