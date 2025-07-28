import { createContext } from 'react';

export interface LanguageContextType {
  language: 'en' | 'pt';
  setLanguage: (lang: 'en' | 'pt') => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined); 