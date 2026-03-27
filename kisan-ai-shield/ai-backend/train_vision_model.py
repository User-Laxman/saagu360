import os
import sys
import subprocess
import json
import time
import pickle
import threading
import numpy as np

try:
    import kagglehub
except ImportError:
    print("Installing kagglehub...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
    import kagglehub

import torch
import torch.nn as nn
import torch.optim as optim
from torch.amp import GradScaler, autocast
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from PIL import Image


# ─────────────────────────────────────────────────────
# ⚡ GPU ACTIVITY MONITOR (background thread)
# ─────────────────────────────────────────────────────
_monitor_active = False

def _gpu_monitor_loop():
    spinner = ["[GPU ▶ ◼◼◼◼◼]", "[GPU ▶ ▶◼◼◼◼]", "[GPU ▶ ▶▶◼◼◼]",
               "[GPU ▶ ▶▶▶◼◼]", "[GPU ▶ ▶▶▶▶◼]", "[GPU ▶ ▶▶▶▶▶]"]
    i = 0
    while _monitor_active:
        mem_used = torch.cuda.memory_reserved(0) / 1e9
        print(f"\r  {spinner[i % len(spinner)]}  {mem_used:.2f}GB VRAM   ", end="", flush=True)
        i += 1
        time.sleep(0.4)
    print("\r" + " " * 60 + "\r", end="", flush=True)

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


# ─────────────────────────────────────────────────────
# 🔀 MIXUP AUGMENTATION (Phase 2 only)
# ─────────────────────────────────────────────────────
def mixup_data(x, y, alpha=0.2):
    """
    WHY only in Phase 2:
    During Phase 1 the backbone is frozen — all features are fixed ImageNet representations.
    Mixing labels before the head has even learned to cluster these features adds noise
    without benefit. Mixup is powerful only after the model has a working feature space.
    """
    lam = np.random.beta(alpha, alpha) if alpha > 0 else 1.0
    index = torch.randperm(x.size(0), device=x.device)
    return lam * x + (1 - lam) * x[index], y, y[index], lam

def mixup_criterion(criterion, pred, y_a, y_b, lam):
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)


# ─────────────────────────────────────────────────────
# 📦 PER-SPLIT TRANSFORM WRAPPER
# ─────────────────────────────────────────────────────
class TransformSubset(torch.utils.data.Dataset):
    """
    Applies independent transforms per split without mutating the shared base dataset.
    """
    def __init__(self, indices, transform, samples):
        self.indices   = indices
        self.transform = transform
        self.samples   = samples

    def __len__(self):
        return len(self.indices)

    def __getitem__(self, idx):
        img_path, label = self.samples[self.indices[idx]]
        img = Image.open(img_path).convert("RGB")
        return self.transform(img), label


# ─────────────────────────────────────────────────────
# 💾 SAVE AS BOTH .PTH AND .PKL
# ─────────────────────────────────────────────────────
def save_checkpoint(model, epoch, val_acc, num_classes, save_path):
    """
    .pth  — state dict only (Flask backend loads this, format unchanged)
    .pkl  — full model object (portable, usable without architecture code)
    """
    torch.save({
        'epoch': epoch,
        'model_state_dict': model.state_dict(),
        'val_acc': val_acc,
        'num_classes': num_classes,
        'architecture': 'efficientnet_b0',
    }, save_path)

    pkl_path = save_path.replace('.pth', '_full.pkl')
    model.eval()
    model_cpu = model.cpu()
    with open(pkl_path, 'wb') as f:
        pickle.dump({
            'model': model_cpu,
            'val_acc': val_acc,
            'num_classes': num_classes,
            'architecture': 'efficientnet_b0',
        }, f, protocol=pickle.HIGHEST_PROTOCOL)
    model.cuda()
    return pkl_path


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

    # ────────────────────────────────────────────────────────────────────
    # TRANSFORM STRATEGY — Two-phase design:
    #
    # Phase 1 (frozen backbone): MINIMAL transforms only.
    #   WHY: The backbone is frozen — features don't change.
    #   Heavy augmentation just makes the head's job harder without
    #   giving it more useful signal. Goal: fast convergence of the
    #   linear head on fixed ImageNet features. Epoch time ~60–80s.
    #
    # Phase 2 (full fine-tuning): STRONG augmentation.
    #   WHY: Now the backbone can adapt. Augmentation prevents
    #   overfitting and forces the model to learn robust features.
    # ────────────────────────────────────────────────────────────────────
    phase1_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    phase2_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.3, scale=(0.02, 0.1)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    base_dataset = datasets.ImageFolder(root=dataset_path)
    num_classes  = len(base_dataset.classes)

    train_size = int(0.8 * len(base_dataset))
    val_size   = len(base_dataset) - train_size
    train_subset, val_subset = random_split(
        base_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    train_indices = list(train_subset.indices)
    val_indices   = list(val_subset.indices)

    val_dataset = TransformSubset(val_indices, val_transform, base_dataset.samples)

    # ────────────────────────────────────────────────────────────────────
    # DATALOADER — num_workers on Windows:
    #
    # Windows uses "spawn" for multiprocessing (not "fork" like Linux).
    # Each worker relaunches the full Python interpreter. With a custom
    # Dataset class, this causes extreme startup lag and often hangs.
    # num_workers=0 (main-process loading) is consistently faster on
    # Windows for datasets stored on local disk.
    #
    # On Linux/Mac: change NUM_WORKERS to 4 for a meaningful speedup.
    # ────────────────────────────────────────────────────────────────────
    NUM_WORKERS = 0   # Windows-safe. Use 4 on Linux/Mac.
    BATCH_SIZE  = 64  # Safe for 4GB VRAM + AMP. EfficientNet-B0 forward is lightweight.

    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False,
                            pin_memory=True, num_workers=NUM_WORKERS)

    print(f"Dataset: {len(base_dataset)} images | {num_classes} classes")
    print(f"Train: {len(train_indices)} | Val: {len(val_indices)}")
    print(f"Batch: {BATCH_SIZE} | Workers: {NUM_WORKERS} (Windows-safe)\n")

    # ── MODEL ──
    print("Building EfficientNet-B0...")
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.DEFAULT)

    for param in model.parameters():
        param.requires_grad = False

    in_features = model.classifier[1].in_features  # 1280

    # Phase 1: simple linear head — fast convergence on frozen features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features, num_classes),
    )
    model = model.to(device)

    scaler = GradScaler('cuda')
    torch.backends.cudnn.benchmark = True

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)

    TARGET_ACC     = 90.0
    STOP_ACC       = 95.0
    MAX_EPOCHS     = 25
    EARLY_STOP_PAT = 5
    PHASE2_EPOCH   = 6    # Epochs of head-only training before full fine-tune

    best_val_acc     = 0.0
    patience_counter = 0

    # Phase 1: Adam (not AdamW) with high LR — appropriate for a fresh linear layer
    PHASE1_LR = 1e-2
    optimizer = optim.Adam(model.classifier.parameters(), lr=PHASE1_LR)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=PHASE2_EPOCH, eta_min=1e-4)

    print(f"Target: {TARGET_ACC}% | Hard stop: {STOP_ACC}% | Max epochs: {MAX_EPOCHS}")
    print(f"Phase 1 (Epochs 1–{PHASE2_EPOCH}): Head only | Minimal aug | lr={PHASE1_LR}\n")

    # Phase 1 dataloader
    current_train_dataset = TransformSubset(train_indices, phase1_transform, base_dataset.samples)
    train_loader = DataLoader(current_train_dataset, batch_size=BATCH_SIZE, shuffle=True,
                              pin_memory=True, num_workers=NUM_WORKERS)

    for epoch in range(MAX_EPOCHS):

        # ── Transition to Phase 2 ──
        if epoch == PHASE2_EPOCH:
            print(f"\n{'='*50}")
            print(f">> PHASE 2: Full fine-tuning (all layers)")
            print(f"{'='*50}")

            for param in model.parameters():
                param.requires_grad = True

            # Upgrade to a deeper head — more capacity now that backbone adapts
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.4, inplace=True),
                nn.Linear(in_features, 512),
                nn.SiLU(),
                nn.BatchNorm1d(512),
                nn.Dropout(p=0.25),
                nn.Linear(512, num_classes),
            ).to(device)

            # Layer-wise LR: backbone 10× smaller to preserve pretrained features
            PHASE2_LR = 1e-4
            backbone_params = [p for n, p in model.named_parameters() if 'classifier' not in n]
            head_params     = list(model.classifier.parameters())

            optimizer = optim.AdamW([
                {'params': backbone_params, 'lr': PHASE2_LR * 0.1},
                {'params': head_params,     'lr': PHASE2_LR},
            ], weight_decay=1e-4)

            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=MAX_EPOCHS - PHASE2_EPOCH, eta_min=1e-7
            )

            # Switch to strong augmentation
            current_train_dataset = TransformSubset(
                train_indices, phase2_transform, base_dataset.samples
            )
            train_loader = DataLoader(current_train_dataset, batch_size=BATCH_SIZE, shuffle=True,
                                      pin_memory=True, num_workers=NUM_WORKERS)

            patience_counter = 0  # Fresh start for new phase
            print(f">> Backbone LR: {PHASE2_LR * 0.1:.1e} | Head LR: {PHASE2_LR:.1e}")
            print(f">> Strong augmentation + Mixup enabled\n")

        # ── TRAIN ──
        model.train()
        running_loss = 0.0
        correct = 0
        total   = 0
        start   = time.time()

        phase_label = "P1" if epoch < PHASE2_EPOCH else "P2"
        current_lr  = optimizer.param_groups[-1]['lr']
        print(f"──── [{phase_label}] Epoch [{epoch+1}/{MAX_EPOCHS}] | LR: {current_lr:.2e} ────")
        monitor_thread = start_gpu_monitor()

        for inputs, labels in train_loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            # Mixup ONLY in Phase 2
            use_mixup = (epoch >= PHASE2_EPOCH)
            if use_mixup:
                inputs, la, lb, lam = mixup_data(inputs, labels, alpha=0.2)

            optimizer.zero_grad(set_to_none=True)

            with autocast('cuda'):
                outputs = model(inputs)
                loss = (mixup_criterion(criterion, outputs, la, lb, lam)
                        if use_mixup else criterion(outputs, labels))

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item()
            _, predicted  = outputs.max(1)
            total         += labels.size(0)
            correct       += predicted.eq(labels).sum().item()

        stop_gpu_monitor()
        scheduler.step()

        train_acc = 100.0 * correct / total
        avg_loss  = running_loss / len(train_loader)

        # ── VALIDATE ──
        model.eval()
        val_correct = 0
        val_total   = 0
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
                with autocast('cuda'):
                    outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total   += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        val_acc    = 100.0 * val_correct / val_total
        epoch_time = time.time() - start

        print(f"  Train: {train_acc:.2f}%  |  Val: {val_acc:.2f}%  |  Loss: {avg_loss:.4f}  |  {epoch_time:.0f}s")

        # ── CHECKPOINT ──
        if val_acc > best_val_acc:
            best_val_acc     = val_acc
            patience_counter = 0
            save_checkpoint(model, epoch, val_acc, num_classes, save_path)
            print(f"  ✅ Best: {best_val_acc:.2f}% → Saved .pth + .pkl")
        else:
            patience_counter += 1
            print(f"  ⏳ No improvement ({patience_counter}/{EARLY_STOP_PAT})")

        # ── STOP CONDITIONS ──
        if val_acc >= STOP_ACC:
            print(f"\n🏆 EXCEPTIONAL: {val_acc:.2f}% ≥ {STOP_ACC}%. Stopping.")
            break
        if val_acc >= TARGET_ACC:
            print(f"\n🎯 TARGET {TARGET_ACC}% REACHED at Epoch {epoch+1}. Stopping.")
            break
        # Patience only applies in Phase 2 — Phase 1 convergence is naturally slower
        if patience_counter >= EARLY_STOP_PAT and epoch >= PHASE2_EPOCH:
            print(f"\n⛔ Early stop: no improvement for {EARLY_STOP_PAT} epochs.")
            break

    # ── SAVE CLASS LABELS ──
    labels_map = {i: cls_name for i, cls_name in enumerate(base_dataset.classes)}
    with open(labels_path, 'w') as f:
        json.dump(labels_map, f, indent=2)

    pkl_path = save_path.replace('.pth', '_full.pkl')
    print(f"\n{'='*55}")
    print(f"  TRAINING COMPLETE")
    print(f"{'='*55}")
    print(f"  Best Val Accuracy : {best_val_acc:.2f}%")
    print(f"  Weights  (.pth)   : {save_path}")
    print(f"  Model    (.pkl)   : {pkl_path}")
    print(f"  Labels   (.json)  : {labels_path}")
    print(f"{'='*55}")
    print("\n🚀 Flask backend will auto-detect this model on next startup!")


if __name__ == "__main__":
    print("=" * 55)
    print("  Kisan AI Shield — GPU Trainer v3 (PyTorch)")
    print("  EfficientNet-B0 | AMP | Two-phase | Fast")
    print("=" * 55)

    if not torch.cuda.is_available():
        raise RuntimeError(
            "\n🛑 No CUDA GPU detected. Training aborted.\n"
            "Ensure your NVIDIA CUDA drivers are installed."
        )

    device    = torch.device("cuda")
    gpu_name  = torch.cuda.get_device_name(0)
    total_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"\n✅ GPU      : {gpu_name} ({total_mem:.1f} GB VRAM)")
    print(f"   CUDA     : {torch.version.cuda}")
    print(f"   PyTorch  : {torch.__version__}")
    print(f"   AMP      : Enabled (float16 → ~40% less VRAM)\n")

    os.environ.setdefault("PYTORCH_CUDA_ALLOC_CONF", "expandable_segments:True")

    models_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "assets", "models")
    )
    os.makedirs(models_dir, exist_ok=True)
    save_path   = os.path.join(models_dir, "crop_disease_weights.pth")
    labels_path = os.path.join(models_dir, "class_labels.json")

    if os.path.exists(save_path) and os.path.exists(labels_path):
        print(f"⚡ CHECKPOINT DETECTED: {save_path}")
        user_input = input("   A trained model already exists. Re-train? (y/N): ").strip().lower()
        if user_input != 'y':
            print("✅ Skipping training. Using saved checkpoint. Exiting.")
            exit(0)
        print("Re-training from scratch...\n")

    ds_path = download_dataset()
    build_and_train_model(ds_path, device, save_path, labels_path)