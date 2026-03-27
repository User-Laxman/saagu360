import os
from torchvision import datasets

def analyze_dataset(path):
    dataset = datasets.ImageFolder(path)
    counts = {}
    for _, idx in dataset.samples:
        class_name = dataset.classes[idx]
        counts[class_name] = counts.get(class_name, 0) + 1
    
    print("-" * 30)
    print(f"{'Class Name':<20} | {'Count':<6}")
    print("-" * 30)
    for name, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
        print(f"{name:<20} | {count:<6}")
    print("-" * 30)
    print(f"Total: {len(dataset)} images across {len(dataset.classes)} classes.")

if __name__ == "__main__":
    # Based on train_vision_model.py's download_dataset logic
    import kagglehub
    path = kagglehub.dataset_download("emmarex/plantdisease")
    ds_path = os.path.join(path, "PlantVillage") if "PlantVillage" in os.listdir(path) else path
    analyze_dataset(ds_path)
