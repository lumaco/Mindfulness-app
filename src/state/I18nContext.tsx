import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

type Lang = 'it' | 'en';
type Dict = Record<string, string | string[]>;

const KEY = 'app.lang';

// === Dizionari (come già definiti) ===
const STRINGS: Record<Lang, Dict> = {
  it: {
    'tab.home': 'Home',
    'tab.log': 'Registro',
    'tab.settings': 'Impostazioni',
    'home.title': 'Sessione',
    'home.badge.ready': 'Pronto',
    'home.badge.paused': 'Pausa',
    'home.start': 'Avvia',
    'home.pause': 'Pausa',
    'home.cancel': 'Annulla',
    'home.reset': 'Reset',
    'home.duration': 'Durata sessione',
    'home.bellEvery': 'Campana ogni',
    'home.breathHalf': 'Ritmo respiro (mezza fase)',
    'home.endToast': 'Ben fatto! +{min} min nel registro 🫶',
    inhale: 'Inspira',
    exhale: 'Espira',
    'settings.title': 'Impostazioni',
    'settings.palette': 'Mood palette',
    'settings.ambience': 'Ambience',
    'settings.ambience.sound': 'Suono di ambiente',
    'settings.ambience.volume': 'Volume ambience',
    'settings.haptics': 'Haptics',
    'settings.haptics.feedback': 'Feedback aptico',
    'settings.haptics.intensity.light': 'Delicata',
    'settings.haptics.intensity.medium': 'Media',
    'settings.haptics.intensity.heavy': 'Decisa',
    'settings.bells': 'Campane',
    'settings.bells.volume': 'Volume campane',
    'settings.screen': 'Schermo',
    'settings.screen.keepAwake': 'Mantieni acceso durante la sessione',
    'settings.help': 'Aiuto',
    'settings.help.open': 'Come usare l’app',
    'help.title': 'Come usare l’app',
    'help.pre': 'Prima di iniziare',
    'help.pre.p': 'Siediti comodo, spalle morbide, mento leggero. Se vuoi, chiudi gli occhi.',
    'help.during': 'Durante la sessione',
    'help.during.p': 'Segui il cerchio: inspira mentre si espande, espira mentre si restringe. Mantieni il respiro naturale; se ti aiuta, allunga un po’ l’espirazione.',
    'help.mind': 'Se la mente vaga',
    'help.mind.p': 'È normale. Nota gentilmente dove è andata l’attenzione e riaccompagnala al respiro, senza giudizio.',
    'help.audio': 'Audio e ritmo',
    'help.audio.p': 'Puoi attivare un suono di ambiente e regolare le campane. Scegli un ritmo che ti sia confortevole; non serve “fare fatica”.',
    'help.cont': 'Continuità',
    'help.cont.p': 'Pochi minuti, ogni giorno. Nel Registro puoi vedere i progressi e creare una piccola routine.',
    'help.close': 'Chiudi',
    'onb.welcome': 'Benvenuto 👋',
    'onb.w1': 'Questa app ti guida in brevi sessioni di respirazione mindfulness. Scegli una durata, premi Avvia e segui il ritmo del cerchio.',
    'onb.b1': '• Inspira dolcemente — niente forzature',
    'onb.b2': '• Espira più lunga se ti rilassa',
    'onb.b3': '• Se la mente vaga, torna al respiro',
    'onb.tips': 'Consigli rapidi ✨',
    'onb.w2a': 'Dal tab Impostazioni puoi cambiare palette, suoni di ambiente, feedback aptico e volume delle campane.',
    'onb.w2b': 'Nel Registro trovi i progressi degli ultimi giorni.',
    'onb.next': 'Avanti',
    'onb.start': 'Inizia',
    'log.title': 'Registro',
    'log.last14': 'Ultimi 14 giorni',
    'log.kpi.totalMin': 'min totali',
    'log.kpi.sessions': 'sessioni',
    'log.kpi.streakDays': 'streak giorni',
    'log.listTitle': 'Sedute recenti',
    'log.empty': 'Nessuna sessione completata (ancora 😉)',
    'log.clear': 'Svuota registro',
    'wd.0': 'Dom','wd.1': 'Lun','wd.2': 'Mar','wd.3': 'Mer','wd.4': 'Gio','wd.5': 'Ven','wd.6': 'Sab',
  },
  en: {
    'tab.home': 'Home',
    'tab.log': 'Log',
    'tab.settings': 'Settings',
    'home.title': 'Session',
    'home.badge.ready': 'Ready',
    'home.badge.paused': 'Paused',
    'home.start': 'Start',
    'home.pause': 'Pause',
    'home.cancel': 'Cancel',
    'home.reset': 'Reset',
    'home.duration': 'Session length',
    'home.bellEvery': 'Bell every',
    'home.breathHalf': 'Breath rhythm (half phase)',
    'home.endToast': 'Nice job! +{min} min added to log 🫶',
    inhale: 'Inhale',
    exhale: 'Exhale',
    'settings.title': 'Settings',
    'settings.palette': 'Mood palette',
    'settings.ambience': 'Ambience',
    'settings.ambience.sound': 'Ambient sound',
    'settings.ambience.volume': 'Ambience volume',
    'settings.haptics': 'Haptics',
    'settings.haptics.feedback': 'Haptic feedback',
    'settings.haptics.intensity.light': 'Light',
    'settings.haptics.intensity.medium': 'Medium',
    'settings.haptics.intensity.heavy': 'Heavy',
    'settings.bells': 'Bells',
    'settings.bells.volume': 'Bells volume',
    'settings.screen': 'Screen',
    'settings.screen.keepAwake': 'Keep screen on during session',
    'settings.help': 'Help',
    'settings.help.open': 'How to use the app',
    'help.title': 'How to use the app',
    'help.pre': 'Before you start',
    'help.pre.p': 'Sit comfortably, soften shoulders and jaw. Close your eyes if you like.',
    'help.during': 'During the session',
    'help.during.p': 'Follow the circle: inhale as it expands, exhale as it shrinks. Keep a natural breath; slightly longer exhale can help.',
    'help.mind': 'If the mind wanders',
    'help.mind.p': 'That’s normal. Kindly notice it and return to the breath, without judgment.',
    'help.audio': 'Audio & rhythm',
    'help.audio.p': 'You can enable ambience and adjust the bells. Choose a pace that feels comfortable—no need to strain.',
    'help.cont': 'Consistency',
    'help.cont.p': 'Just a few minutes every day. The Log helps you track progress and build a routine.',
    'help.close': 'Close',
    'onb.welcome': 'Welcome 👋',
    'onb.w1': 'This app guides short mindfulness breathing sessions. Pick a duration, tap Start and follow the circle.',
    'onb.b1': '• Gentle inhale — no forcing',
    'onb.b2': '• Slightly longer exhale if relaxing',
    'onb.b3': '• If the mind wanders, return to breath',
    'onb.tips': 'Quick tips ✨',
    'onb.w2a': 'In Settings you can change the palette, ambience, haptics and bells volume.',
    'onb.w2b': 'Your recent progress is in the Log.',
    'onb.next': 'Next',
    'onb.start': 'Start',
    'log.title': 'Log',
    'log.last14': 'Last 14 days',
    'log.kpi.totalMin': 'total min',
    'log.kpi.sessions': 'sessions',
    'log.kpi.streakDays': 'streak days',
    'log.listTitle': 'Recent sessions',
    'log.empty': 'No sessions yet (so far 😉)',
    'log.clear': 'Clear log',
    'wd.0': 'Sun','wd.1': 'Mon','wd.2': 'Tue','wd.3': 'Wed','wd.4': 'Thu','wd.5': 'Fri','wd.6': 'Sat',
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  wd: (idx: number) => string;
};

const C = createContext<Ctx | null>(null);

// Rileva lingua di sistema al primo avvio
function detectSystemLang(): Lang {
  try {
    // expo-localization (preferito)
    const loc = Localization.getLocales?.()[0];
    const code = (loc?.languageCode || Localization.locale || '').toLowerCase();
    if (code.startsWith('it')) return 'it';
  } catch {}
  try {
    // fallback JS
    const code = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (code.startsWith('it')) return 'it';
  } catch {}
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('it');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(KEY);
        if (saved === 'it' || saved === 'en') {
          setLangState(saved as Lang);
        } else {
          const sys = detectSystemLang();
          setLangState(sys);
          await AsyncStorage.setItem(KEY, sys); // memorizza scelta iniziale
        }
      } catch {
        setLangState(detectSystemLang());
      }
    })();
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  };

  const toggleLang = () => setLang(lang === 'it' ? 'en' : 'it');

  const t = (key: string, params?: Record<string, string | number>) => {
    let s = (STRINGS[lang][key] as string) ?? key;
    if (params) Object.keys(params).forEach(k => { s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k])); });
    return s;
  };

  const wd = (idx: number) => (STRINGS[lang][`wd.${idx}`] as string) ?? '';

  const value = useMemo(() => ({ lang, setLang, toggleLang, t, wd }), [lang]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useI18n() {
  const v = useContext(C);
  if (!v) throw new Error('useI18n must be used within I18nProvider');
  return v;
}
