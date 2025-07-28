import React, { useState } from 'react';
import { translations } from '@/lib/translations';
import { LanguageContext } from '@/contexts/LanguageContext';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'pt'>('pt');

  const t = (key: string): string => {
    const langTranslations = translations[language] as Record<string, string>;
    return langTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 