import io
import json
import os
import re
import base64
import requests
from PIL import Image
import numpy as np

# Native TensorFlow inference support for Local GPU execution
try:
    import tensorflow as tf
except ImportError:
    tf = None

class DiseaseVisionModel:
    '''
    Production-ready Vision Pipeline for Plant Disease Detection.
    Expects raw image bytes from the API layer.
    Prioritizes a local TensorFlow .h5 model for extreme speed and privacy.
    Falls back to OpenRouter Cloud models if the local model is missing.
    '''
    def __init__(self, model_path=None):
        # Default to the path where `train_vision_model.py` saves the network
        default_path = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models", "crop_disease.h5")
        self.model_path = model_path or os.environ.get("VISION_MODEL_PATH", os.path.abspath(default_path))
        self.model_loaded = False
        
        # Load the dynamic dataset class labels if they exist
        labels_path = os.path.join(os.path.dirname(self.model_path), "class_labels.json")
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                mapping = json.load(f)
                # Map integer indices to string names
                self.class_labels = [mapping[str(i)] for i in range(len(mapping))]
        else:
            self.class_labels = []
            
        self._load_model()
        
        # Fallback to OpenRouter
        self.api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("AI_API_KEY")
        if not self.model_loaded and self.api_key:
            self.model_name = "stepfun/step-3.5-flash:free"
            print(f"[VisionEngine] Initialized OpenRouter fallback ({self.model_name}).")

    def _load_model(self):
        '''Loads the local Keras model if available.'''
        if tf and self.model_path and os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                self.model_loaded = True
                print(f"[VisionEngine] Successfully loaded local GPU model from {self.model_path}")
            except Exception as e:
                print(f"[VisionEngine] Failed to load local model: {e}")
        else:
            if not tf:
                print("[VisionEngine] TensorFlow not installed. Skipping local model load.")
            else:
                print("[VisionEngine] Local .h5 model not found. Falling back to OpenRouter.")
            self.model_loaded = False

    def preprocess_image(self, image_bytes):
        '''MobileNetV2 standard preprocessing [-1, 1]'''
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32)
        img_array = (img_array / 127.5) - 1.0 
        img_batch = np.expand_dims(img_array, axis=0)
        return img_batch

    def predict(self, image_bytes):
        '''Main Integration point for Image Analysis.'''
        try:
            if self.model_loaded:
                # LOCAL GPU ML INFERENCE
                tensor = self.preprocess_image(image_bytes)
                predictions = self.model.predict(tensor, verbose=0)[0]
                top_index = int(np.argmax(predictions)) # Cast from np.int64
                confidence = float(predictions[top_index])
                
                # Try to map index to label safely
                diagnosis = self.class_labels[top_index] if top_index < len(self.class_labels) else f"Class {top_index}"
                
                # Format the raw dataset folder name (e.g. "Tomato___Early_blight" -> "Tomato Early Blight")
                diagnosis = diagnosis.replace("___", " ").replace("_", " ")

                return {
                    "success": True,
                    "diagnosis": diagnosis,
                    "confidence_score": round(confidence, 4),
                    "visual_severity": "Moderate" if confidence < 0.9 else "High",
                    "recommendation": f"Please refer to the chatbot for treatment regarding {diagnosis}."
                }
                
            elif getattr(self, 'model_name', None):
                # OPENROUTER CLOUD FALLBACK
                print(f"[VisionEngine] Routing image to OpenRouter API ({self.model_name}).")
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                prompt = (
                    "Analyze this crop leaf image. What disease does it have? "
                    "Respond with NOTHING ELSE but a strictly valid JSON dictionary with two keys: "
                    "'diagnosis' (string) and 'confidence' (float between 0.0 and 1.0). "
                    "If it is healthy, set diagnosis to 'Healthy'."
                )
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                            ]
                        }
                    ]
                }
                headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
                response = requests.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
                
                if response.status_code != 200:
                    raise Exception(f"OpenRouter Error: {response.text}")

                text = response.json()['choices'][0]['message']['content']
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    diagnosis = data.get("diagnosis", "Unknown Disease")
                    confidence = float(data.get("confidence", 0.85))
                else:
                    diagnosis = "Leaf Analysis Unclear"
                    confidence = 0.50

                return {
                    "success": True, "diagnosis": diagnosis, "confidence_score": round(confidence, 4),
                    "visual_severity": "Moderate" if confidence < 0.9 else "High",
                    "recommendation": f"Please ask the Ask AI bot about {diagnosis}."
                }
            else:
                return {"success": False, "error": "Unidentifiable. System offline due to missing Model and API Key."}
            
        except Exception as e:
            print(f"[VisionEngine] Error processing image: {e}")
            return {"success": False, "error": str(e)}
