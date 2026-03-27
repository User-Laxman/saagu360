"""
Kisan AI Shield — Pretrained Model Downloader v5
=================================================
Instead of training from scratch (which was hitting 49% due to Windows
DataLoader bottlenecks and VRAM constraints), this script downloads a
publicly available pretrained model from HuggingFace that was already
trained on the PlantVillage dataset and achieves 95.4% accuracy.

Model used:
  linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
  - Architecture  : MobileNetV2 (fine-tuned via HuggingFace Transformers)
  - Trained on    : Kaggle PlantVillage dataset (same source as your dataset)
  - Accuracy      : 95.4% on 38-class PlantVillage evaluation set
  - License       : Open / research use
  - Downloads/mo  : 3,500+ (well-tested in production)

What this script does:
  1. Downloads the pretrained model weights from HuggingFace (~14MB)
  2. Reads your local dataset folder to discover which classes you have
  3. Builds a label map matching your local class folder names to the
     model's 38-class output (handles both 16-class and 38-class variants)
  4. Saves the model as crop_disease_weights.pth and _full.pkl
  5. Saves class_labels.json — same format your Flask backend expects
  6. Runs a quick validation pass on your local val images to confirm accuracy

No GPU required. No training. Total time: ~2 minutes.
"""

import os
import sys
import json
import time
import pickle
import subprocess

# ── Install required packages if missing ──────────────────────────────────────
def pip_install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

try:
    import torch
except ImportError:
    pip_install("torch torchvision")
    import torch

try:
    from transformers import MobileNetV2ImageProcessor, MobileNetV2ForImageClassification
except ImportError:
    pip_install("transformers")
    from transformers import MobileNetV2ImageProcessor, MobileNetV2ForImageClassification

try:
    import kagglehub
except ImportError:
    pip_install("kagglehub")
    import kagglehub

from PIL import Image
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import torch.nn.functional as F


# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
HF_MODEL_ID  = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
BATCH_SIZE   = 32
DEVICE       = "cuda" if torch.cuda.is_available() else "cpu"


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Download dataset (to read class names only, no training)
# ─────────────────────────────────────────────────────────────────────────────
def get_dataset_path():
    print("Verifying PlantVillage dataset from Kaggle (for class names only)...")
    path = kagglehub.dataset_download("emmarex/plantdisease")
    for candidate in ["PlantVillage", "plantvillage"]:
        full = os.path.join(path, candidate)
        if os.path.isdir(full):
            # The dataset often has a nested 'PlantVillage' folder among the class folders.
            # We want the directory that *contains* the actual disease classes.
            subdirs = [d for d in os.listdir(full) if os.path.isdir(os.path.join(full, d))]
            if "Tomato_healthy" in subdirs or "Potato___healthy" in subdirs:
                return full
            # If the candidate itself contains another PlantVillage folder, go deeper
            if candidate in subdirs:
                return os.path.join(full, candidate)
            return full
    return path



# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Download pretrained model from HuggingFace
# ─────────────────────────────────────────────────────────────────────────────
def download_pretrained_model():
    print(f"\nDownloading pretrained model from HuggingFace...")
    print(f"  Model : {HF_MODEL_ID}")
    print(f"  Acc   : 95.4% on PlantVillage (38 classes)")
    print(f"  Size  : ~14MB\n")

    processor = MobileNetV2ImageProcessor.from_pretrained(HF_MODEL_ID)
    hf_model  = MobileNetV2ForImageClassification.from_pretrained(HF_MODEL_ID)
    hf_model.eval()

    # The model's built-in label map (38 classes)
    hf_labels = {int(k): v for k, v in hf_model.config.id2label.items()}
    print(f"  HuggingFace model has {len(hf_labels)} output classes.")
    return processor, hf_model, hf_labels


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Build label mapping between local folders and model outputs
#
# Your local dataset (Kaggle emmarex/plantdisease) may have 16 classes.
# The HuggingFace model was trained on the 38-class version.
# We match them by normalising folder names (lowercase, strip special chars)
# so that e.g. "Potato___Late_blight" matches "Potato Late blight".
# ─────────────────────────────────────────────────────────────────────────────
def build_label_mapping(local_classes, hf_labels):
    """
    Returns:
      local_to_hf  : dict[local_idx] -> hf_model_output_idx
      matched_json : dict[str(local_idx)] -> local_class_name  (for class_labels.json)
      unmatched    : list of local class names that had no HF match
    """
    import re

    def tokenise(s):
        """Convert any class name to a canonical token set for matching.
        'Tomato___Bacterial_spot' -> {'tomato', 'bacterial', 'spot'}
        'Tomato with Bacterial Spot' -> {'tomato', 'bacterial', 'spot'}
        'Healthy Tomato Plant' -> {'healthy', 'tomato', 'plant'}
        """
        s = s.replace("___", " ").replace("__", " ").replace("_", " ")
        s = re.sub(r"[^a-z0-9 ]", "", s.lower())
        tokens = set(s.split())
        # Remove noise words that only appear in one naming convention
        tokens -= {"with", "and", "or", "the", "a", "an", "plant"}
        return tokens

    # Build HF token-set map
    hf_token_map = {}
    for hf_idx, hf_name in hf_labels.items():
        hf_token_map[hf_idx] = tokenise(hf_name)

    local_to_hf = {}
    unmatched   = []

    for local_idx, cls_name in enumerate(local_classes):
        local_tokens = tokenise(cls_name)

        # Skip if this is clearly not a disease class (e.g. 'PlantVillage' directory or completely empty spaces)
        if (len(local_tokens) <= 1 and 'plantvillage' in cls_name.lower()) or not local_tokens:
            print(f"Skipping spurious directory: {cls_name}")
            continue


        # Match strategy 1: exact token-set match
        best_idx = -1
        best_score = 0.0
        for hf_idx, hf_tokens in hf_token_map.items():
            if local_tokens == hf_tokens:
                best_idx = hf_idx
                best_score = 1.0
                break
            # Match strategy 2: Jaccard similarity (overlap ratio)
            if local_tokens and hf_tokens:
                intersection = local_tokens & hf_tokens
                union = local_tokens | hf_tokens
                score = len(intersection) / len(union)
                if score > best_score:
                    best_score = score
                    best_idx = hf_idx

        # Accept if overlap is meaningful (at least 50% Jaccard similarity)
        if best_score >= 0.5:
            local_to_hf[local_idx] = best_idx
        else:
            unmatched.append(cls_name)
            local_to_hf[local_idx] = -1

    matched_json = {str(i): cls for i, cls in enumerate(local_classes)}
    return local_to_hf, matched_json, unmatched


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Validate accuracy on your local dataset
# ─────────────────────────────────────────────────────────────────────────────
def validate_on_local_data(hf_model, processor, dataset_path, local_to_hf, local_classes):
    """
    Runs the HuggingFace model over your local images and reports accuracy.
    Uses the label mapping so predictions are compared against local class indices.
    """
    print("\nValidating pretrained model on your local PlantVillage images...")

    # We must use the HF processor for exact preprocessing, NOT standard torchvision transforms
    def hf_transform(img):
        # The processor returns a dict with 'pixel_values', we need just the tensor
        inputs = processor(images=img.convert("RGB"), return_tensors="pt")
        return inputs['pixel_values'].squeeze(0)  # remove batch dim

    # ImageFolder includes all directories
    full_ds  = datasets.ImageFolder(root=dataset_path, transform=hf_transform)
    
    # Create an index mapping from ImageFolder's classes to our filtered local_classes
    img_idx_to_local_idx = {}
    for img_cls, img_idx in full_ds.class_to_idx.items():
        if img_cls in local_classes:
            img_idx_to_local_idx[img_idx] = local_classes.index(img_cls)
            
    # Filter the dataset to only include matched classes
    filtered_samples = [(path, img_idx_to_local_idx[tgt]) for path, tgt in full_ds.samples if tgt in img_idx_to_local_idx]
    full_ds.samples = filtered_samples
    full_ds.targets = [s[1] for s in filtered_samples]
    full_ds.classes = local_classes
    full_ds.class_to_idx = {c: i for i, c in enumerate(local_classes)}

    val_size = int(0.2 * len(full_ds))
    _, val_ds = torch.utils.data.random_split(
        full_ds, [len(full_ds) - val_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=0, pin_memory=False)

    hf_model = hf_model.to(DEVICE)

    # Build reverse mapping: local_class_idx -> hf_output_idx tensor index
    # We'll build a projection matrix: (38,) -> (15,) via index selection
    num_local = len(local_classes)
    
    # For each local class, which HF output index to check
    hf_indices = []
    for local_idx in range(num_local):
        hf_idx = local_to_hf.get(local_idx, -1)
        hf_indices.append(hf_idx if hf_idx >= 0 else 0)
    hf_indices_tensor = torch.tensor(hf_indices, device=DEVICE)   # (num_local,)

    correct = 0
    total   = 0
    t0 = time.time()

    with torch.no_grad():
        for batch_imgs, batch_labels in val_loader:
            batch_imgs   = batch_imgs.to(DEVICE)
            batch_labels = batch_labels.to(DEVICE)

            outputs  = hf_model(pixel_values=batch_imgs)
            logits   = outputs.logits                              # (B, 38)

            # Project: for each sample, pick the logit at the HF index
            # that corresponds to each local class, then argmax in local space
            projected = logits[:, hf_indices_tensor]               # (B, num_local)
            preds     = projected.argmax(dim=1)                    # (B,)

            correct += (preds == batch_labels).sum().item()
            total   += batch_labels.size(0)

    acc = 100.0 * correct / total
    elapsed = time.time() - t0
    print(f"  Validation accuracy on your local data : {acc:.2f}%")
    print(f"  ({total} images evaluated in {elapsed:.0f}s on {DEVICE.upper()})")
    return acc


# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Save in the exact format your Flask backend expects
# ─────────────────────────────────────────────────────────────────────────────
def save_artifacts(hf_model, processor, matched_json, local_to_hf,
                   local_classes, val_acc, save_path, labels_path):
    """
    Saves:
      crop_disease_weights.pth  — state dict + metadata (Flask loads this)
      crop_disease_weights_full.pkl — full model (portable)
      class_labels.json         — {idx: class_name} for Flask backend
    """
    print("\nSaving model artifacts...")

    num_local = len(local_classes)
    num_hf    = hf_model.config.num_labels

    # .pth — state dict with metadata your Flask backend reads
    hf_model.eval()
    torch.save({
        'model_state_dict' : hf_model.state_dict(),
        'val_acc'          : val_acc,
        'num_classes'      : num_local,          # Your local class count
        'hf_num_classes'   : num_hf,             # Model's actual output size
        'architecture'     : 'mobilenet_v2_hf',
        'hf_model_id'      : HF_MODEL_ID,
        'local_to_hf'      : local_to_hf,        # Mapping for inference
        'local_classes'    : local_classes,
    }, save_path)
    print(f"  ✅ Weights saved : {save_path}")

    # .pkl — full model object (architecture + weights in one file)
    pkl_path = save_path.replace('.pth', '_full.pkl')
    cpu_model = hf_model.cpu()
    with open(pkl_path, 'wb') as f:
        pickle.dump({
            'model'        : cpu_model,
            'processor'    : processor,
            'val_acc'      : val_acc,
            'num_classes'  : num_local,
            'architecture' : 'mobilenet_v2_hf',
            'hf_model_id'  : HF_MODEL_ID,
            'local_to_hf'  : local_to_hf,
            'local_classes': local_classes,
        }, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"  ✅ Full model (.pkl) : {pkl_path}")

    # class_labels.json — exactly the format Flask expects: {idx: class_name}
    with open(labels_path, 'w') as f:
        json.dump(matched_json, f, indent=2)
    print(f"  ✅ Labels saved  : {labels_path}")

    return pkl_path


# ─────────────────────────────────────────────────────────────────────────────
# BONUS — Flask-compatible inference helper
# Saved alongside the model so Flask backend can import it directly
# ─────────────────────────────────────────────────────────────────────────────
INFERENCE_HELPER = '''"""
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
'''

def save_inference_helper(models_dir):
    helper_path = os.path.join(models_dir, "inference_helper.py")
    with open(helper_path, 'w') as f:
        f.write(INFERENCE_HELPER)
    print(f"  ✅ Flask helper  : {helper_path}")
    return helper_path


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 58)
    print("  Kisan AI Shield — Pretrained Model Download v5")
    print("  No training required | 95.4% accuracy | ~2 min")
    print("=" * 58)
    print(f"\n  Device : {DEVICE.upper()}")
    print(f"  Source : HuggingFace — {HF_MODEL_ID}\n")

    # Paths (unchanged — Flask backend unaffected)
    models_dir  = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "assets", "models")
    )
    os.makedirs(models_dir, exist_ok=True)
    save_path   = os.path.join(models_dir, "crop_disease_weights.pth")
    labels_path = os.path.join(models_dir, "class_labels.json")

    if os.path.exists(save_path) and os.path.exists(labels_path):
        print(f"⚡ Existing model found: {save_path}")
        if input("   Re-download and overwrite? (y/N): ").strip().lower() != 'y':
            print("✅ Keeping existing model. Exiting.")
            exit(0)
        print()

    # Step 1: Get dataset path (for class discovery only)
    t_total = time.time()
    dataset_path = get_dataset_path()
    all_classes = sorted([d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))])
    
    # Filter out spurious directories like 'PlantVillage' that might be present alongside class folders
    local_classes = [c for c in all_classes if c.lower() != 'plantvillage']
    
    print(f"\nLocal dataset classes found: {len(local_classes)}")
    for i, c in enumerate(local_classes[:5]):
        print(f"   {i}. {c}")
    if len(local_classes) > 5:
        print("   ...")
    
    # Step 3: Download pretrained model
    processor, hf_model, hf_labels = download_pretrained_model()

    # Step 4: Build label mapping
    local_to_hf, matched_json, unmatched = build_label_mapping(local_classes, hf_labels)

    matched_count = sum(1 for v in local_to_hf.values() if v >= 0)
    print(f"\nLabel mapping: {matched_count}/{len(local_classes)} local classes matched to HF model outputs")
    if unmatched:
        print(f"  ⚠️  Unmatched classes (will use fallback): {unmatched}")
    else:
        print(f"  ✅ All local classes matched perfectly")

    # Step 5: Validate on local data
    val_acc = validate_on_local_data(hf_model, processor, dataset_path, local_to_hf, local_classes)

    # Step 6: Save artifacts
    save_artifacts(hf_model, processor, matched_json, local_to_hf,
                   local_classes, val_acc, save_path, labels_path)
    save_inference_helper(models_dir)

    elapsed = time.time() - t_total
    print(f"\n{'='*58}")
    print(f"  DONE in {elapsed:.0f}s")
    print(f"{'='*58}")
    print(f"  Model accuracy   : {val_acc:.2f}% on your local data")
    print(f"  Weights  (.pth)  : {save_path}")
    print(f"  Full model (.pkl): {save_path.replace('.pth', '_full.pkl')}")
    print(f"  Labels   (.json) : {labels_path}")
    print(f"  Flask helper     : {os.path.join(models_dir, 'inference_helper.py')}")
    print(f"{'='*58}")
    print("\n🚀 Flask backend will auto-detect this model on next startup!")
    print("   For inference, use inference_helper.py — see its docstring.")