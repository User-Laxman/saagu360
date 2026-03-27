import os
import re
import json as json_mod
import tempfile
import uuid
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path) # Loads the .env file into os.environ BEFORE anything else

from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_pipeline import pipeline

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for React Native / Expo to access this API

@app.route('/predict', methods=['POST'])
def predict():
    """
    Receives an image via form-data, passes it to the Vision Engine, 
    and returns a JSON response describing the crop disease.
    """
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image provided in form-data"}), 400
    
    file = request.files['image']
    image_bytes = file.read()
    
    # Reject uploads larger than 10MB to protect server memory
    if len(image_bytes) > 10 * 1024 * 1024:
        return jsonify({"success": False, "error": "Image is too large. Maximum 10MB."}), 413
    
    # Send image to AI Pipeline Facade
    result = pipeline.process_plant_image(image_bytes)
    return jsonify(result)

@app.route('/chat', methods=['POST'])
def chat():
    """
    Receives text, language, and optional geolocation data to provide 
    AI advisory via the RAG LLM engine.
    """
    data = request.json
    if not data or 'text' not in data:
        return jsonify({"success": False, "error": "No text provided in request body"}), 400
        
    text = data.get('text')
    language = data.get('language', 'en')
    lat = data.get('lat')
    lon = data.get('lon')
    
    # Send request parameters to AI Pipeline Facade
    result = pipeline.process_advisory_chat(text, language, lat, lon)
    return jsonify(result)

@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    """
    Receives an audio file (e.g. .wav) from the mobile device via form-data, 
    securely saves it to a temp disk location, transcribes it, and routes it through the RAG.
    """
    if 'audio' not in request.files:
        return jsonify({"success": False, "error": "No audio file provided in form-data"}), 400
        
    audio_file = request.files['audio']
    
    # Extract metadata fields from the form
    language = request.form.get('language', 'en-IN')
    lat = request.form.get('lat')
    lon = request.form.get('lon')
    
    # Securely generate a temporary file safely
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"kisan_voice_{uuid.uuid4().hex}.wav")
    
    try:
        # Save audio byte-stream to disk
        audio_file.save(temp_path)
        
        # Process through the unified facade
        result = pipeline.process_voice_chat(temp_path, language=language, lat=lat, lon=lon)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
        
    finally:
        # ABSOLUTE REQUIREMENT: Clean memory to prevent server storage leaks over time
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/schemes', methods=['POST'])
def schemes():
    """
    Receives farmer profile data and uses the LLM to fetch and filter
    eligible Indian government agricultural schemes in real-time.
    """
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "No farmer profile provided"}), 400

    name = data.get('name', 'Farmer')
    state = data.get('state', 'India')
    land_acres = data.get('land_acres', 'Unknown')
    crop = data.get('crop', 'General')
    category = data.get('category', 'General')
    irrigation = data.get('irrigation', 'Unknown')

    prompt = (
        f"You are an expert Indian agriculture policy advisor. "
        f"A farmer named {name} from {state} owns {land_acres} acres of land, "
        f"grows {crop}, belongs to the {category} category, "
        f"and uses {irrigation} irrigation.\n\n"
        f"List the TOP 5 most relevant Indian government agricultural schemes "
        f"this farmer is eligible for as of 2026. "
        f"For EACH scheme, respond in this EXACT JSON array format and nothing else:\n"
        f'[{{"name":"...","ministry":"...","benefit":"...","amount":"...","desc":"..."}}]\n\n'
        f"Only return the JSON array. No markdown, no explanation."
    )

    try:
        llm_response = pipeline.llm_engine.generate_advice(prompt)

        # re and json_mod are imported at the top of the file
        match = re.search(r'\[.*\]', llm_response, re.DOTALL)
        if match:
            schemes_list = json_mod.loads(match.group(0))
        else:
            schemes_list = [{"name": "Could not parse schemes", "ministry": "", "benefit": "", "amount": "", "desc": llm_response}]

        return jsonify({"success": True, "schemes": schemes_list})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/weather', methods=['GET'])
def get_weather():
    lat = request.args.get('lat', '17.2473')  # Default to Khammam, TS
    lon = request.args.get('lon', '80.1514')
    api_key = os.getenv('EXPO_PUBLIC_WEATHER_KEY')
    
    if not api_key:
        return jsonify({"success": False, "error": "EXPO_PUBLIC_WEATHER_KEY is missing in root .env"}), 500
        
    try:
        # Fetch current weather
        current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        current_res = requests.get(current_url, timeout=10).json()
        
        # Fetch 5-day forecast
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        forecast_res = requests.get(forecast_url, timeout=10).json()

        # Check for API errors
        if current_res.get('cod') != 200:
            return jsonify({"success": False, "error": current_res.get('message', 'Unknown error')}), 400

        return jsonify({
            "success": True, 
            "current": current_res,
            "forecast": forecast_res
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/mandi-prices', methods=['POST'])
def mandi_prices():
    """
    Returns dynamically generated approximate mandi prices.
    Falls back to realistic static data if the LLM times out.
    """
    data = request.json or {}
    mandi = data.get('mandi', 'Khammam')
    language = data.get('language', 'en')

    # Realistic fallback data if LLM is slow
    fallback = {
        "signal": {"crop": "Chilli", "emoji": "🫑", "title": f"Sell Signal - Chilli ({mandi})", "desc": "Prices trending up this week. Good time to sell."},
        "prices": [
            {"emoji": "🌾", "name": "Wheat", "price": "₹2,150", "change": "+2.4%", "up": True},
            {"emoji": "🌽", "name": "Maize", "price": "₹1,820", "change": "-0.8%", "up": False},
            {"emoji": "🍅", "name": "Tomato", "price": "₹3,400", "change": "+5.2%", "up": True},
            {"emoji": "🧅", "name": "Onion", "price": "₹1,650", "change": "-1.3%", "up": False},
            {"emoji": "🫑", "name": "Chilli", "price": "₹9,200", "change": "+3.7%", "up": True},
            {"emoji": "🌱", "name": "Soybean", "price": "₹4,100", "change": "+1.1%", "up": True},
            {"emoji": "🥜", "name": "Groundnut", "price": "₹5,800", "change": "+0.6%", "up": True},
            {"emoji": "🌿", "name": "Cotton", "price": "₹7,300", "change": "-2.1%", "up": False},
        ]
    }

    prompt = (
        f"List 8 crop prices for {mandi} mandi in India. Language: {language}. "
        f"Return ONLY valid JSON: "
        f'{{"signal":{{"crop":"...","emoji":"...","title":"...","desc":"..."}},'
        f'"prices":[{{"emoji":"...","name":"...","price":"₹...","change":"+X%","up":true}}]}}'
    )

    try:
        # re and json_mod are imported at the top of the file
        llm_response = pipeline.llm_engine.generate_advice(prompt)
        match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if match:
            res_json = json_mod.loads(match.group(0))
            return jsonify({"success": True, "data": res_json})
    except Exception as e:
        print(f"[MandiPrices] LLM failed, using fallback: {e}")

    # Always return data, even on failure
    return jsonify({"success": True, "data": fallback})

if __name__ == '__main__':
    # host='0.0.0.0' allows external devices (like your phone or emulator) to connect
    print("🚀 Kisan AI Shield Server starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)
