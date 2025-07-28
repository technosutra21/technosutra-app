// ARUI.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CyberCard } from '@/components/ui/cyber-card';
import { Eye } from 'lucide-react';
import { useARManager } from '@/hooks/useARManager';

type ARUIProps = {
  manager: ReturnType<typeof useARManager>;
};

const ARUI: React.FC<ARUIProps> = ({ manager }) => {
  const {
    isLoading,
    loadingProgress,
    language,
  } = manager;

  return (
    <div className="ar-container">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-content">
              <CyberCard>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-lg font-semibold text-white">
                    {language === 'pt' ? 'Carregando Modelo...' : 'Loading Model...'}
                  </p>
                  <div className="progress-bar-container">
                    <motion.div
                      className="progress-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    {loadingProgress.toFixed(0)}%
                  </p>
                </motion.div>
              </CyberCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div
        id="model-viewer-container"
        className="model-viewer-container"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <model-viewer
          id="model-viewer"
          src=""
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          enable-pan
          style={{ width: '100%', height: '100%' }}
        >
          <div id="ar-prompt">
            <Eye className="w-8 h-8" />
          </div>
        </model-viewer>
      </div>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export default ARUI;