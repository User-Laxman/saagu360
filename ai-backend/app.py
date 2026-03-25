from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_pipeline import pipeline
from dotenv import load_dotenv

load_dotenv() # Loads the .env file into os.environ

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

if __name__ == '__main__':
    # host='0.0.0.0' allows external devices (like your phone or emulator) to connect
    print("🚀 Kisan AI Shield Server starting...")
    app.run(host='0.0.0.0', port=5000, debug=True)
