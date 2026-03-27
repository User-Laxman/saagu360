try:
    from deep_translator import GoogleTranslator
    _TRANSLATOR_AVAILABLE = True
except ImportError:
    _TRANSLATOR_AVAILABLE = False
    print("[TranslationEngine] deep_translator not installed. Translation disabled — text will pass through unchanged.")


class SpeechLanguageEngine:
    '''
    Production-ready Translation Pipeline.
    Uses 'deep_translator' for stable Google Translate access.
    Falls back to pass-through if the library is missing.
    '''

    def __init__(self):
        self.is_configured = _TRANSLATOR_AVAILABLE

    def translate_to_english(self, text, source_lang='auto'):
        '''
        Converts regional text (e.g. Hindi, Telugu) into English
        for backend LLM Reasoning.
        '''
        if not text or source_lang == 'en':
            return text

        if not self.is_configured:
            return text

        try:
            return GoogleTranslator(source=source_lang, target='en').translate(text)
        except Exception as e:
            print(f"[TranslationEngine] Fail source->EN: {e}")
            return text

    def translate_to_regional(self, english_text, target_lang='hi'):
        '''
        Converts LLM English response back to the user's localized language.
        '''
        if not english_text or target_lang == 'en':
            return english_text

        if not self.is_configured:
            return english_text

        try:
            return GoogleTranslator(source='en', target=target_lang).translate(english_text)
        except Exception as e:
            print(f"[TranslationEngine] Fail EN->target: {e}")
            return english_text

    def translate_direct(self, text, target_lang='en'):
        '''
        Translates text from any auto-detected language directly to the target language.
        Used for seamlessly translating chat history when the user toggles the UI language.
        '''
        if not text or not self.is_configured:
            return text
        try:
            return GoogleTranslator(source='auto', target=target_lang).translate(text)
        except Exception as e:
            print(f"[TranslationEngine] Fail auto->target: {e}")
            return text

