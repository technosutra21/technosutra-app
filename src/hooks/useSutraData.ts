import { useState, useEffect, useCallback } from 'react';
import { SutraData, Character, CharacterEN, Chapter, ChapterEN, CombinedSutraEntry } from '@/types/sutra';
import { useLanguage } from './useLanguage';

// CSV parsing utility
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];
  
  // Get headers from first line
  const headers = lines[0].split(',').map(header => 
    header.replace(/^"/, '').replace(/"$/, '').trim()
  );
  
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line with proper quote handling
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          j++; // Skip next quote
        } else {
          // Start or end of quoted value
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    // Create object from headers and values
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] || '';
    });
    
    data.push(entry);
  }
  
  return data;
};

// Map CSV data to our interfaces
const mapCharacterData = (csvData: any[]): Character[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    capitulo: parseInt(row.capitulo || '0'),
    nome: row.Nome || '',
    ensinamento: row.Ensinamento || '',
    descPersonagem: row['Desc. Personagem'] || '',
    ocupacao: (row['Ocupação'] || row.Ocupacao) || '',
    significado: row.Significado || '',
    local: row.Local || '',
    resumoCap: row['Resumo do Cap. (84000.co)'] || '',
    capFileName: row['Cap. FILE NAME'] || '',
    capUrl: row['Cap. URL'] || '',
    qrCodeUrl: row['QR Code URL'] || '',
    linkModel: row['LINK MODEL'] || ''
  }));
};

const mapCharacterENData = (csvData: any[]): CharacterEN[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    name: row.Name || '',
    teaching: row.Teaching || '',
    characterDesc: row['Character Desc'] || '',
    occupation: row.Occupation || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    chapterSummary: row['Chapter Summary'] || '',
    capFileName: row['Cap. FILE NAME'] || '',
    capUrl: row['Cap. URL'] || '',
    qrCodeUrl: row['QR Code URL'] || '',
    linkModel: row['LINK MODEL'] || ''
  }));
};

const mapChapterData = (csvData: any[]): Chapter[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    character: row.Character || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    encounter: row.Encounter || '',
    assembly: row.Assembly || '',
    dialogue: row.Dialogue || '',
    teaching: row.Teaching || '',
    manifestation: row.Manifestation || '',
    learning: row.Learning || '',
    direction: row.Direction || '',
    literaryStructure: row['Literary Structure'] || ''
  }));
};

const mapChapterENData = (csvData: any[]): ChapterEN[] => {
  return csvData.map(row => ({
    id: row.ID || '',
    createdDate: row['Created Date'] || '',
    updatedDate: row['Updated Date'] || '',
    owner: row.Owner || '',
    chapter: parseInt(row.chapter || '0'),
    character: row.Character || '',
    meaning: row.Meaning || '',
    location: row.Location || '',
    encounter: row.Encounter || '',
    assembly: row.Assembly || '',
    dialogue: row.Dialogue || '',
    teaching: row.Teaching || '',
    manifestation: row.Manifestation || '',
    learning: row.Learning || '',
    direction: row.Direction || '',
    literaryStructure: row['Literary Structure'] || ''
  }));
};

export const useSutraData = () => {
  const [data, setData] = useState<SutraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setLoading(true);

        // Determine file paths based on language
        const charactersFile = language === 'en' ? '/characters_en.csv' : '/characters.csv';
        const chaptersFile = language === 'en' ? '/chapters_en.csv' : '/chapters.csv';

        // Load CSV files based on current language
        const [charactersResponse, chaptersResponse] = await Promise.all([
          fetch(charactersFile),
          fetch(chaptersFile)
        ]);

        if (!charactersResponse.ok || !chaptersResponse.ok) {
          throw new Error(`Failed to load CSV files for language: ${language}`);
        }

        const [charactersText, chaptersText] = await Promise.all([
          charactersResponse.text(),
          chaptersResponse.text()
        ]);

        // Parse CSV data
        const charactersCSV = parseCSV(charactersText);
        const chaptersCSV = parseCSV(chaptersText);

        // Map to interfaces based on language
        let sutraData: SutraData;

        if (language === 'en') {
          const charactersEN = mapCharacterENData(charactersCSV);
          const chaptersEN = mapChapterENData(chaptersCSV);

          sutraData = {
            characters: [], // Empty for EN mode
            charactersEN,
            chapters: [], // Empty for EN mode
            chaptersEN
          };

          console.log('English Sutra data loaded successfully:', {
            charactersEN: charactersEN.length,
            chaptersEN: chaptersEN.length
          });
        } else {
          const characters = mapCharacterData(charactersCSV);
          const chapters = mapChapterData(chaptersCSV);

          sutraData = {
            characters,
            charactersEN: [], // Empty for PT mode
            chapters,
            chaptersEN: [] // Empty for PT mode
          };

          console.log('Portuguese Sutra data loaded successfully:', {
            characters: characters.length,
            chapters: chapters.length
          });
        }

        setData(sutraData);

      } catch (err) {
        console.error('Error loading CSV data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, [language]);

  // Utility function to combine character and chapter data
  const getCombinedData = useCallback((language: 'pt' | 'en' = 'pt'): CombinedSutraEntry[] => {
    if (!data) return [];

    const characters = language === 'pt' ? data.characters : data.charactersEN;
    const chapters = language === 'pt' ? data.chapters : data.chaptersEN;

    return characters.map(char => {
      const chapter = chapters.find(ch => ch.chapter === (language === 'pt' ? char.capitulo : char.chapter));
      
      if (language === 'pt') {
        const ptChar = char as Character;
        const enChar = data.charactersEN.find(c => c.chapter === ptChar.capitulo);
        
        return {
          id: ptChar.id,
          chapter: ptChar.capitulo,
          nome: ptChar.nome,
          name: enChar?.name || ptChar.nome,
          ocupacao: ptChar.ocupacao,
          occupation: enChar?.occupation || ptChar.ocupacao,
          significado: ptChar.significado,
          meaning: enChar?.meaning || ptChar.significado,
          local: ptChar.local,
          location: enChar?.location || ptChar.local,
          ensinamento: ptChar.ensinamento,
          teaching: enChar?.teaching || ptChar.ensinamento,
          descPersonagem: ptChar.descPersonagem,
          characterDesc: enChar?.characterDesc || ptChar.descPersonagem,
          resumoCap: ptChar.resumoCap,
          chapterSummary: enChar?.chapterSummary || ptChar.resumoCap,
          linkModel: ptChar.linkModel,
          capUrl: ptChar.capUrl,
          qrCodeUrl: ptChar.qrCodeUrl,
          encounter: chapter?.encounter,
          assembly: chapter?.assembly,
          dialogue: chapter?.dialogue,
          manifestation: chapter?.manifestation,
          learning: chapter?.learning,
          direction: chapter?.direction,
          literaryStructure: chapter?.literaryStructure
        };
      } else {
        const enChar = char as CharacterEN;
        const ptChar = data.characters.find(c => c.capitulo === enChar.chapter);
        
        return {
          id: enChar.id,
          chapter: enChar.chapter,
          nome: ptChar?.nome || enChar.name,
          name: enChar.name,
          ocupacao: ptChar?.ocupacao || enChar.occupation,
          occupation: enChar.occupation,
          significado: ptChar?.significado || enChar.meaning,
          meaning: enChar.meaning,
          local: ptChar?.local || enChar.location,
          location: enChar.location,
          ensinamento: ptChar?.ensinamento || enChar.teaching,
          teaching: enChar.teaching,
          descPersonagem: data.characters.find(c => c.capitulo === enChar.chapter)?.descPersonagem || enChar.characterDesc,
          characterDesc: enChar.characterDesc,
          resumoCap: data.characters.find(c => c.capitulo === enChar.chapter)?.resumoCap || enChar.chapterSummary,
          chapterSummary: enChar.chapterSummary,
          linkModel: enChar.linkModel,
          capUrl: enChar.capUrl,
          qrCodeUrl: enChar.qrCodeUrl,
          encounter: chapter?.encounter,
          assembly: chapter?.assembly,
          dialogue: chapter?.dialogue,
          manifestation: chapter?.manifestation,
          learning: chapter?.learning,
          direction: chapter?.direction,
          literaryStructure: chapter?.literaryStructure
        };
      }
    }).sort((a, b) => a.chapter - b.chapter);
  }, [data]);

  const getCharacterByChapter = useCallback((chapterNumber: number, language: 'pt' | 'en' = 'pt'): CombinedSutraEntry | undefined => {
    return getCombinedData(language).find(entry => entry.chapter === chapterNumber);
  }, [getCombinedData]);

  return {
    data,
    loading,
    error,
    getCombinedData,
    getCharacterByChapter
  };
};