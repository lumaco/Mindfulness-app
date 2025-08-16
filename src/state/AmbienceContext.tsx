import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export type AmbienceType = 'off' | 'ocean' | 'rain' | 'forest' | 'brown';

type Ctx = {
  enabled: boolean;
  type: AmbienceType;
  volume: number; // 0..1
  setEnabled: (v: boolean) => void;
  setType: (t: AmbienceType) => void;
  setVolume: (v: number) => void;
  playIfEnabled: () => Promise<void>;
  stop: () => Promise<void>;
  duck: (ms?: number, to?: number) => Promise<void>;
};

const C = createContext<Ctx | null>(null);

const K_ENABLED = 'ambience.enabled';
const K_TYPE    = 'ambience.type';
const K_VOLUME  = 'ambience.volume';

function srcOf(t: AmbienceType) {
  switch (t) {
    case 'ocean':  return require('../../assets/ambience/ocean_waves_loop.mp3');
    case 'rain':   return require('../../assets/ambience/rain_soft_loop.mp3');
    case 'forest': return require('../../assets/ambience/forest_soft_loop.mp3');
    case 'brown':  return require('../../assets/ambience/brown_noise_loop.mp3');
    default:       return null;
  }
}

export function AmbienceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [type, setType]       = useState<AmbienceType>('off');
  const [volume, setVolume]   = useState<number>(0.25);

  const soundRef = useRef<Audio.Sound | null>(null);
  const loadedTypeRef = useRef<AmbienceType>('off');
  const targetVolRef = useRef<number>(0.25);
  const fadingRef = useRef<Promise<void> | null>(null);

  // Load preferenze
  useEffect(() => {
    (async () => {
      try {
        const [e, t, v] = await Promise.all([
          AsyncStorage.getItem(K_ENABLED),
          AsyncStorage.getItem(K_TYPE),
          AsyncStorage.getItem(K_VOLUME),
        ]);
        if (e !== null) setEnabled(e === '1');
        if (t) setType(t as AmbienceType);
        if (v) { const num = Number(v); if (!Number.isNaN(num)) setVolume(Math.max(0, Math.min(1, num))); }
      } catch {}
    })();
  }, []);

  // Persist
  useEffect(() => { AsyncStorage.setItem(K_ENABLED, enabled ? '1' : '0').catch(() => {}); }, [enabled]);
  useEffect(() => { AsyncStorage.setItem(K_TYPE, type).catch(() => {}); }, [type]);
  useEffect(() => { AsyncStorage.setItem(K_VOLUME, String(volume)).catch(() => {}); targetVolRef.current = volume; }, [volume]);

  async function unload() {
    try { await soundRef.current?.unloadAsync(); } catch {}
    soundRef.current = null;
    loadedTypeRef.current = 'off';
  }

  async function ensureLoaded() {
    if (type === 'off') { await unload(); return; }
    if (loadedTypeRef.current === type && soundRef.current) return;
    await unload();
    const src = srcOf(type);
    if (!src) return;
    const { sound } = await Audio.Sound.createAsync(src, { isLooping: true, volume: volume });
    soundRef.current = sound;
    loadedTypeRef.current = type;
  }

  async function fadeTo(vol: number, ms = 350) {
    const s = soundRef.current; if (!s) return;
    const steps = 7;
    const start = targetVolRef.current;
    const delta = vol - start;
    const dt = ms / steps;
    for (let i = 1; i <= steps; i++) {
      const v = start + (delta * i) / steps;
      try { await s.setVolumeAsync(Math.max(0, Math.min(1, v))); } catch {}
      await new Promise(r => setTimeout(r, dt));
    }
    targetVolRef.current = vol;
  }

  async function playIfEnabled() {
    if (!enabled || type === 'off') return;
    await ensureLoaded();
    if (!soundRef.current) return;
    try {
      await soundRef.current.setVolumeAsync(0);
      await soundRef.current.playAsync();
      await fadeTo(volume, 500);
    } catch {}
  }

  async function stop() {
    if (!soundRef.current) return;
    try {
      await fadeTo(0, 500);
      await soundRef.current.pauseAsync();
    } catch {}
  }

  // Ducking: abbassa per un po’, poi torna al volume target
  async function duck(ms = 900, to = 0.3) {
    if (!enabled || !soundRef.current) return;
    const prev = targetVolRef.current;
    try {
      await fadeTo(Math.min(prev, to), 150);
      await new Promise(r => setTimeout(r, ms));
    } finally {
      await fadeTo(volume, 220);
    }
  }

  const value = useMemo<Ctx>(() => ({
    enabled, type, volume,
    setEnabled,
    setType: (t) => setType(t),
    setVolume: (v) => setVolume(Math.max(0, Math.min(1, v))),
    playIfEnabled, stop, duck,
  }), [enabled, type, volume]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useAmbience() {
  const v = useContext(C);
  if (!v) throw new Error('useAmbience must be used within AmbienceProvider');
  return v;
}