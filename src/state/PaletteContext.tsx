import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPalette, MoodPalette } from '../theme/palettes';

const KEY = 'moodPaletteId';

type Ctx = { palette: MoodPalette; paletteId: string; setPaletteId: (id: string) => void };
const C = createContext<Ctx | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setPaletteId] = useState<string>('blue');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved) setPaletteId(saved);
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem(KEY, paletteId).catch(() => {}); }, [paletteId]);

  const value = useMemo(() => ({ paletteId, palette: getPalette(paletteId), setPaletteId }), [paletteId]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePalette() {
  const v = useContext(C);
  if (!v) throw new Error('usePalette must be used within PaletteProvider');
  return v;
}