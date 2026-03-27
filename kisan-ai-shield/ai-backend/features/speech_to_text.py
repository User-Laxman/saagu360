import speech_recognition as sr
import os
import tempfile
import uuid
try:
    from pydub import AudioSegment
except ImportError:
    pass

def transcribe_audio_file(audio_path, language="en-IN"):
    '''
    Transcribes an audio file (e.g., captured from Expo React Native) to text.
    Handles mobile .m4a formats by converting to .wav via pydub.
    '''
    recognizer = sr.Recognizer()
    
    if not os.path.exists(audio_path):
        return {"error": "Audio file not found."}
        
    temp_wav_path = None
    try:
        # Convert audio to WAV format required by SpeechRecognition
        audio = AudioSegment.from_file(audio_path)
        temp_wav_path = os.path.join(tempfile.gettempdir(), f"stt_temp_{uuid.uuid4().hex}.wav")
        audio.export(temp_wav_path, format="wav")
        target_audio_path = temp_wav_path
    except Exception as e:
        print(f"PyDub conversion failed (is ffmpeg installed?): {e}")
        # Fallback to trying the original file (in case it IS a wav or if ffmpeg is missing)
        target_audio_path = audio_path

    try:
        with sr.AudioFile(target_audio_path) as source:
            # Clean noise and record
            recognizer.adjust_for_ambient_noise(source, duration=0.2)
            audio_data = recognizer.record(source)
            
            # Using Google Web Speech API for simplicity (requires internet)
            text = recognizer.recognize_google(audio_data, language=language)
            return {"text": text}
            
    except sr.UnknownValueError:
        return {"error": "Speech was unintelligible or empty."}
    except sr.RequestError as e:
        return {"error": f"API request error: {e}"}
    except Exception as e:
        return {"error": f"Audio processing error: {e}"}
    finally:
        if temp_wav_path and os.path.exists(temp_wav_path):
            try:
                os.remove(temp_wav_path)
            except:
                pass
