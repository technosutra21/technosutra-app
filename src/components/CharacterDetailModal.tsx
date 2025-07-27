import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Book, MapPin, Sparkles, Eye, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CombinedSutraEntry } from '@/types/sutra';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="cyberpunk-card max-w-4xl w-full max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-primary text-glow">
                      {character.nome}
                    </h2>
                    <Badge variant="outline" className="text-accent">
                      Capítulo {character.chapter}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Book className="w-4 h-4 text-accent" />
                      <span>{character.ocupacao}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span>{character.local}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span>{character.significado}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
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
                  Ver Modelo 3D
                </Button>
                
                {character.capUrl && (
                  <Button
                    variant="outline"
                    onClick={openChapter}
                    className="border-purple-500 text-purple-400"
                  >
                    <Book className="w-4 h-4 mr-2" />
                    Ler Capítulo
                  </Button>
                )}
                
                {character.qrCodeUrl && (
                  <Button
                    variant="outline"
                    onClick={openQRCode}
                    className="border-cyan-500 text-cyan-400"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver QR Code
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};