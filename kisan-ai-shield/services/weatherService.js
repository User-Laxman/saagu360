/**
 * Fetches weather data from OpenWeatherMap free API.
 * @param {string} city - The city name (default: "Hyderabad").
 * @returns {Promise<object>} Clean weather object or hardcoded fallback.
 */
export const fetchWeatherData = async (city = "Hyderabad") => {
  const KEY = process.env.EXPO_PUBLIC_WEATHER_KEY;
  const URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${KEY}&units=metric`;

  try {
    const response = await fetch(URL);
    if (!response.ok) throw new Error("Weather fetch failed");
    
    const data = await response.json();
    const id = data.weather[0].id;
    
    // Derive rain probability from condition codes
    let rain = 20; // default
    if (id >= 200 && id < 300) rain = 90;      // thunderstorm
    else if (id >= 300 && id < 400) rain = 70; // drizzle
    else if (id >= 500 && id < 600) rain = 80; // rain
    else if (id >= 600 && id < 700) rain = 60; // snow
    else if (id === 800) rain = 5;            // clear
    else if (id > 800 && id <= 804) rain = 30; // clouds

    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      rain: rain,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      city: data.name,
      fetchedAt: new Date().toISOString(),
      source: "live"
    };
  } catch (error) {
    console.error("weatherService Error:", error);
    // Hardcoded Hyderabad fallback
    return {
      temp: 28,
      feelsLike: 30,
      rain: 15,
      humidity: 60,
      windSpeed: 10,
      description: "partly cloudy",
      city: "Hyderabad",
      fetchedAt: new Date().toISOString(),
      source: "fallback"
    };
  }
};
