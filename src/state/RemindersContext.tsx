import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RemindersCtx = {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[]; // 1=Dom ... 7=Sab (come Expo)
  dirty: boolean; // modifiche non applicate
  setEnabled: (v: boolean) => Promise<void>;
  setTime: (hour: number, minute: number) => Promise<void>;
  toggleDay: (weekday: number) => Promise<void>;
  applyNow: () => Promise<void>;  // applica la programmazione
  testNow: () => Promise<void>;
  cancelAll: () => Promise<void>;
};

const C = createContext<RemindersCtx | null>(null);

const K_ENABLED = 'rem.enabled';
const K_TIME    = 'rem.time';   // JSON {hour,minute}
const K_DAYS    = 'rem.days';   // JSON number[]

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Promemoria',
    importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function askPermissions(): Promise<boolean> {
  await ensureAndroidChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/** Calcola le prossime date (fino a `horizonDays`) per i giorni/orario scelti. */
function buildUpcomingDates(hour: number, minute: number, days: number[], horizonDays = 30): Date[] {
  const res: Date[] = [];
  const now = new Date();

  const wantAllDays = !days || days.length === 0;
  const wanted = new Set(days);

  for (let i = 0; i < horizonDays; i++) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(now.getDate() + i);
    const jsWeekday = d.getDay(); // 0=Dom ... 6=Sab
    const expoWeekday = jsWeekday === 0 ? 1 : jsWeekday + 1; // 1=Dom ... 7=Sab
    if (wantAllDays || wanted.has(expoWeekday)) {
      const date = new Date(d);
      date.setHours(hour, minute, 5, 0); // :05 per evitare collisioni sul minuto
      if (date.getTime() > now.getTime()) res.push(date);
    }
  }
  return res;
}

/** Programma notifiche una-per-data (no repeats). */
async function scheduleCalendarBatch(hour: number, minute: number, days: number[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const content: Notifications.NotificationContentInput = {
    title: 'Pausa respiro',
    body: '2 minuti per ricaricarti.',
    // niente suono: rispetta impostazioni utente
  };

  const dates = buildUpcomingDates(hour, minute, days, 30);
  for (const dt of dates) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { date: dt, channelId: 'reminders' } as any,
    });
  }
}

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const [enabled, _setEnabled] = useState(false);
  const [hour, _setHour] = useState(9);
  const [minute, _setMinute] = useState(0);
  const [days, _setDays] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const hydrated = useRef(false);

  // Load preferenze + (se ON) applica programmazione una volta all'avvio
  useEffect(() => {
    (async () => {
      const [e, t, d] = await Promise.all([
        AsyncStorage.getItem(K_ENABLED),
        AsyncStorage.getItem(K_TIME),
        AsyncStorage.getItem(K_DAYS),
      ]);
      if (e) _setEnabled(e === '1');
      if (t) {
        try { const obj = JSON.parse(t); _setHour(obj.hour ?? 9); _setMinute(obj.minute ?? 0); } catch {}
      }
      if (d) {
        try { const arr = JSON.parse(d); if (Array.isArray(arr)) _setDays(arr); } catch {}
      }
      hydrated.current = true;

      if (e === '1') {
        const ok = await askPermissions();
        if (ok) await scheduleCalendarBatch(_get().hour, _get().minute, _get().days);
      }
    })();
  }, []);

  const _get = () => ({ hour, minute, days });

  // API
  const setEnabled = async (v: boolean) => {
    _setEnabled(v);
    await AsyncStorage.setItem(K_ENABLED, v ? '1' : '0');
    if (!v) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setDirty(false);
    } else if (hydrated.current) {
      const ok = await askPermissions();
      if (ok) { await scheduleCalendarBatch(hour, minute, days); setDirty(false); }
      else { _setEnabled(false); await AsyncStorage.setItem(K_ENABLED, '0'); }
    }
  };

  const setTime = async (h: number, m: number) => {
    _setHour(h); _setMinute(m);
    await AsyncStorage.setItem(K_TIME, JSON.stringify({ hour: h, minute: m }));
    if (hydrated.current && enabled) setDirty(true);
  };

  const toggleDay = async (weekday: number) => {
    _setDays(prev => {
      const s = new Set(prev);
      if (s.has(weekday)) s.delete(weekday); else s.add(weekday);
      const arr = Array.from(s).sort((a,b)=>a-b);
      AsyncStorage.setItem(K_DAYS, JSON.stringify(arr)).catch(()=>{});
      return arr;
    });
    if (hydrated.current && enabled) setDirty(true);
  };

  const applyNow = async () => {
    if (!enabled) return;
    const ok = await askPermissions();
    if (!ok) return;
    // Se l'orario è “adesso”, sposta automaticamente al giorno successivo
    const now = new Date();
    const isNowMinute = now.getHours() === hour && now.getMinutes() === minute;
    const safeHour = hour, safeMinute = minute;
    await scheduleCalendarBatch(safeHour, safeMinute, days);
    setDirty(false);
  };

  const testNow = async () => {
    const ok = await askPermissions();
    if (!ok) return;
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Test promemoria', body: 'Funziona ✔️' },
      trigger: { seconds: 3, channelId: 'reminders' },
    });
  };

  const cancelAll = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    try { await Notifications.dismissAllNotificationsAsync(); } catch {}
    _setEnabled(false);
    _setDays([]);
    setDirty(false);
    await AsyncStorage.multiSet([[K_ENABLED, '0'], [K_DAYS, JSON.stringify([])]]);
  };

  const value = useMemo<RemindersCtx>(() => ({
    enabled, hour, minute, days, dirty,
    setEnabled, setTime, toggleDay, applyNow, testNow, cancelAll,
  }), [enabled, hour, minute, days, dirty]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useReminders() {
  const v = useContext(C);
  if (!v) throw new Error('useReminders must be used within RemindersProvider');
  return v;
}
