import os
import subprocess
import sys

# 1. Ensure KaggleHub is installed for downloading datasets
try:
    import kagglehub
except ImportError:
    print("Installing kagglehub to download the dataset...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "kagglehub"])
    import kagglehub

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import json

def download_dataset():
    print("Downloading PlantVillage dataset from Kaggle...")
    # This downloads ~1GB of plant disease images to a local cache
    path = kagglehub.dataset_download("emmarex/plantdisease")
    print(f"\nDataset fully downloaded to: {path}")
    
    # Locate the interior image directory (usually has "PlantVillage" inside it)
    dirs = os.listdir(path)
    if "PlantVillage" in dirs:
        return os.path.join(path, "PlantVillage")
    elif "plantvillage" in dirs:
        return os.path.join(path, "plantvillage")
    return path # Fallback to root if it is pre-extracted

def build_and_train_model(dataset_path):
    print(f"\nScanning dataset at {dataset_path}...")
    
    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32
    
    datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        validation_split=0.2
    )

    print("Loading Training Data...")
    train_generator = datagen.flow_from_directory(
        dataset_path,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    print("Loading Validation Data...")
    val_generator = datagen.flow_from_directory(
        dataset_path,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    # 2. Build MobileNetV2 Architecture
    print("\nBuilding Lightweight MobileNetV2 model for rapid GPU acceleration...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False  # Freeze base layers for transfer learning
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    predictions = Dense(train_generator.num_classes, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    # Use CPU/GPU native optimizers
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    num_epochs = 3 # Fast demo training
    print(f"\nStarting local GPU Training for {num_epochs} Epochs...")
    
    model.fit(
        train_generator,
        epochs=num_epochs,
        validation_data=val_generator
    )
    
    # 3. Export Model and Label Dictionary
    print("\nTraining Complete! Saving models to assets directory...")
    # Navigate to kisan-ai-shield/assets/models
    models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "models"))
    os.makedirs(models_dir, exist_ok=True)
    
    save_path = os.path.join(models_dir, "crop_disease.h5")
    model.save(save_path)
    print(f"✅ Model successfully saved to {save_path}")
    
    labels_path = os.path.join(models_dir, "class_labels.json")
    labels = {v: k for k, v in train_generator.class_indices.items()}
    with open(labels_path, 'w') as f:
        json.dump(labels, f)
    print(f"✅ Class labels mapping saved to {labels_path}")
    print("\nYou can now restart your Flask backend! It will automatically detect this model!")

if __name__ == "__main__":
    import logging
    logging.getLogger('tensorflow').setLevel(logging.ERROR)
    print("=== Kisan AI Shield Local GPU Trainer ===")
    
    if len(tf.config.list_physical_devices('GPU')) > 0:
        print("✅ Nvidia GPU Detected by TensorFlow!")
    else:
        print("⚠️ No GPU detected by TF. Training will fallback to CPU.")

    ds_path = download_dataset()
    build_and_train_model(ds_path)
