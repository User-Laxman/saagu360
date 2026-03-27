import * as Speech from "expo-speech";

export const speakText = (text) => {
    Speech.speak(text);
};