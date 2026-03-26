import React, { createContext, useState } from 'react';
import { translations } from '../constants/translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // 'en', 'hi', or 'te'

  const changeLanguage = (code) => {
    setLanguage(code);
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
