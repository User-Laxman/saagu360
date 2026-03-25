import speech_recognition as sr
import os

def transcribe_audio_file(audio_path, language="en-IN"):
    '''
    Transcribes an audio file (e.g., captured from Expo React Native) to text.
    Can be configured to transcribe regional audio if standard language codes are passed 
    (e.g., 'hi-IN' for Hindi, 'te-IN' for Telugu).
    '''
    recognizer = sr.Recognizer()
    
    if not os.path.exists(audio_path):
        return {"error": "Audio file not found."}
        
    try:
        with sr.AudioFile(audio_path) as source:
            # Clean noise and record
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio_data = recognizer.record(source)
            
            # Using Google Web Speech API for simplicity (requires internet)
            # In a production environment, Whisper API is recommended for better accuracy
            text = recognizer.recognize_google(audio_data, language=language)
            return {"text": text}
            
    except sr.UnknownValueError:
        return {"error": "Speech was unintelligible or empty."}
    except sr.RequestError as e:
        return {"error": f"API request error: {e}"}

# Note: The client (React Native) should send a .wav file via FormData to the Flask 
# backend. The backend will save it temporarily to a path, run this function, 
# and delete the file.
