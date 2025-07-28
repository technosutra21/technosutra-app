import { useLanguage } from '@/hooks/useLanguage';
import { LanguageProvider } from '@/hooks/LanguageContext';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import { motion } from 'framer-motion';

export { LanguageProvider };

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')}
        className="
          relative overflow-hidden group
          bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50
          border border-cyan-500/30
          hover:border-cyan-500/50
          hover:from-cyan-500/10 hover:via-purple-500/10 hover:to-yellow-500/10
          text-slate-300 hover:text-cyan-100
          transition-all duration-500
          backdrop-blur-xl
          px-3 py-2
          shadow-lg hover:shadow-cyan-500/20
          hover:scale-105
        "
      >
        {/* Enhanced shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        {/* Sacred energy particles */}
        <div className="absolute top-1 left-1 w-1 h-1 bg-cyan-400/60 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse delay-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="flex items-center space-x-2 relative z-10">
          <Languages className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="font-medium text-xs">
            {language === 'en' ? 'EN' : 'PT'}
          </span>
          <div className="text-xs opacity-60">
            {language === 'en' ? 'us' : 'br'}
          </div>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />

        {/* Sacred geometry accent */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity">
          <span className="text-xs">∞</span>
        </div>
      </Button>
    </motion.div>
  );
};