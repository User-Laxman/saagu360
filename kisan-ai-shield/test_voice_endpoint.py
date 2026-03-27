import requests
import time
import os
import subprocess

# 1. Start the Flask server temporarily
print("Starting Flask server...")
flask_process = subprocess.Popen(
    ["python", "ai-backend/app.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

try:
    print("Waiting for server to start...")
    time.sleep(10) # Give flask time to load models

    # 2. Test the /voice-chat endpoint with a dummy test audio file if one exists
    # We will just test if speech_recognition can handle a very short generated wav
    import wave
    dummy_wav = "test_voice.wav"
    with wave.open(dummy_wav, 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(44100)
        # Write 0.5s of silence
        f.writeframes(b'\x00' * 44100)

    print(f"Testing /voice-chat with {dummy_wav}...")
    with open(dummy_wav, 'rb') as f:
        files = {'audio': (dummy_wav, f, 'audio/wav')}
        data = {'language': 'en', 'lat': '17.2', 'lon': '80.1'}
        response = requests.post("http://127.0.0.1:5000/voice-chat", files=files, data=data)
        
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

    os.remove(dummy_wav)
finally:
    flask_process.terminate()
    flask_process.wait()
    print("Flask server terminated.")
