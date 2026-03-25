from googletrans import Translator

# Initialize Translator
translator = Translator()

def translate_to_english(text, src_language='auto'):
    '''
    Translates user input in a regional language to English for LLM processing.
    Example: Hindi (hi), Telugu (te), Tamil (ta), Marathi (mr)
    '''
    try:
        translation = translator.translate(text, src=src_language, dest='en')
        return translation.text
    except Exception as e:
        print(f"Translation Error: {e}")
        return text

def translate_to_regional(text, target_language='hi'):
    '''
    Translates the LLM's English response back to the user's regional language.
    target_language: language code (e.g., 'te' for Telugu, 'ta' for Tamil)
    '''
    try:
        translation = translator.translate(text, src='en', dest=target_language)
        return translation.text
    except Exception as e:
        print(f"Translation Error: {e}")
        return text

# Example Usage
if __name__ == "__main__":
    hindi_query = "मेरे टमाटर के पौधे सूख रहे हैं।"
    english_query = translate_to_english(hindi_query)
    print("Translated for AI:", english_query)
    
    ai_response = "Your tomato plants might need more water or could be affected by wilt."
    telugu_response = translate_to_regional(ai_response, target_language='te')
    print("Translated for Farmer (Telugu):", telugu_response)
