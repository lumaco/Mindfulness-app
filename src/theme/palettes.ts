export type MoodPalette = {
  id: string;
  label: string;
  exhale: string; // colore “riposo/espira” (più scuro)
  inhale: string; // colore “inspira” (più chiaro)
};

export const PALETTES: MoodPalette[] = [
  {
    id: 'blue',
    label: 'Blue (default)',
    exhale: '#0a2540', // blu profondo
    inhale: '#134e9b', // blu-azzurro
  },
  {
    id: 'lavender',
    label: 'Lavender',
    exhale: '#1f1b2e', // viola profondo
    inhale: '#6b5ca5', // lavanda tenue
  },
  {
    id: 'sage',
    label: 'Sage',
    exhale: '#0f1f1a', // salvia molto scuro (desat.)
    inhale: '#2d5a49', // salvia tenue
  },
  {
    id: 'teal',
    label: 'Teal',
    exhale: '#0b2a2e', // teal profondo
    inhale: '#0e7490', // teal morbido
  },
  {
    id: 'amber',
    label: 'Amber',
    exhale: '#1f1405', // ambra molto scura
    inhale: '#b45309', // ambra calda
  },
  // --- NUOVE ---
  {
    id: 'graphite',
    label: 'Graphite',
    exhale: '#0a0c0f', // quasi nero
    inhale: '#30363f', // grigio ardesia
  },
  {
    id: 'rose',
    label: 'Rose',
    exhale: '#2a0e14', // bordeaux profondo
    inhale: '#9d3d5a', // rosa caldo attenuato
  },
];

export function getPalette(id: string | null | undefined): MoodPalette {
  return PALETTES.find(p => p.id === id) ?? PALETTES[0]; // default blue
}
