import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext, LanguageContextType } from '@/contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    return null;
  }

  const { language, setLanguage } = context as LanguageContextType;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="p-2 rounded-full bg-slate-800/50 text-white flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 1 }}
    >
      <span className="font-bold">{language === 'en' ? 'EN' : 'PT'}</span>
    </motion.button>
  );
};

export default LanguageSwitcher;