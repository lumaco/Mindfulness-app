import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogEntry = {
  id: string;              // uid
  dateISO: string;         // ISO string
  durationSec: number;
  breathHalfSec: number;
  bellIntervalSec: number;
  paletteId?: string;
  ambience?: string;       // 'ocean' | 'rain' | ...
};

type Stats = {
  totalSessions: number;
  totalMinutes: number;
  streakDays: number;      // giorni consecutivi con almeno 1 sessione (oggi incluso se presente)
  last14: { dayKey: string; label: string; minutes: number }[];
};

type Ctx = {
  entries: LogEntry[];
  addEntry: (e: Omit<LogEntry, 'id'>) => Promise<void>;
  clearAll: () => Promise<void>;
  stats: Stats;
};

const C = createContext<Ctx | null>(null);
const K = 'log.v1';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd= String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function weekdayShort(d: Date) {
  return ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][d.getDay()];
}

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(K);
        if (raw) setEntries(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(K, JSON.stringify(entries)).catch(()=>{});
  }, [entries]);

  async function addEntry(e: Omit<LogEntry,'id'>) {
    const item: LogEntry = { id: uid(), ...e };
    setEntries(prev => [item, ...prev].slice(0, 2000)); // safety cap
  }

  async function clearAll() {
    setEntries([]);
    await AsyncStorage.removeItem(K);
  }

  const stats = useMemo<Stats>(() => {
    const totalSessions = entries.length;
    const totalMinutes = Math.round(entries.reduce((s, e) => s + e.durationSec/60, 0));

    // Aggrega per giorno (key = YYYY-MM-DD)
    const perDay = new Map<string, number>();
    for (const e of entries) {
      const k = dayKey(new Date(e.dateISO));
      perDay.set(k, (perDay.get(k) ?? 0) + e.durationSec/60);
    }

    // Streak: giorni consecutivi fino a oggi (o ieri, se oggi 0)
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = dayKey(d);
      const has = (perDay.get(k) ?? 0) > 0;
      if (i === 0 && !has) continue; // se oggi 0, streak parte da ieri
      if (has) streak++; else break;
    }

    // Ultimi 14 giorni per mini-grafico
    const last14: Stats['last14'] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i);
      const k = dayKey(d);
      last14.push({
        dayKey: k,
        label: weekdayShort(d),
        minutes: Math.round(perDay.get(k) ?? 0),
      });
    }

    return { totalSessions, totalMinutes, streakDays: streak, last14 };
  }, [entries]);

  return <C.Provider value={{ entries, addEntry, clearAll, stats }}>{children}</C.Provider>;
}

export function useLog() {
  const v = useContext(C);
  if (!v) throw new Error('useLog must be used within LogProvider');
  return v;
}
