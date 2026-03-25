import os
from ai_pipeline import pipeline

def run_local_tests():
    print("========================================")
    print("🌾 KISAN AI SHIELD - PIPELINE TESTER 🌾")
    print("========================================")

    # 1. Test the Chat/Advisory Pipeline
    print("\\n[Test 1] Testing Advisory Chat (English -> LLM -> English)")
    test_query = "What is the best time to sow tomatoes?"
    print(f"User Input: {test_query}")
    
    chat_result = pipeline.process_advisory_chat(
        raw_user_text=test_query, 
        language="en",
        lat=17.3850, # Optional: Hyderabad coordinates
        lon=78.4867
    )
    print("Result:")
    print(chat_result)
    
    # 2. Test Multilingual if target lang specified
    print("\\n[Test 2] Testing Advisory Chat (Hindi input -> LLM -> Hindi output)")
    hindi_query = "टमाटर के पौधे पीले क्यों हो रहे हैं?" # "Why are tomato plants turning yellow?"
    print(f"User Input: {hindi_query}")
    
    hi_result = pipeline.process_advisory_chat(
        raw_user_text=hindi_query,
        language="hi"
    )
    print("Result:")
    # Note: If no GEMINI_API_KEY is found, it will gracefully return the error message.
    print(hi_result)

    # 3. Test the Vision Pipeline (Mock Image Bytes)
    print("\\n[Test 3] Testing Vision Model Pipeline")
    # We will generate a tiny mock 1x1 image byte array to simulate an upload
    import io
    from PIL import Image
    mock_image = Image.new('RGB', (100, 100), color = 'green')
    img_byte_arr = io.BytesIO()
    mock_image.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()
    
    vision_result = pipeline.process_plant_image(img_bytes)
    print("Result:")
    print(vision_result)
    
    print("\\n========================================")
    print("Tests Complete!")

if __name__ == "__main__":
    # Ensure you set your API keys here before running this file if you want real data:
    # os.environ["GEMINI_API_KEY"] = "your_actual_api_key_here"
    run_local_tests()
