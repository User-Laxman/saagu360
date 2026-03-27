import React, { createContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en', 'hi', or 'te'

  // Load saved language preference on mount
  useEffect(() => {
    AsyncStorage.getItem('kisan_language').then(saved => {
      if (saved) setLanguage(saved);
    });
  }, []);

  const changeLanguage = (code) => {
    setLanguage(code);
    AsyncStorage.setItem('kisan_language', code);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
