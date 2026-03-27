import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { COLORS, FONTS, SHADOW, SPACING } from '../constants/appTheme';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'te', label: 'తె' }
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
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
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
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 5,
    ...SHADOW.elevated,
    zIndex: 9999,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: {
    backgroundColor: COLORS.green800,
  },
  text: {
    fontSize: 13,
    fontFamily: FONTS.bodySemi,
    color: COLORS.gray600,
  },
  textActive: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
  }
});
