/**
 * services/irrigationService.js
 * 5-tier irrigation advice logic engine.
 * Based on rain probability, temperature, humidity, and wind speed.
 */

/**
 * Derive rain probability (0-100%) from OpenWeatherMap condition code.
 * Used when the backend gives us a condition code rather than a % value.
 * @param {number} id — OWM weather condition code
 * @returns {number} rain probability 0–100
 */
export const rainProbabilityFromCode = (id) => {
  if (!id) return 20;
  if (id >= 200 && id < 300) return 90; // Thunderstorm
  if (id >= 300 && id < 400) return 70; // Drizzle
  if (id >= 500 && id < 600) return 85; // Rain
  if (id >= 600 && id < 700) return 60; // Snow
  if (id === 800) return 5;             // Clear sky
  if (id > 800 && id <= 804) return 30; // Cloudy
  return 20; // Default
};

/**
 * Main irrigation advice function.
 * @param {object} weatherData — { rain, temp, humidity, windSpeed }
 *   - rain: 0–100 probability %
 *   - temp: °C
 *   - humidity: %
 *   - windSpeed: m/s
 * @returns {{ advice: string, urgency: 'low'|'medium'|'high', reason: string }}
 */
export const getIrrigationAdvice = (weatherData) => {
  const {
    rain = 20,
    temp = 28,
    humidity = 65,
    windSpeed = 10,
  } = weatherData || {};

  let advice = '';
  let urgency = 'low';
  let reason = '';

  // ── Primary: rain-based tiers ───────────────────────────────
  if (rain > 70) {
    advice = 'Skip irrigation — heavy rain expected';
    urgency = 'low';
    reason = 'Expected heavy rainfall will provide more than enough moisture. Avoid waterlogging.';
  } else if (rain >= 50 && rain <= 70) {
    advice = 'Delay irrigation — moderate rain likely';
    urgency = 'low';
    reason = 'Moderate rainfall forecast. Manual irrigation unnecessary today.';
  } else if (rain >= 30 && rain < 50) {
    advice = 'Light irrigation recommended';
    urgency = 'medium';
    reason = 'Partial rain expected. A light supplement may benefit crops without overwatering.';
  } else {
    // rain < 30 — temperature decides
    if (temp > 35) {
      advice = 'Irrigate immediately — heat stress risk';
      urgency = 'high';
      reason = 'High temperatures with low rain risk. Crops are losing moisture rapidly. Early morning irrigation advised.';
    } else if (temp >= 25 && temp <= 35) {
      advice = 'Irrigate crops — standard conditions';
      urgency = 'medium';
      reason = 'Warm, dry conditions require regular irrigation to support healthy crop growth.';
    } else {
      advice = 'Light irrigation — cool weather';
      urgency = 'low';
      reason = 'Cooler temperatures reduce evaporation. Reduce irrigation volume by 20%.';
    }
  }

  // ── Secondary adjustments: humidity & wind ───────────────────
  const warnings = [];
  if (humidity > 85) {
    warnings.push('High humidity — monitor for fungal disease.');
  }
  if (windSpeed > 20) {
    warnings.push('High winds detected — avoid sprinkler irrigation.');
  }
  if (warnings.length > 0) {
    advice += ' | ' + warnings.join(' ');
  }

  return { advice, urgency, reason };
};

/**
 * Get a human-readable irrigation status card config.
 * @param {number} rain — 0–100
 * @param {string} main — OWM main weather string e.g. "Rain", "Clear"
 */
export const getIrrigationCardConfig = (rain, main) => {
  if (main === 'Rain' || main === 'Thunderstorm' || main === 'Drizzle' || rain > 50) {
    return {
      title: 'NO WATERING NEEDED',
      desc: 'Rain detected. Natural moisture is sufficient.',
      icon: '🌧',
      color: '#1565C0',
    };
  }
  if (rain < 30 && main === 'Clear') {
    return {
      title: 'IRRIGATE TODAY',
      desc: 'Clear skies and low rain forecast. Water crops early morning.',
      icon: '💧',
      color: '#E65100',
    };
  }
  return {
    title: 'LIGHT IRRIGATION',
    desc: 'Partly cloudy conditions. Supplement as needed.',
    icon: '⛅',
    color: '#2E7D32',
  };
};
