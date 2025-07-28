import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

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