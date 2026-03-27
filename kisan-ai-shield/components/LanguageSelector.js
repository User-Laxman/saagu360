import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS } from '../constants/appTheme';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'te', label: 'తెలుగు' }
];

export default function LanguageSelector() {
  const { language, changeLanguage } = useContext(LanguageContext);

  return (
    <View style={styles.container}>
      {LANGS.map(l => (
        <TouchableOpacity
          key={l.code}
          style={[styles.btn, language === l.code && styles.btnActive]}
          onPress={() => changeLanguage(l.code)}
        >
          <Text style={[styles.text, language === l.code && styles.textActive]}>
            {l.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20, // Sit cleanly above the tabs natively within the screen boundary
    left: 20,   // Bottom left corner
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 6, // Slightly thicker padding for touch targets
    elevation: 10, // Force clear of Tabs Navigator on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 9999, // Ensure it floats above absolutely everything
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  btnActive: {
    backgroundColor: COLORS.green800,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  textActive: {
    color: COLORS.white,
    fontWeight: '800',
  }
});
