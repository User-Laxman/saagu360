import os
from features.disease_vision_engine import DiseaseVisionModel
from features.advisory_llm_engine import AdvisoryLLM
from features.speech_language_engine import SpeechLanguageEngine

class KisanAIPipeline:
    '''
    THE MASTER INTEGRATION POINT
    -----------------------------
    This class is the only file the Backend Developer needs to import in `app.py`.
    It perfectly encapsulates all Perception, Reasoning, and Communication logic 
    built by the AI Experience Engineer.
    '''
    
    def __init__(self):
        print("[AIPipeline] Initializing core models and logic APIs...")
        
        # 1. Init Vision Model (Perception)
        # e.g., os.path.join(os.path.dirname(__file__), 'models', 'plant_disease.h5')
        model_path = os.environ.get("VISION_MODEL_PATH", None) 
        self.vision_engine = DiseaseVisionModel(model_path=model_path)
        
        # 2. Init Large Language Model (Reasoning)
        self.llm_engine = AdvisoryLLM()
        
        # 3. Init Translation Services (Communication)
        self.language_engine = SpeechLanguageEngine()

    # ==========================================
    # ENDPOINT 1: /predict (Image)
    # ==========================================
    def process_plant_image(self, image_file_bytes):
        '''
        Backend dev passes raw bytes from Flask `request.files['image'].read()`.
        Pipeline returns a formatted JSON dictionary.
        '''
        try:
            result = self.vision_engine.predict(image_file_bytes)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==========================================
    # ENDPOINT 2: /chat (Text + Context)
    # ==========================================
    def process_advisory_chat(self, raw_user_text, language='en', lat=None, lon=None):
        '''
        Backend dev passes the JSON body from the React Native app.
        Pipeline handles translation, context injection (weather), API queries, 
        reverse translation, and formatting.
        '''
        try:
            # Step 1: Normalize input to English
            english_query = self.language_engine.translate_to_english(raw_user_text, source_lang=language)
            
            # Step 2: Get AI Reasoning (Injecting geolocation if available)
            english_response = self.llm_engine.generate_advice(english_query, lat=lat, lon=lon)
            
            # Step 3: Localize response back to the user
            localized_response = self.language_engine.translate_to_regional(english_response, target_lang=language)
            
            return {
                "success": True,
                "input_language": language,
                "response": localized_response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

# Export a singleton instance for global use
pipeline = KisanAIPipeline()
