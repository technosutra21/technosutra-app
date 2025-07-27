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
    chapter: parseInt(row.capitulo || '0'),
    name: row.Nome || '',
    teaching: row.Ensinamento || '',
    characterDesc: row['Desc. Personagem'] || '',
    occupation: row['Ocupação'] || '',
    meaning: row.Significado || '',
    location: row.Local || '',
    chapterSummary: row['Resumo do Cap. (84000.co)'] || '',
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
    chapter: parseInt(row.capitulo || '0'),
    character: row.Chapter_Title || '',
    meaning: row.Name_Translation || '',
    location: row.Location || '',
    encounter: row.Context || '',
    assembly: row.Assembly_Present || '',
    dialogue: row.Main_Dialogue || '',
    teaching: row.Main_Teaching || '',
    manifestation: row.Miraculous_Manifestations || '',
    learning: row.Spiritual_Progression || '',
    direction: row.Transition || '',
    literaryStructure: row.Unique_Elements || ''
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

        // Load all CSV files (both languages) for proper data combination
        const [charactersResponse, charactersENResponse, chaptersResponse, chaptersENResponse] = await Promise.all([
          fetch('/characters.csv'),
          fetch('/characters_en.csv'),
          fetch('/chapters.csv'),
          fetch('/chapters_en.csv')
        ]);

        if (!charactersResponse.ok || !charactersENResponse.ok || !chaptersResponse.ok || !chaptersENResponse.ok) {
          throw new Error('Failed to load CSV files');
        }

        const [charactersText, charactersENText, chaptersText, chaptersENText] = await Promise.all([
          charactersResponse.text(),
          charactersENResponse.text(),
          chaptersResponse.text(),
          chaptersENResponse.text()
        ]);

        // Parse CSV data
        const charactersCSV = parseCSV(charactersText);
        const charactersENCSV = parseCSV(charactersENText);
        const chaptersCSV = parseCSV(chaptersText);
        const chaptersENCSV = parseCSV(chaptersENText);

        // Map to interfaces
        const characters = mapCharacterData(charactersCSV);
        const charactersEN = mapCharacterENData(charactersENCSV);
        const chapters = mapChapterData(chaptersCSV);
        const chaptersEN = mapChapterENData(chaptersENCSV);

        const sutraData: SutraData = {
          characters,
          charactersEN,
          chapters,
          chaptersEN
        };

        setData(sutraData);
        console.log('Sutra data loaded successfully:', {
          characters: characters.length,
          charactersEN: charactersEN.length,
          chapters: chapters.length,
          chaptersEN: chaptersEN.length
        });

      } catch (err) {
        console.error('Error loading CSV data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

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