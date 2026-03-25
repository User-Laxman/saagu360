import google.generativeai as genai
import os
import requests

class AdvisoryLLM:
    '''
    Production-ready Reasoning Engine.
    Uses Google Gemini via the `google-generativeai` SDK.
    Injects real-time tools natively into the prompt context for hyper-accurate answers.
    '''
    
    SYSTEM_INSTRUCTION = (
        "You are an expert Indian Agronomist AI. Provide actionable, concise, "
        "and accurate farming advice. Do not output markdown, as it will be spoken via TTS."
    )

    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.is_configured = False
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=self.SYSTEM_INSTRUCTION
            )
            self.is_configured = True
            print("[LLMEngine] Successfully initialized Gemini model context.")
        else:
            print("[LLMEngine] WARNING: No GEMINI_API_KEY found. Engine disabled.")

    def fetch_weather_context(self, lat, lon):
        '''Internal tool call: Fetch live weather'''
        weather_key = os.environ.get("OPENWEATHER_API_KEY", "")
        if not weather_key:
            return "No live weather available."
            
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={weather_key}&units=metric"
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                d = res.json()
                return f"Currently {d['weather'][0]['description']}, {d['main']['temp']}°C, {d['main']['humidity']}% humidity."
        except:
            pass
        return "Weather service unreachable."

    def generate_advice(self, english_query, lat=None, lon=None):
        '''
        Main integration point for Backend.
        Expects English text, formats the RAG prompt, and returns the LLM response.
        '''
        if not self.is_configured:
            return "Apologies, the AI reasoning engine is currently unconfigured. Please check API keys."

        # RAG / Tool Injection
        context_string = ""
        if lat and lon:
            w_context = self.fetch_weather_context(lat, lon)
            context_string = f"[Current Location Weather: {w_context}]\n"

        prompt = f"{context_string}Farmer asks: {english_query}\nReply clearly as an expert."

        try:
            # Generate response with robust error handling
            chat_session = self.model.start_chat(history=[])
            response = chat_session.send_message(prompt)
            return response.text.replace('*', '').strip()  # Clean up markdown for TTS
        except Exception as e:
            print(f"[LLMEngine] Inference failed: {e}")
            return "I am currently unable to process your request due to a server disruption. Please try again shortly."
