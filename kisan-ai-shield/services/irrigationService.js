/**
 * Provides irrigation advice based on a specific logic matrix.
 * @param {object} weatherData - Weather data including rain and temp.
 * @returns {object} Advice object.
 */
export const getIrrigationAdvice = (weatherData) => {
  const { rain, temp, humidity, windSpeed } = weatherData;
  let advice = "";
  let urgency = "low";
  let reason = "";

  if (rain > 70) {
    advice = "Skip irrigation — heavy rain expected";
    urgency = "low";
    reason = "Expected heavy rainfall will provide more than enough moisture.";
  } else if (rain >= 50 && rain <= 70) {
    advice = "Do not irrigate — moderate rain likely";
    urgency = "low";
    reason = "Moderate rainfall is expected, making manual irrigation unnecessary.";
  } else if (rain >= 30 && rain < 50) {
    advice = "Light irrigation only";
    urgency = "medium";
    reason = "Some rain is expected, but a light supplement may be beneficial.";
  } else if (rain < 30) {
    if (temp > 35) {
      advice = "Irrigate immediately — hot and dry";
      urgency = "high";
      reason = "High temperatures and low rain risk lead to rapid soil drying.";
    } else if (temp >= 25 && temp <= 35) {
      advice = "Irrigate crops — normal conditions";
      urgency = "medium";
      reason = "Typical conditions require regular irrigation to maintain growth.";
    } else if (temp < 25) {
      advice = "Irrigate lightly — cool weather";
      urgency = "low";
      reason = "Cooler weather reduces water loss from evaporation.";
    }
  }

  // Humidity and Wind adjustments
  if (humidity > 85) {
    advice += " | High humidity, watch for fungal disease";
  }
  if (windSpeed > 20) {
    advice += " | High winds — avoid sprinkler irrigation";
  }

  return { advice, urgency, reason };
};
