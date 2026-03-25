import os
from dotenv import load_dotenv

# Ensure environment variables (like API keys and model paths) are loaded
load_dotenv()

from ai_pipeline import pipeline
import tkinter as tk
from tkinter import filedialog

def run_laptop_tester():
    print("========================================")
    print("🌾 KISAN AI SHIELD - LAPTOP VISION 🌾")
    print("========================================")
    
    # Suppress the root tkinter window to just show the file dialog
    root = tk.Tk()
    root.withdraw()
    
    # Force the dialog to appear on top of other windows
    root.attributes('-topmost', True)
    
    # Open native Windows file explorer dialog
    print("\nAwaiting file selection... (Check for the popup window!)")
    file_path = filedialog.askopenfilename(
        title="Select a Crop Leaf Image",
        filetypes=[("Image files", "*.jpg *.jpeg *.png")]
    )
    
    if not file_path:
        print("No image selected. Process cancelled.")
        return
        
    print(f"\nProcessing Image: {os.path.basename(file_path)}")
    print("Running through the AI Vision Engine...")
    
    # Read the image file as binary bytes
    with open(file_path, "rb") as f:
        image_bytes = f.read()
        
    # Send directly to the unified pipeline
    result = pipeline.process_plant_image(image_bytes)
    
    # Display Results
    print("\n--- 🔬 AI DIAGNOSIS ---")
    if result.get("success"):
        print(f"Disease Name : {result.get('diagnosis')}")
        confidence_percent = result.get('confidence_score', 0) * 100
        print(f"Confidence   : {confidence_percent:.2f}%")
        print(f"Severity     : {result.get('visual_severity')}")
        print(f"Recommendation: {result.get('recommendation')}")
    else:
        print(f"🛑 ERROR: {result.get('error')}")

if __name__ == "__main__":
    # Ensure TF warning suppression for cleaner terminal output
    import logging
    logging.getLogger('tensorflow').setLevel(logging.ERROR)
    
    run_laptop_tester()
