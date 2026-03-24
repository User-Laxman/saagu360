import fitz
import sys
import os

def extract_text(pdf_path):
    print(f"--- Extracting {os.path.basename(pdf_path)} ---")
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    print(text.strip())
    print("-" * 50)

if __name__ == "__main__":
    extract_text("Complete_info.pdf")
    extract_text("Separate_modules.pdf")
