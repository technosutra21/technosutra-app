import React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
      className="text-muted-foreground hover:text-primary transition-colors"
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === 'pt' ? 'EN' : 'PT'}
    </Button>
  );
};
