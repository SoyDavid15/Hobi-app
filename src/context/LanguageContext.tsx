import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { translations, LanguageCode, TranslationKey } from '@/constants/translations';

const LANGUAGE_STORAGE_KEY = 'hobi_app_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: async () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('es');

  useEffect(() => {
    const loadStoredLanguage = async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
          stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        } else {
          stored = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);
        }
        if (stored === 'es' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch {
        // use default 'es'
      }
    };
    loadStoredLanguage();
  }, []);

  const setLanguage = async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } else {
        await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, newLang);
      }
    } catch {
      // ignore
    }
  };

  const t = useCallback((key: TranslationKey): string => {
    const langDict = translations[language] || translations.es;
    return (langDict as any)[key] || translations.es[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
