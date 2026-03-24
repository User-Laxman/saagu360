
export const getAIResponse = async (prompt) => {
    try {
        // TEMP MOCK (replace later with real API)
        return "Based on your query, your crop may need irrigation.";
    } catch (error) {
        return "AI is currently unavailable.";
    }
};