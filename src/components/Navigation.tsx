import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Map, Users, Route, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '@/hooks/useLanguage';

const Navigation = () => {
  const location = useLocation();
  const { t } = useLanguage();
  
  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/map', icon: Map, label: t('nav.map') },
    { path: '/gallery', icon: Users, label: t('nav.gallery') },
    { path: '/route-creator', icon: Route, label: t('nav.routeCreator') },
  ];

  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'space-x-4'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Button
            key={item.path}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            className={`${isActive ? 'gradient-neon text-black' : 'text-foreground hover:text-primary'} 
                       ${isMobile ? 'w-full justify-start' : ''}`}
          >
            <Link to={item.path}>
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-neon rounded-lg"></div>
              <span className="text-xl font-bold text-primary text-glow">Techno Sutra</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <NavContent />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-neon rounded"></div>
            <span className="font-bold text-primary text-glow">Techno Sutra</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="cyberpunk-card">
                <div className="mt-8">
                  <NavContent isMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="h-16 md:h-20"></div>
    </>
  );
};

export default Navigation;