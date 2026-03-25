import os
import requests

class AdvisoryLLM:
    '''
    Production-ready Reasoning Engine.
    Now directly hooks into OpenRouter's GPT/Cloud models (e.g. stepfun).
    Injects real-time tools natively into the prompt context for hyper-accurate answers.
    '''
    
    SYSTEM_INSTRUCTION = (
        "You are an expert Indian Agronomist AI. Provide actionable, concise, "
        "and accurate farming advice. Do not output markdown, as it will be spoken via TTS."
    )

    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY") or os.environ.get("AI_API_KEY")
        self.is_configured = False
        
        if self.api_key:
            self.model_name = "stepfun/step-3.5-flash:free"
            self.is_configured = True
            print(f"[LLMEngine] Successfully initialized OpenRouter context ({self.model_name}).")
        else:
            print("[LLMEngine] WARNING: No OPENROUTER_API_KEY or AI_API_KEY found. Engine disabled.")

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
            # Generate response via OpenRouter HTTP endpoint
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "system", "content": self.SYSTEM_INSTRUCTION},
                    {"role": "user", "content": prompt}
                ]
            }
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            res = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            
            if res.status_code != 200:
                raise Exception(f"API Error {res.status_code}: {res.text}")

            data = res.json()
            response_text = data['choices'][0]['message']['content']
            
            return response_text.replace('*', '').strip()  # Clean up markdown for TTS
            
        except Exception as e:
            print(f"[LLMEngine] Inference failed: {e}")
            return "I am currently unable to process your request due to a server disruption. Please try again shortly."
