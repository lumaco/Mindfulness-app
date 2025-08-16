import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import BreathPacer from '../components/BreathPacer';
import BlueSlider from '../components/BlueSlider';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAmbience } from '../state/AmbienceContext';
import { usePalette } from '../state/PaletteContext';
import { useLog } from '../state/LogContext';
import { usePrefs } from '../state/PrefsContext';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useI18n } from '../state/I18nContext';
import LanguageSwitch from '../components/LanguageSwitch';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
async function wait(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a: number) { const { r,g,b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mix(hex1: string, hex2: string, t: number) { const a=hexToRgb(hex1), b=hexToRgb(hex2); const r=Math.round(a.r+(b.r-a.r)*t), g=Math.round(a.g+(b.g-a.g)*t), bb=Math.round(a.b+(b.b-a.b)*t); return `#${[r,g,bb].map(v=>v.toString(16).padStart(2,'0')).join('')}`; }
function lighten(hex: string, t: number) { return mix(hex, '#ffffff', Math.max(0, Math.min(1, t))); }

type Phase = 'inhale' | 'exhale';

export default function HomeScreen() {
  const { t } = useI18n();

  // cursori
  const [sessionMin, setSessionMin] = useState<number>(5);
  const [bellIntervalSec, setBellIntervalSec] = useState<number>(60);
  const [breathHalfSec, setBreathHalfSec] = useState<number>(5);

  // timer
  const [totalSec, setTotalSec] = useState<number>(sessionMin * 60);
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // respiro
  const [phase, setPhase] = useState<Phase>('inhale');
  const [breathHalfLeft, setBreathHalfLeft] = useState<number>(breathHalfSec);

  // campane
  const [bellLeft, setBellLeft] = useState<number>(bellIntervalSec);

  // audio
  const startSound = useRef<Audio.Sound | null>(null);
  const endSound   = useRef<Audio.Sound | null>(null);

  // contesti
  const ambience = useAmbience();
  const { paletteId, palette } = usePalette();
  const log = useLog();
  const prefs = usePrefs();

  // UI tint
  const ui = useMemo(() => {
    const base = palette.inhale;
    const primary = lighten(base, 0.35);
    return {
      primary,
      ghostBg: withAlpha(primary, 0.12),
      badgeBg: withAlpha(primary, 0.18),
      badgeBorder: primary,
    };
  }, [palette]);

  // haptics
  const IMPACT = { light: Haptics.ImpactFeedbackStyle.Light, medium: Haptics.ImpactFeedbackStyle.Medium, heavy: Haptics.ImpactFeedbackStyle.Heavy } as const;
  const hImpact = () => { if (prefs.hapticsEnabled) Haptics.impactAsync(IMPACT[prefs.hapticsIntensity]); };
  const hSelect = () => { if (prefs.hapticsEnabled) Haptics.selectionAsync(); };

  const [endToast, setEndToast] = useState<string | null>(null);

  // init suoni
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false });
        const { sound: s1 } = await Audio.Sound.createAsync(require('../../assets/sounds/bell_start.mp3'));
        const { sound: s2 } = await Audio.Sound.createAsync(require('../../assets/sounds/bell_end.mp3'));
        if (!mounted) return;
        startSound.current = s1;
        endSound.current   = s2;
        await startSound.current.setVolumeAsync(prefs.bellVolume);
        await endSound.current.setVolumeAsync(prefs.bellVolume);
      } catch (e) { console.warn('Audio init error', e); }
    })();
    return () => { mounted = false; startSound.current?.unloadAsync(); endSound.current?.unloadAsync(); deactivateKeepAwake('session'); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await startSound.current?.setVolumeAsync(prefs.bellVolume);
        await endSound.current?.setVolumeAsync(prefs.bellVolume);
      } catch {}
    })();
  }, [prefs.bellVolume]);

  useEffect(() => {
    setTotalSec(sessionMin * 60);
    setBellLeft(bellIntervalSec);
    setPhase('inhale');
    setBreathHalfLeft(breathHalfSec);
    setRunning(false);
    setCountdown(null);
    setEndToast(null);
    deactivateKeepAwake('session');
  }, [sessionMin, bellIntervalSec, breathHalfSec]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTotalSec(v => (v > 0 ? v - 1 : 0));
      setBreathHalfLeft(v => (v > 0 ? v - 1 : 0));
      setBellLeft(v => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      hSelect();
      const t = setTimeout(() => setCountdown(c => (c! - 1)), 1000);
      return () => clearTimeout(t);
    } else {
      setCountdown(null);
      setRunning(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (running && prefs.keepAwake) activateKeepAwakeAsync('session').catch(()=>{});
    else deactivateKeepAwake('session');
  }, [running, prefs.keepAwake]);

  const loggedRef = useRef(false);
  useEffect(() => {
    if (!running) return;
    if (totalSec === sessionMin * 60) {
      startSound.current?.replayAsync();
      ambience.playIfEnabled();
      loggedRef.current = false;
      hImpact();
    }
    if (totalSec === 0) {
      setRunning(false);
      (async () => {
        if (!loggedRef.current) {
          loggedRef.current = true;
          await log.addEntry({
            dateISO: new Date().toISOString(),
            durationSec: sessionMin * 60,
            breathHalfSec,
            bellIntervalSec,
            paletteId,
            ambience: ambience.enabled ? ambience.type : 'off',
          });
        }
        await ambience.duck(1800, 0.25);
        hImpact();
        const GAP = 900;
        for (let i = 0; i < 3; i++) {
          await endSound.current?.replayAsync();
          if (i < 2) await wait(GAP);
        }
        await ambience.stop();
        deactivateKeepAwake('session');
        setEndToast(t('home.endToast', { min: sessionMin }));
        setTimeout(() => setEndToast(null), 3000);
      })();
    }
  }, [running, totalSec, sessionMin]);

  useEffect(() => {
    if (!running) return;
    if (breathHalfLeft === 0) {
      setPhase(p => (p === 'inhale' ? 'exhale' : 'inhale'));
      setBreathHalfLeft(breathHalfSec);
      hSelect();
    }
  }, [breathHalfLeft, running, breathHalfSec]);

  useEffect(() => {
    if (!running || totalSec === 0) return;
    if (bellLeft === 0) {
      endSound.current?.replayAsync();
      ambience.duck(700, 0.3);
      hSelect();
      setBellLeft(bellIntervalSec);
    }
  }, [bellLeft, running, totalSec, bellIntervalSec]);

  // sfondo animato
  const bgProgress = useSharedValue(0);
  useEffect(() => {
    const to = running ? (phase === 'inhale' ? 1 : 0) : 0;
    bgProgress.value = withTiming(to, { duration: Math.max(300, breathHalfSec * 1000), easing: Easing.bezier(0.25,0.1,0.25,1) });
  }, [phase, breathHalfSec, running]);
  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgProgress.value, [0, 1], [palette.exhale, palette.inhale]),
  }));

  const paused = !running && totalSec !== sessionMin * 60 && totalSec > 0;
  const idle   = !running && totalSec === sessionMin * 60;

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      <SafeAreaView edges={['top','left','right']} style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {paused ? (
              <View style={[styles.badge, { backgroundColor: ui.badgeBg, borderColor: ui.badgeBorder }]}><Text style={[styles.badgeTxt, { color: ui.primary }]}>{t('home.badge.paused')}</Text></View>
            ) : idle ? (
              <View style={styles.badgeDim}><Text style={styles.badgeDimTxt}>{t('home.badge.ready')}</Text></View>
            ) : null}
            <LanguageSwitch />
          </View>
        </View>

        <View style={styles.card} accessible accessibilityLabel="Timer and breath guide">
          <Text style={styles.timer}>{formatTime(totalSec)}</Text>
          <BreathPacer phase={phase} halfSec={breathHalfSec} tint={ui.primary} />

          <View style={styles.controls}>
            {!running && countdown === null ? (
              <Pressable style={[styles.btn, { backgroundColor: ui.primary, borderColor: ui.primary }]} onPress={() => { setCountdown(3); hSelect(); }}>
                <Text style={styles.btnTextOnColor}>{t('home.start')}</Text>
              </Pressable>
            ) : running ? (
              <Pressable style={[styles.btn, { backgroundColor: ui.primary, borderColor: ui.primary }]} onPress={() => { setRunning(false); ambience.stop(); hSelect(); }}>
                <Text style={styles.btnTextOnColor}>{t('home.pause')}</Text>
              </Pressable>
            ) : (
              <Pressable style={[styles.btn, { backgroundColor: ui.ghostBg, borderColor: ui.primary, opacity: 0.9 }]} onPress={() => { setCountdown(null); setRunning(false); }}>
                <Text style={[styles.btnTextGhost, { color: ui.primary }]}>{t('home.cancel')}</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.btn, { backgroundColor: ui.ghostBg, borderColor: ui.primary }]}
              onPress={() => {
                hSelect();
                setCountdown(null); setRunning(false); ambience.stop();
                setTotalSec(sessionMin * 60); setPhase('inhale');
                setBreathHalfLeft(breathHalfSec); setBellLeft(bellIntervalSec);
                deactivateKeepAwake('session');
              }}
            >
              <Text style={[styles.btnTextGhost, { color: ui.primary }]}>{t('home.reset')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Cursori */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('home.duration')}</Text>
          <BlueSlider min={2} max={10} step={1} value={sessionMin} onChange={v=>setSessionMin(Math.round(v))}
            formatValue={(v)=>`${Math.round(v)} min`} snapPoints={[2,5,10]} disabled={running||countdown!==null} tint={ui.primary} />
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('home.bellEvery')}</Text>
          <BlueSlider min={20} max={120} step={5} value={bellIntervalSec} onChange={v=>setBellIntervalSec(Math.round(v))}
            formatValue={(v)=>`${Math.round(v)} s`} snapPoints={[20,60,120]} disabled={running||countdown!==null} tint={ui.primary} />
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>{t('home.breathHalf')}</Text>
          <BlueSlider min={3} max={7} step={0.5} value={breathHalfSec} onChange={v=>setBreathHalfSec(Math.round(v*2)/2)}
            formatValue={(v)=>`${Number(v).toFixed(1)} s`} snapPoints={[3,5,7]} disabled={running||countdown!==null} tint={ui.primary} />
        </View>

        {/* Countdown */}
        {countdown !== null && (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.countdown}>{countdown === 0 ? '' : countdown}</Text>
          </View>
        )}

        {/* Messaggio finale */}
        {endToast && (
          <View style={styles.toast}><Text style={styles.toastTxt}>{endToast}</Text></View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeTxt: { fontWeight: '700' },
  badgeDim: { backgroundColor: '#0f172a', borderColor: '#1f2a44', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeDimTxt: { color: '#94a3b8', fontWeight: '700' },

  card: { backgroundColor: '#111827cc', borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  timer: { color: colors.text, fontSize: 48, fontVariant: ['tabular-nums'], letterSpacing: 1, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },

  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
  btnTextOnColor: { color: '#0b0f14', fontWeight: '700' },
  btnTextGhost:   { fontWeight: '700' },

  sectionTitle:   { color: '#94a3b8', marginTop: 8, marginBottom: 4, fontWeight: '600' },

  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  countdown: { color: '#e5f4ff', fontSize: 88, fontWeight: '800', textShadowColor: '#0006', textShadowRadius: 8 },

  toast: { position: 'absolute', left: 16, right: 16, bottom: 20, backgroundColor: '#0b1220ee', borderColor: '#7dd3fc', borderWidth: 1, borderRadius: 14, padding: 12, alignItems: 'center' },
  toastTxt: { color: '#d7eefc', fontWeight: '700' },
});
