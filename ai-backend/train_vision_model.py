import os
import sys
import subprocess
import json
import time
import threading

try:
    import kagglehub
except ImportError:
    print("Installing kagglehub...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
    import kagglehub

import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split


# ─────────────────────────────────────────────────────
# ⚡ GPU ACTIVITY MONITOR (runs in background thread)
# ─────────────────────────────────────────────────────
_monitor_active = False

def _gpu_monitor_loop():
    spinner = ["[GPU ▶ ◼◼◼◼◼]", "[GPU ▶ ▶◼◼◼◼]", "[GPU ▶ ▶▶◼◼◼]", "[GPU ▶ ▶▶▶◼◼]", "[GPU ▶ ▶▶▶▶◼]", "[GPU ▶ ▶▶▶▶▶]"]
    i = 0
    while _monitor_active:
        mem_used = torch.cuda.memory_reserved(0) / 1e9
        util_str = f"{mem_used:.2f}GB VRAM"
        print(f"\r  {spinner[i % len(spinner)]}  {util_str}   ", end="", flush=True)
        i += 1
        time.sleep(0.4)
    print("\r" + " " * 60 + "\r", end="", flush=True)  # Clear line when done

def start_gpu_monitor():
    global _monitor_active
    _monitor_active = True
    t = threading.Thread(target=_gpu_monitor_loop, daemon=True)
    t.start()
    return t

def stop_gpu_monitor():
    global _monitor_active
    _monitor_active = False
    time.sleep(0.5)


def download_dataset():
    print("Verifying PlantVillage dataset from Kaggle...")
    path = kagglehub.dataset_download("emmarex/plantdisease")
    dirs = os.listdir(path)
    if "PlantVillage" in dirs:
        return os.path.join(path, "PlantVillage")
    elif "plantvillage" in dirs:
        return os.path.join(path, "plantvillage")
    return path


def build_and_train_model(dataset_path, device, save_path, labels_path):
    print(f"\nScanning dataset at {dataset_path}...")

    # ── ADVANCED AUGMENTATION (key to 90%+ accuracy) ──
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    full_dataset = datasets.ImageFolder(root=dataset_path, transform=train_transform)

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    val_dataset.dataset.transform = val_transform

    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True, pin_memory=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=64, shuffle=False, pin_memory=True, num_workers=2)

    num_classes = len(full_dataset.classes)
    print(f"Dataset ready: {len(full_dataset)} images across {num_classes} disease classes.\n")

    print("Building PyTorch MobileNetV2 model...")
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)

    # ── PHASE 1: Freeze backbone, train only head ──
    for param in model.parameters():
        param.requires_grad = False

    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=1e-3)

    TARGET_ACCURACY = 90.0
    MAX_EPOCHS = 15
    best_val_acc = 0.0

    print(f"Strategy: Targeting {TARGET_ACCURACY}% validation accuracy | Max epochs: {MAX_EPOCHS}")
    print(f"Phase 1 (Epochs 1-5): Training classifier head only...\n")

    for epoch in range(MAX_EPOCHS):
        # ── PHASE 2: Unfreeze top layers after epoch 5 for fine-tuning ──
        if epoch == 5:
            print("\n>> PHASE 2: Unfreezing top backbone layers for fine-tuning...")
            for name, param in model.named_parameters():
                if "features.17" in name or "features.18" in name:
                    param.requires_grad = True
            optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4)
            print(">> Switched to fine-tuning mode with lr=1e-4\n")

        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        start_time = time.time()

        print(f"──────── Epoch [{epoch+1}/{MAX_EPOCHS}] ────────")
        monitor_thread = start_gpu_monitor()

        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        stop_gpu_monitor()
        train_acc = 100.0 * correct / total

        # ── VALIDATION ──
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc = 100.0 * val_correct / val_total
        epoch_time = time.time() - start_time

        print(f"  Train Acc: {train_acc:.2f}%  |  Val Acc: {val_acc:.2f}%  |  Time: {epoch_time:.0f}s")

        # ── SAVE BEST MODEL CHECKPOINT ──
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), save_path)
            print(f"  ✅ New Best Val Acc: {best_val_acc:.2f}% → Saved best checkpoint!")

        if val_acc >= TARGET_ACCURACY:
            print(f"\n🎯 TARGET ACCURACY {TARGET_ACCURACY}% REACHED at Epoch {epoch+1}! Stopping early.")
            break

    # Save labels after training
    labels_map = {i: cls_name for i, cls_name in enumerate(full_dataset.classes)}
    with open(labels_path, 'w') as f:
        json.dump(labels_map, f)

    print(f"\n✅ Best model weights saved to:  {save_path}")
    print(f"✅ Class labels saved to:        {labels_path}")
    print(f"   Best Validation Accuracy: {best_val_acc:.2f}%")
    print("\n🚀 Your Flask backend will auto-detect this model on next startup!")


if __name__ == "__main__":
    print("=" * 55)
    print("  Kisan AI Shield — Strict GPU Trainer (PyTorch)")
    print("=" * 55)

    # STRICT GPU ENFORCEMENT
    if not torch.cuda.is_available():
        raise RuntimeError(
            "\n🛑 STRICT GPU MODE: No CUDA GPU detected. "
            "Training aborted to prevent slow CPU runs.\n"
            "Ensure your NVIDIA CUDA drivers are installed."
        )

    device = torch.device("cuda")
    gpu_name = torch.cuda.get_device_name(0)
    total_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"\n✅ GPU ENGAGED : {gpu_name} ({total_mem:.1f} GB VRAM)")
    print(f"   CUDA Version : {torch.version.cuda}")
    print(f"   PyTorch      : {torch.__version__}\n")

    # ── SMART SKIP: Don't retrain if a checkpoint already exists and is fresh ──
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "models"))
    os.makedirs(models_dir, exist_ok=True)
    save_path = os.path.join(models_dir, "crop_disease_weights.pth")
    labels_path = os.path.join(models_dir, "class_labels.json")

    if os.path.exists(save_path) and os.path.exists(labels_path):
        print(f"⚡ CHECKPOINT DETECTED: {save_path}")
        user_input = input("   A trained model already exists. Re-train? (y/N): ").strip().lower()
        if user_input != 'y':
            print("✅ Skipping training. Using saved checkpoint for inference. Exiting.")
            exit(0)
        print("Re-training from scratch...\n")

    ds_path = download_dataset()
    build_and_train_model(ds_path, device, save_path, labels_path)
