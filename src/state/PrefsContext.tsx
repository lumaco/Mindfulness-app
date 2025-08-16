import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HapticsIntensity = 'light' | 'medium' | 'heavy';

type Prefs = {
  hapticsEnabled: boolean;
  hapticsIntensity: HapticsIntensity;
  bellVolume: number;        // 0..1
  keepAwake: boolean;        // mantieni schermo acceso durante la sessione

  setHapticsEnabled: (v: boolean) => void;
  setHapticsIntensity: (v: HapticsIntensity) => void;
  setBellVolume: (v: number) => void;
  setKeepAwake: (v: boolean) => void;
};

const C = createContext<Prefs | null>(null);

const K_ENABLED = 'prefs.haptics.enabled';
const K_LEVEL   = 'prefs.haptics.level';
const K_BVOL    = 'prefs.bell.volume';
const K_AWAKE   = 'prefs.keepAwake';

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [hapticsIntensity, setHapticsIntensity] = useState<HapticsIntensity>('light');
  const [bellVolume, setBellVolume] = useState(0.8);
  const [keepAwake, setKeepAwake] = useState(true);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const [e, l, b, a] = await Promise.all([
          AsyncStorage.getItem(K_ENABLED),
          AsyncStorage.getItem(K_LEVEL),
          AsyncStorage.getItem(K_BVOL),
          AsyncStorage.getItem(K_AWAKE),
        ]);
        if (e !== null) setHapticsEnabled(e === '1');
        if (l) setHapticsIntensity((l as HapticsIntensity) || 'light');
        if (b && !Number.isNaN(Number(b))) setBellVolume(Math.max(0, Math.min(1, Number(b))));
        if (a !== null) setKeepAwake(a === '1');
      } catch {}
    })();
  }, []);

  // Persist
  useEffect(() => { AsyncStorage.setItem(K_ENABLED, hapticsEnabled ? '1' : '0').catch(()=>{}); }, [hapticsEnabled]);
  useEffect(() => { AsyncStorage.setItem(K_LEVEL, hapticsIntensity).catch(()=>{}); }, [hapticsIntensity]);
  useEffect(() => { AsyncStorage.setItem(K_BVOL, String(bellVolume)).catch(()=>{}); }, [bellVolume]);
  useEffect(() => { AsyncStorage.setItem(K_AWAKE, keepAwake ? '1' : '0').catch(()=>{}); }, [keepAwake]);

  const value = useMemo<Prefs>(() => ({
    hapticsEnabled, hapticsIntensity, bellVolume, keepAwake,
    setHapticsEnabled, setHapticsIntensity, setBellVolume, setKeepAwake,
  }), [hapticsEnabled, hapticsIntensity, bellVolume, keepAwake]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePrefs() {
  const v = useContext(C);
  if (!v) throw new Error('usePrefs must be used within PrefsProvider');
  return v;
}
