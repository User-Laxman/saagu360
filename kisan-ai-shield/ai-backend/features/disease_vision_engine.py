import io
import json
import os
import re
import base64
import requests
from PIL import Image

try:
    import torch
    import torch.nn as nn
    from torchvision import transforms, models
except ImportError:
    torch = None

class DiseaseVisionModel:
    '''
    Production-ready Vision Pipeline for Plant Disease Detection (PyTorch Version).
    Prioritizes a local optimized PyTorch .pth model for extreme GPU speed.
    Falls back to OpenRouter Cloud models if the local model is missing.
    '''
    def __init__(self, model_path=None):
        default_path = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "models", "crop_disease_weights.pth")
        self.model_path = model_path or os.environ.get("VISION_MODEL_PATH", os.path.abspath(default_path))
        self.model_loaded = False
        
        # Determine strict device (CUDA if available, else CPU)
        self.device = torch.device('cuda' if torch and torch.cuda.is_available() else 'cpu')
        
        # Common transforms for MobileNet V2 (ImageNet normalization)
        # Note: In production (when HF model is loaded), self.processor handles this.
        if torch:
            self._fallback_transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

        # Load dynamic labels generated during training
        labels_path = os.path.join(os.path.dirname(self.model_path), "class_labels.json")
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                mapping = json.load(f)
                min_key = min([int(k) for k in mapping.keys()])
                max_key = max([int(k) for k in mapping.keys()])
                # map string keys ('0', '1') into ordered array
                self.class_labels = [mapping[str(i)] for i in range(min_key, max_key + 1)]
                self.num_classes = len(self.class_labels)
        else:
            self.class_labels = []
            self.num_classes = 38 # Default for PlantVillage if missing
            
        self._load_model()
        
        self.api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("AI_API_KEY")
        if not self.model_loaded and self.api_key:
            self.model_name = "stepfun/step-3.5-flash:free"
            print(f"[VisionEngine] Initialized OpenRouter fallback ({self.model_name}).")

    def _load_model(self):
        '''Loads the native HuggingFace model via transformers library'''
        if torch and self.model_path and os.path.exists(self.model_path) and len(self.class_labels) > 0:
            try:
                # 1. Load checkpoint for model ID
                checkpoint = torch.load(self.model_path, map_location=self.device)
                hf_model_id = checkpoint.get("hf_model_id", "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification")
                
                # 2. Rebuild via transformers
                from transformers import MobileNetV2ImageProcessor, MobileNetV2ForImageClassification
                self.processor = MobileNetV2ImageProcessor.from_pretrained(hf_model_id)
                self.model = MobileNetV2ForImageClassification.from_pretrained(hf_model_id)
                
                # Load weights from checkpoint
                if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['model_state_dict'])
                else:
                    self.model.load_state_dict(checkpoint)
                
                self.model = self.model.to(self.device).eval()
                self.local_to_hf = checkpoint.get("local_to_hf", {})
                
                self.model_loaded = True
                print(f"[VisionEngine] HF Model successfully loaded on: {str(self.device).upper()}")
            except Exception as e:
                print(f"[VisionEngine] Failed to load HF model: {e}")
        else:
            if not torch:
                print("[VisionEngine] PyTorch not installed. Serving cloud fallback.")
            else:
                print("[VisionEngine] Model weights or class labels missing. Serving cloud fallback.")
            self.model_loaded = False

    def predict(self, image_bytes):
        '''Main Integration point for Image Analysis.'''
        try:
            if self.model_loaded:
                # LOCAL HF MODEL INFERENCE
                img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
                inputs = self.processor(images=img, return_tensors="pt").to(self.device)
                
                with torch.no_grad():
                    logits = self.model(**inputs).logits
                    
                # Project back to local classes
                hf_indices = [self.local_to_hf.get(i, 0) for i in range(self.num_classes)]
                hf_tensor  = torch.tensor(hf_indices, device=self.device)
                projected  = logits[0, hf_tensor]
                probs      = torch.nn.functional.softmax(projected, dim=0)
                
                confidence, top_index = torch.max(probs, 0)
                top_index_val = int(top_index.item())
                confidence_val = float(confidence.item())
                
                diagnosis = self.class_labels[top_index_val]
                diagnosis = diagnosis.replace("___", " ").replace("_", " ")

                return {
                    "success": True,
                    "diagnosis": diagnosis,
                    "confidence_score": round(confidence_val, 4),
                    "visual_severity": "Moderate" if confidence_val < 0.9 else "High",
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
