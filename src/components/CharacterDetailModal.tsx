import React from 'react';
import { CyberButton } from '@/components/ui/cyber-button';
import { CyberCard, CyberCardContent, CyberCardHeader, CyberCardTitle } from '@/components/ui/cyber-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Book, MapPin, Sparkles, Eye, ExternalLink, Smartphone, Infinity as InfinityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombinedSutraEntry } from '@/types/sutra';
import { useLanguage } from '@/hooks/useLanguage';

interface CharacterDetailModalProps {
  character: CombinedSutraEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();

  if (!character) return null;

  const openModelViewer = () => {
    const modelUrl = encodeURIComponent(character.linkModel);
    const title = encodeURIComponent(character.nome);
    window.open(`/model-viewer?url=${modelUrl}&title=${title}`, '_blank');
  };

  const openChapter = () => {
    if (character.capUrl) {
      window.open(character.capUrl, '_blank');
    }
  };

  const openQRCode = () => {
    if (character.qrCodeUrl) {
      window.open(character.qrCodeUrl, '_blank');
    }
  };

  const openAR = () => {
    window.open(`/ar?model=${character.chapter}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 sacred-pattern"
          onClick={onClose}
        >
          {/* Enhanced floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-1/4 left-1/4 text-cyan-400/20 text-4xl"
            >
              ∞
            </motion.div>
            <motion.div
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-1/4 right-1/4 text-purple-400/20 text-5xl"
            >
              ☸
            </motion.div>
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
              className="absolute top-1/3 right-1/3 text-yellow-400/20 text-3xl"
            >
              ☸
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CyberCard
              variant="void"
              glowEffect
              sacredPattern
              className="max-w-4xl w-full max-h-[90vh] overflow-auto relative border-2 border-cyan-500/30 bg-black/95"
            >
              <CyberCardHeader className="border-b border-cyan-500/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center"
                      >
                        <InfinityIcon className="w-6 h-6 text-black" />
                      </motion.div>

                      <div>
                        <CyberCardTitle className="text-3xl font-bold gradient-text mb-2">
                          {character.nome}
                        </CyberCardTitle>
                        <Badge variant="outline" className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-100 border-cyan-500/30">
                          {t('common.chapter')} {character.chapter}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <motion.div
                        className="flex items-center gap-2 p-3 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-lg border border-cyan-500/20"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Book className="w-5 h-5 text-cyan-400" />
                        <div>
                          <div className="text-cyan-400 font-medium">{t('common.occupation')}</div>
                          <div className="text-slate-300">{character.ocupacao}</div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/20"
                        whileHover={{ scale: 1.02 }}
                      >
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="text-purple-400 font-medium">{t('common.location')}</div>
                          <div className="text-slate-300">{character.local}</div>
                        </div>
                      </motion.div>

                      <motion.div
                        className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/20"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <div>
                          <div className="text-yellow-400 font-medium">{t('common.meaning')}</div>
                          <div className="text-slate-300 line-clamp-2">{character.significado}</div>
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CyberButton
                      variant="outline"
                      size="sm"
                      onClick={onClose}
                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                    >
                      <X className="w-5 h-5" />
                    </CyberButton>
                  </motion.div>
                </div>
              </CyberCardHeader>

              <CyberCardContent className="space-y-6">
                {/* Description */}
                <div>
                <h3 className="text-xl font-bold text-primary mb-3">Descrição do Personagem</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {character.descPersonagem || character.ensinamento}
                </p>
              </div>

              {/* Teaching */}
              <div>
                <h3 className="text-xl font-bold text-primary mb-3">Ensinamento</h3>
                <div className="bg-muted/20 p-4 rounded-lg border border-border">
                  <p className="text-foreground leading-relaxed">
                    {character.ensinamento}
                  </p>
                </div>
              </div>

              {/* Chapter Summary */}
              {character.resumoCap && (
                <div>
                  <h3 className="text-xl font-bold text-primary mb-3">Resumo do Capítulo</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {character.resumoCap}
                  </p>
                </div>
              )}

              {/* Additional Chapter Data */}
              {character.encounter && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-accent mb-2">Encontro</h4>
                    <p className="text-sm text-muted-foreground">{character.encounter}</p>
                  </div>
                  {character.assembly && (
                    <div>
                      <h4 className="font-bold text-accent mb-2">Assembleia</h4>
                      <p className="text-sm text-muted-foreground">{character.assembly}</p>
                    </div>
                  )}
                  {character.manifestation && (
                    <div>
                      <h4 className="font-bold text-accent mb-2">Manifestação</h4>
                      <p className="text-sm text-muted-foreground">{character.manifestation}</p>
                    </div>
                  )}
                  {character.learning && (
                    <div>
                      <h4 className="font-bold text-accent mb-2">Aprendizado</h4>
                      <p className="text-sm text-muted-foreground">{character.learning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                <Button
                  onClick={openModelViewer}
                  className="gradient-neon text-black font-bold"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('modal.view3dModel')}
                </Button>

                <Button
                  onClick={openAR}
                  variant="outline"
                  className="border-green-500 text-green-400"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  {t('modal.viewInAR')}
                </Button>

                {character.capUrl && (
                  <Button
                    variant="outline"
                    onClick={openChapter}
                    className="border-purple-500 text-purple-400"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    {t('modal.readChapter')}
                  </Button>
                )}

                {character.qrCodeUrl && (
                  <Button
                    variant="outline"
                    onClick={openQRCode}
                    className="border-cyan-500 text-cyan-400"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('modal.viewQRCode')}
                  </Button>
                )}
              </div>
              </CyberCardContent>
            </CyberCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};