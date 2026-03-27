import requests
import os

# Example using OpenWeatherMap API
# To run this, you would need an API Key assigned to WEATHER_API_KEY in .env
WEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "your_mock_api_key_here")

def get_farmer_weather_context(lat, lon):
    '''
    Fetches the current weather and short forecast for a given latitude/longitude.
    This context is prepended to the LLM prompt.
    '''
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            weather_desc = data['weather'][0]['description']
            temp = data['main']['temp']
            humidity = data['main']['humidity']
            
            context = (
                f"[System Context: The user is currently experiencing {weather_desc} "
                f"with a temperature of {temp}°C and {humidity}% humidity.] "
            )
            return context
        else:
            return "[System Context: Weather data unavailable.] "
    except Exception as e:
        print(f"Weather Fetch Error: {e}")
        return "[System Context: Weather data unavailable.] "

# Example Usage
if __name__ == "__main__":
    # Example coordinates for Hyderabad, India
    context = get_farmer_weather_context(17.3850, 78.4867)
    print(context)
    print("This context string should be unspooled before the user's text when calling the LLM.")
