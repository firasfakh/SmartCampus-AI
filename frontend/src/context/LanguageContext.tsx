import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('fr');

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('smartcampus_lang', lang);
  };

  useEffect(() => {
    const saved = localStorage.getItem('smartcampus_lang') as LanguageCode;
    if (saved && ['fr', 'ar_tn', 'arabizi', 'en'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const isRTL = language === 'ar_tn';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      <div className={isRTL ? 'rtl font-sans' : 'ltr font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

