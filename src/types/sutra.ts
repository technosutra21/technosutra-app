// TypeScript interfaces for Techno Sutra data structures

export interface Character {
  id: string;
  createdDate: string;
  updatedDate: string;
  owner: string;
  capitulo: number;
  nome: string;
  ensinamento: string;
  descPersonagem: string;
  ocupacao: string;
  significado: string;
  local: string;
  resumoCap: string;
  capFileName: string;
  capUrl: string;
  qrCodeUrl: string;
  linkModel: string;
}

export interface CharacterEN {
  id: string;
  createdDate: string;
  updatedDate: string;
  owner: string;
  chapter: number;
  name: string;
  teaching: string;
  characterDesc: string;
  occupation: string;
  meaning: string;
  location: string;
  chapterSummary: string;
  capFileName: string;
  capUrl: string;
  qrCodeUrl: string;
  linkModel: string;
}

export interface Chapter {
  id: string;
  createdDate: string;
  updatedDate: string;
  owner: string;
  chapter: number;
  character: string;
  meaning: string;
  location: string;
  encounter: string;
  assembly: string;
  dialogue: string;
  teaching: string;
  manifestation: string;
  learning: string;
  direction: string;
  literaryStructure: string;
}

export interface ChapterEN {
  id: string;
  createdDate: string;
  updatedDate: string;
  owner: string;
  chapter: number;
  character: string;
  meaning: string;
  location: string;
  encounter: string;
  assembly: string;
  dialogue: string;
  teaching: string;
  manifestation: string;
  learning: string;
  direction: string;
  literaryStructure: string;
}

export interface SutraData {
  characters: Character[];
  charactersEN: CharacterEN[];
  chapters: Chapter[];
  chaptersEN: ChapterEN[];
}

export interface CombinedSutraEntry {
  id: string;
  chapter: number;
  // Character data
  nome: string;
  name: string;
  ocupacao: string;
  occupation: string;
  significado: string;
  meaning: string;
  local: string;
  location: string;
  ensinamento: string;
  teaching: string;
  descPersonagem: string;
  characterDesc: string;
  resumoCap: string;
  chapterSummary: string;
  linkModel: string;
  capUrl: string;
  qrCodeUrl: string;
  // Chapter additional data
  encounter?: string;
  assembly?: string;
  dialogue?: string;
  manifestation?: string;
  learning?: string;
  direction?: string;
  literaryStructure?: string;
}