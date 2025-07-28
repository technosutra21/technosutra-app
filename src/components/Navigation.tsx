
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Map, Users, Route, Menu, Infinity as InfinityIcon } from 'lucide-react';
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
    <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'space-x-2'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <motion.div
            key={item.path}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              asChild
              variant="ghost"
              className={`
                relative overflow-hidden transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-100 border border-cyan-500/30 cyber-glow'
                  : 'text-slate-300 hover:text-cyan-100 hover:bg-slate-800/50 border border-transparent hover:border-cyan-500/20'
                }
                ${isMobile ? 'w-full justify-start py-3 px-4' : 'px-4 py-2'}
                backdrop-blur-sm
              `}
            >
              <Link to={item.path} className="flex items-center">
                <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-cyan-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            </Button>
          </motion.div>
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
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-cyan-500/20 sacred-pattern relative overflow-hidden"
      >
        {/* Enhanced floating particles in navigation */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-2 left-10 w-1 h-1 bg-cyan-400/40 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-4 right-20 w-1 h-1 bg-purple-400/40 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-2 left-1/3 w-1 h-1 bg-yellow-400/40 rounded-full"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute top-3 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full"
            animate={{
              y: [0, -12, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1.5 }}
          />
        </div>

        <div className="container mx-auto px-6 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg cyber-glow group-hover:shadow-cyan-400/50 transition-all duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <InfinityIcon className="w-5 h-5 text-black animate-pulse-glow" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-float">
                    <span className="text-xs">☸</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold gradient-text">TECHNO SUTRA</span>
                  <span className="text-xs text-slate-400 -mt-1">∞ Sacred Technology ∞</span>
                </div>
              </Link>
            </motion.div>

            <div className="flex items-center gap-6">
              <NavContent />
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent"></div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-cyan-500/20 sacred-pattern">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg cyber-glow group-hover:shadow-cyan-400/50 transition-all duration-300">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <InfinityIcon className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <span className="text-xs">☸</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold gradient-text text-sm">TECHNO SUTRA</span>
                <span className="text-xs text-slate-400 -mt-1 hidden xs:block">∞ Sacred Tech ∞</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-cyan-500/30 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all duration-300"
                >
                  <Menu className="w-5 h-5 text-cyan-400" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-black/95 border-l border-cyan-500/20 backdrop-blur-xl sacred-pattern"
              >
                <div className="mt-8">
                  <div className="mb-6 text-center">
                    <div className="text-lg font-bold gradient-text mb-2">Navigation</div>
                    <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                  </div>
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