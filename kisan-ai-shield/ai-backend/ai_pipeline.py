import os
from features.disease_vision_engine import DiseaseVisionModel
from features.advisory_llm_engine import AdvisoryLLM
from features.speech_language_engine import SpeechLanguageEngine
from features.speech_to_text import transcribe_audio_file

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
    def process_plant_image(self, image_file_bytes, language='en'):
        '''
        Backend dev passes raw bytes from Flask `request.files['image'].read()`.
        Pipeline returns a formatted JSON dictionary.
        '''
        try:
            result = self.vision_engine.predict(image_file_bytes)
            if result.get("success") and language != 'en':
                result["diagnosis"] = self.language_engine.translate_to_regional(result["diagnosis"], target_lang=language)
                result["visual_severity"] = self.language_engine.translate_to_regional(result["visual_severity"], target_lang=language)
                result["recommendation"] = self.language_engine.translate_to_regional(result["recommendation"], target_lang=language)
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
            print("[AIPipeline] Received chat request.")
            # Step 1: Normalize input to English
            print(f"[AIPipeline] Translating query from {language} to EN...")
            english_query = self.language_engine.translate_to_english(raw_user_text, source_lang=language)
            print("[AIPipeline] Query translated. Fetching LLM reasoning...")
            
            # Step 2: Get AI Reasoning (Injecting geolocation if available)
            english_response = self.llm_engine.generate_advice(english_query, lat=lat, lon=lon)
            print("[AIPipeline] LLM responded. Re-translating...")
            
            # Step 3: Localize response back to the user
            localized_response = self.language_engine.translate_to_regional(english_response, target_lang=language)
            print("[AIPipeline] Translation complete. Returning payload.")
            
            return {
                "success": True,
                "input_language": language,
                "response": localized_response
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ==========================================
    # ENDPOINT 3: /voice-chat (Audio + Context)
    # ==========================================
    def process_voice_chat(self, audio_file_path, language='en-IN', lat=None, lon=None):
        '''
        Facade method for Audio. Transcribes the recorded voice clip locally, 
        and safely passes the exact text to the main LLM advisory stream.
        '''
        print(f"[AIPipeline] Processing incoming audio file...")
        
        # Step 1: Transcribe the local voice clip to text
        transcription_result = transcribe_audio_file(audio_file_path, language=language)
        
        if "error" in transcription_result:
            return {"success": False, "error": transcription_result["error"]}
            
        transcribed_text = transcription_result["text"]
        print(f"[AIPipeline] Transcribed Text: '{transcribed_text}'")
        
        # Step 2: Route seamlessly into the standard Advisory Chat
        # Note: We pass the exact text downstream! No new business logic needed.
        chat_result = self.process_advisory_chat(transcribed_text, language=language, lat=lat, lon=lon)
        
        # We append the transcribed text to the response so the frontend UI can show what the bot heard
        if chat_result.get("success"):
            chat_result["transcribed_query"] = transcribed_text
            
        return chat_result

    # ==========================================
    # ENDPOINT 4: /translate (Seamless Chat Toggling)
    # ==========================================
    def translate_history(self, texts, target_lang='en'):
        '''
        Loops through an array of current chat messages and translates
        them into the new target UI language seamlessly.
        '''
        try:
            return {
                "success": True,
                "translations": [self.language_engine.translate_direct(t, target_lang) for t in texts]
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

# Export a singleton instance for global use
pipeline = KisanAIPipeline()
