export const TRAIL_TYPES = {
  meditation: {
    id: 'meditation',
    name: 'Trilha de Meditação',
    icon: 'Flower2',
    color: 'from-purple-500 to-pink-500',
    description: 'Caminho contemplativo para prática meditativa',
    mapStyle: 'backdrop'
  },
  pilgrimage: {
    id: 'pilgrimage',
    name: 'Peregrinação Sagrada',
    icon: 'Mountain',
    color: 'from-cyan-500 to-blue-500',
    description: 'Jornada espiritual através de locais sagrados',
    mapStyle: 'outdoor-v2'
  },
  mindfulness: {
    id: 'mindfulness',
    name: 'Atenção Plena',
    icon: 'TreePine',
    color: 'from-green-500 to-emerald-500',
    description: 'Trilha para conexão com a natureza',
    mapStyle: 'satellite'
  },
  zen: {
    id: 'zen',
    name: 'Caminho Zen',
    icon: 'Waves',
    color: 'from-indigo-500 to-purple-500',
    description: 'Simplicidade e harmonia no caminhar',
    mapStyle: 'streets-v2'
  }
} as const;

export type TrailType = keyof typeof TRAIL_TYPES;

export interface TrailPoint {
  id: string;
  name: string;
  type: 'start' | 'end' | 'sacred' | 'meditation' | 'rest' | 'waypoint';
  coordinates: [number, number];
  description?: string;
}

export interface CharacterPoint {
  id: string;
  coordinates: [number, number];
  character: any; // CombinedSutraEntry
  distanceFromUser?: number;
  isInRange?: boolean;
}

export interface Trail {
  id?: string;
  name: string;
  description: string;
  type: TrailType;
  points: TrailPoint[];
  characters: CharacterPoint[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  created?: Date;
} 