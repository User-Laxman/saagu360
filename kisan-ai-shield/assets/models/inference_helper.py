"""
Flask inference helper for the HuggingFace PlantVillage model.
Import this in your Flask route that handles disease prediction.

Usage:
    from inference_helper import load_model, predict

    model, processor, local_to_hf, local_classes = load_model(PTH_PATH)
    disease, confidence = predict(model, processor, local_to_hf,
                                  local_classes, image_path_or_pil)
"""
import torch
import torch.nn.functional as F
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def load_model(pth_path):
    checkpoint = torch.load(pth_path, map_location=DEVICE)
    model = AutoModelForImageClassification.from_pretrained(
        checkpoint["hf_model_id"]
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE).eval()
    processor    = AutoImageProcessor.from_pretrained(checkpoint["hf_model_id"])
    local_to_hf  = checkpoint["local_to_hf"]
    local_classes = checkpoint["local_classes"]
    return model, processor, local_to_hf, local_classes

def predict(model, processor, local_to_hf, local_classes, image_input, top_k=3):
    """
    image_input: file path (str) or PIL Image
    Returns list of (class_name, confidence_percent) sorted by confidence desc.
    """
    if isinstance(image_input, str):
        img = Image.open(image_input).convert("RGB")
    else:
        img = image_input.convert("RGB")

    inputs  = processor(images=img, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        logits = model(**inputs).logits          # (1, 38)

    num_local = len(local_classes)
    hf_indices = [local_to_hf.get(i, 0) for i in range(num_local)]
    hf_tensor  = torch.tensor(hf_indices, device=DEVICE)
    projected  = logits[0, hf_tensor]           # (num_local,)
    probs      = F.softmax(projected, dim=0)

    top_indices = probs.topk(min(top_k, num_local)).indices.tolist()
    results = [
        (local_classes[i], round(probs[i].item() * 100, 2))
        for i in top_indices
    ]
    return results
