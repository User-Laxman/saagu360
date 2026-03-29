import io
import json
import os
import re
import base64
import requests
from PIL import Image, ImageEnhance, ImageFilter

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    from torchvision import transforms, models
except ImportError:
    torch = None

# ─────────────────────────────────────────────────────────────────────────────
# CONFIDENCE THRESHOLDS
#   DISEASE_THRESHOLD  — minimum confidence to accept a disease prediction
#   HEALTHY_THRESHOLD  — stricter bar for "healthy" (generic green triggers it)
#   MARGIN_THRESHOLD   — minimum gap between rank-1 and rank-2 (uncertainty guard)
# ─────────────────────────────────────────────────────────────────────────────
DISEASE_THRESHOLD = 0.65   # was 0.40 — far too permissive
HEALTHY_THRESHOLD = 0.75   # harder to call a crop "healthy" without high confidence
MARGIN_THRESHOLD  = 0.15   # if top-2 are within this range, we're uncertain


def _preprocess_mobile_image(img: Image.Image) -> Image.Image:
    """
    Enhance a mobile-camera photo to better match the PlantVillage distribution.
    PlantVillage images are: lab-lit, white background, single leaf.
    Mobile photos are: natural light, cluttered backgrounds, sometimes blurry.

    Steps:
      1. Boost contrast to normalise field lighting conditions.
      2. Sharpen to compensate for hand-held motion blur.
      3. Center-crop to 80% to discard distracting background edges.
    """
    # 1. Mild contrast boost
    img = ImageEnhance.Contrast(img).enhance(1.25)

    # 2. Gentle sharpening pass
    img = img.filter(ImageFilter.SHARPEN)

    # 3. Center-crop: remove 10% border on each side
    w, h = img.size
    mw, mh = int(w * 0.10), int(h * 0.10)
    img = img.crop((mw, mh, w - mw, h - mh))

    return img


class DiseaseVisionModel:
    '''
    Production-ready Vision Pipeline for Plant Disease Detection (PyTorch Version).

    Improvements over v1:
      - Softmax applied over ALL 38 HF logits before local-class projection
        (prevents artificially inflated confidence on subset predictions).
      - Unmatched labels (local_to_hf == -1) are filtered out of inference
        instead of silently routing to HF index 0.
      - Confidence thresholds raised: 0.65 for diseases, 0.75 for healthy.
      - Top-2 margin check: flags uncertain predictions even if below threshold.
      - Mobile-camera preprocessing applied before HF processor.
      - Severity scale uses 3 tiers: Low / Moderate / High.
    '''

    def __init__(self, model_path=None):
        default_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "assets", "models",
            "crop_disease_weights.pth"
        )
        self.model_path = model_path or os.environ.get(
            "VISION_MODEL_PATH", os.path.abspath(default_path)
        )
        self.model_loaded = False

        # Determine compute device
        self.device = torch.device(
            'cuda' if torch and torch.cuda.is_available() else 'cpu'
        )

        # Fallback torchvision transform (only used if HF processor unavailable)
        if torch:
            self._fallback_transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])

        # Load class label map generated during training
        labels_path = os.path.join(
            os.path.dirname(self.model_path), "class_labels.json"
        )
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                mapping = json.load(f)
            min_key = min(int(k) for k in mapping.keys())
            max_key = max(int(k) for k in mapping.keys())
            self.class_labels = [mapping[str(i)] for i in range(min_key, max_key + 1)]
            self.num_classes   = len(self.class_labels)
        else:
            self.class_labels = []
            self.num_classes   = 38

        self._load_model()

        self.api_key = (
            os.environ.get("OPENROUTER_API_KEY") or os.environ.get("AI_API_KEY")
        )
        if not self.model_loaded and self.api_key:
            self.model_name = "stepfun/step-3.5-flash:free"
            print(f"[VisionEngine] Initialized OpenRouter fallback ({self.model_name}).")

    # ─────────────────────────────────────────────────────────────────────────
    def _load_model(self):
        '''Loads the HuggingFace MobileNetV2 model from the saved checkpoint.'''
        if (torch and self.model_path
                and os.path.exists(self.model_path)
                and len(self.class_labels) > 0):
            try:
                checkpoint = torch.load(self.model_path, map_location=self.device)
                hf_model_id = checkpoint.get(
                    "hf_model_id",
                    "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
                )

                from transformers import (
                    MobileNetV2ImageProcessor,
                    MobileNetV2ForImageClassification,
                )
                self.processor = MobileNetV2ImageProcessor.from_pretrained(hf_model_id)
                self.model     = MobileNetV2ForImageClassification.from_pretrained(hf_model_id)

                if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                    self.model.load_state_dict(checkpoint['model_state_dict'])
                else:
                    self.model.load_state_dict(checkpoint)

                self.model = self.model.to(self.device).eval()

                # ── FIX #4: Build a filtered valid-pairs list excluding unmatched labels ──
                raw_local_to_hf = checkpoint.get("local_to_hf", {})
                # raw_local_to_hf keys may be int or str depending on how they were saved
                self.valid_pairs = []   # list of (local_idx, hf_idx)
                for local_idx in range(self.num_classes):
                    hf_idx = raw_local_to_hf.get(local_idx,
                             raw_local_to_hf.get(str(local_idx), -1))
                    if hf_idx >= 0:
                        self.valid_pairs.append((local_idx, hf_idx))

                if not self.valid_pairs:
                    raise ValueError("No valid label mappings found in checkpoint.")

                self.model_loaded = True
                print(
                    f"[VisionEngine] HF Model loaded on {str(self.device).upper()} "
                    f"— {len(self.valid_pairs)}/{self.num_classes} classes mapped."
                )
            except Exception as e:
                print(f"[VisionEngine] Failed to load HF model: {e}")
                self.model_loaded = False
        else:
            reason = (
                "PyTorch not installed" if not torch
                else "model weights or class labels missing"
            )
            print(f"[VisionEngine] {reason}. Serving cloud fallback.")
            self.model_loaded = False

    # ─────────────────────────────────────────────────────────────────────────
    def _infer_local(self, img: Image.Image):
        """
        Runs the local HF model and returns (diagnosis_str, confidence_float, top2_margin).

        Key changes vs original:
          - Mobile preprocessing applied first.
          - Softmax computed over ALL 38 HF outputs (calibrated probabilities).
          - Only valid (matched) local class indices are considered.
          - Returns top-2 margin so the caller can detect uncertain predictions.
        """
        # FIX #5 — Mobile preprocessing before HF processor
        img = _preprocess_mobile_image(img)

        inputs = self.processor(images=img, return_tensors="pt").to(self.device)

        with torch.no_grad():
            logits = self.model(**inputs).logits     # shape: (1, 38)

        # FIX #2 — Apply softmax over ALL 38 classes first (calibrated probabilities)
        all_probs = F.softmax(logits[0], dim=0)      # shape: (38,)

        # FIX #4 — Only use valid (matched) local classes
        local_indices = torch.tensor(
            [p[0] for p in self.valid_pairs], device=self.device
        )
        hf_indices = torch.tensor(
            [p[1] for p in self.valid_pairs], device=self.device
        )

        local_probs = all_probs[hf_indices]          # shape: (num_valid,)

        # FIX #3 — Top-2 to compute margin
        k = min(2, len(local_probs))
        top_vals, top_pos = torch.topk(local_probs, k)

        top1_conf  = float(top_vals[0].item())
        top2_conf  = float(top_vals[1].item()) if k > 1 else 0.0
        margin     = top1_conf - top2_conf

        # Map position back to actual local class index
        real_local_idx = int(local_indices[top_pos[0]].item())
        diagnosis = self.class_labels[real_local_idx]
        diagnosis = diagnosis.replace("___", " ").replace("_", " ")

        return diagnosis, top1_conf, margin

    # ─────────────────────────────────────────────────────────────────────────
    def _severity(self, confidence: float) -> str:
        """3-tier severity scale based on model confidence."""
        if confidence >= 0.85:
            return "High"
        elif confidence >= 0.65:
            return "Moderate"
        return "Low"

    # ─────────────────────────────────────────────────────────────────────────
    def predict(self, image_bytes):
        """Main integration point for image analysis."""
        try:
            if self.model_loaded:
                # ── LOCAL HF MODEL PATH ──────────────────────────────────────
                img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
                diagnosis, confidence_val, margin = self._infer_local(img)

                is_healthy = "healthy" in diagnosis.lower()

                # FIX #1 & #6 — Dual thresholds: stricter for healthy predictions
                threshold = HEALTHY_THRESHOLD if is_healthy else DISEASE_THRESHOLD

                # FIX #3 — Margin guard: flag uncertain predictions
                if confidence_val < threshold or margin < MARGIN_THRESHOLD:
                    reason = (
                        "Model is uncertain between multiple candidates."
                        if margin < MARGIN_THRESHOLD
                        else "Confidence too low for a reliable diagnosis."
                    )
                    print(
                        f"[VisionEngine] Rejected prediction '{diagnosis}' "
                        f"(conf={confidence_val:.3f}, margin={margin:.3f})"
                    )
                    return {
                        "success": True,
                        "diagnosis": "Unable to identify",
                        "confidence_score": round(confidence_val, 4),
                        "visual_severity": "Unknown",
                        "recommendation": (
                            f"{reason} "
                            "Please retake the photo in natural daylight with the "
                            "affected leaf clear and centered in the frame."
                        )
                    }

                print(
                    f"[VisionEngine] Prediction accepted: '{diagnosis}' "
                    f"(conf={confidence_val:.3f}, margin={margin:.3f})"
                )
                return {
                    "success": True,
                    "diagnosis": diagnosis,
                    "confidence_score": round(confidence_val, 4),
                    "visual_severity": self._severity(confidence_val),
                    "recommendation": (
                        "Your crop appears healthy! Keep monitoring regularly."
                        if is_healthy
                        else f"Please refer to the Ask AI chatbot for treatment advice regarding {diagnosis}."
                    )
                }

            elif getattr(self, 'model_name', None):
                # ── OPENROUTER CLOUD FALLBACK ────────────────────────────────
                print(f"[VisionEngine] Routing image to OpenRouter ({self.model_name}).")
                base64_image = base64.b64encode(image_bytes).decode('utf-8')
                prompt = (
                    "You are a plant pathologist. Analyze this crop leaf image carefully. "
                    "Identify the specific disease present, or state 'Healthy' if no disease is visible. "
                    "Respond ONLY with a valid JSON object with exactly two keys: "
                    "'diagnosis' (string, specific disease name) and "
                    "'confidence' (float 0.0–1.0, your certainty). "
                    "Do NOT include markdown or explanations."
                )
                payload = {
                    "model": self.model_name,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url",
                             "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }]
                }
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json=payload, headers=headers, timeout=30
                )

                if response.status_code != 200:
                    raise Exception(f"OpenRouter API Error {response.status_code}: {response.text}")

                text  = response.json()['choices'][0]['message']['content']
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match:
                    data       = json.loads(match.group(0))
                    diagnosis  = data.get("diagnosis", "Unknown Disease")
                    confidence = float(data.get("confidence", 0.70))
                else:
                    diagnosis  = "Leaf Analysis Unclear"
                    confidence = 0.50

                is_healthy = "healthy" in diagnosis.lower()
                return {
                    "success": True,
                    "diagnosis": diagnosis,
                    "confidence_score": round(confidence, 4),
                    "visual_severity": self._severity(confidence),
                    "recommendation": (
                        "Your crop appears healthy! Keep monitoring regularly."
                        if is_healthy
                        else f"Please ask the Ask AI chatbot about treatment for {diagnosis}."
                    )
                }

            else:
                return {
                    "success": False,
                    "error": "Vision system offline — model not loaded and no API key configured."
                }

        except Exception as e:
            print(f"[VisionEngine] Error processing image: {e}")
            return {"success": False, "error": str(e)}
