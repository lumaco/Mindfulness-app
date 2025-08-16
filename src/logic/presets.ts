export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export type BreathStep = {
  phase: BreathPhase;
  seconds: number;
};

export type PresetDef = {
  id: string;
  label: string;
  // durata default della sessione (minuti)
  durationMin: number;
  // sequenza che si ripete per tutta la sessione
  pattern: BreathStep[];
};

export const PRESETS: PresetDef[] = [
  {
    id: 'box',
    label: 'Box Breathing',
    durationMin: 5,
    pattern: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
      { phase: 'exhale', seconds: 4 },
      { phase: 'hold', seconds: 4 },
    ],
  },
  {
    id: '478',
    label: '4–7–8',
    durationMin: 5,
    pattern: [
      { phase: 'inhale', seconds: 4 },
      { phase: 'hold', seconds: 7 },
      { phase: 'exhale', seconds: 8 },
    ],
  },
  {
    id: 'coerenza',
    label: 'Coerenza (≈6 bpm)',
    durationMin: 10,
    // 5 sec inspiro + 5 sec espiro ≈ 6 respiri/min
    pattern: [
      { phase: 'inhale', seconds: 5 },
      { phase: 'exhale', seconds: 5 },
    ],
  },
  {
    id: 'bodyscan',
    label: 'Body Scan',
    durationMin: 10,
    // Nessuna guida respiratoria rigida; inseriamo una fase neutra che non anima il respiro
    pattern: [ { phase: 'rest', seconds: 10 } ],
  },
  {
    id: 'silenzio',
    label: 'Silenzio',
    durationMin: 10,
    pattern: [ { phase: 'rest', seconds: 10 } ],
  },
];

export function getPreset(id: string | null | undefined): PresetDef {
  return PRESETS.find(p => p.id === id) ?? PRESETS[0];
}