import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch, ScrollView, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette } from '../state/PaletteContext';
import { PALETTES } from '../theme/palettes';
import { useAmbience } from '../state/AmbienceContext';
import BlueSlider from '../components/BlueSlider';
import { colors } from '../theme';
import { usePrefs } from '../state/PrefsContext';
import HelpScreen from './HelpScreen';
import { useI18n } from '../state/I18nContext';

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a: number) { const { r,g,b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lighten(hex: string, t: number) { const a=hexToRgb(hex), b={r:255,g:255,b:255}; const m=(x:number,y:number)=>Math.round(x+(y-x)*t); return `#${[m(a.r,b.r),m(a.g,b.g),m(a.b,b.b)].map(v=>v.toString(16).padStart(2,'0')).join('')}`; }

export default function SettingsScreen() {
  const { paletteId, setPaletteId, palette } = usePalette();
  const amb = useAmbience();
  const prefs = usePrefs();
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useI18n();

  const ui = useMemo(() => {
    const primary = lighten(palette.inhale, 0.35);
    return { primary, ghostBg: withAlpha(primary, 0.12), activeRow: { borderColor: primary, backgroundColor: withAlpha(primary, 0.08) }, switchTrue: withAlpha(primary, 0.55) };
  }, [palette]);

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{t('settings.title')}</Text>

        {/* Palette */}
        <Pressable onPress={() => setPaletteOpen(v => !v)} style={s.sectionHeader} accessibilityRole="button">
          <Text style={s.section}>{t('settings.palette')}</Text>
          <Ionicons name={paletteOpen ? 'chevron-down' : 'chevron-forward'} size={18} color="#94a3b8" />
        </Pressable>

        {paletteOpen && (
          <View style={{ gap: 10 }}>
            {PALETTES.map(p => (
              <Pressable key={p.id} onPress={() => setPaletteId(p.id)} style={[s.row, paletteId === p.id && [s.rowActive, ui.activeRow]]} accessibilityRole="button">
                <View style={[s.swatch, { backgroundColor: p.exhale }]} />
                <View style={[s.swatch, { backgroundColor: p.inhale }]} />
                <Text style={s.label}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Ambience */}
        <Text style={[s.section, { marginTop: 18 }]}>{t('settings.ambience')}</Text>
        <View style={s.rowSplit}>
          <Text style={s.label}>{t('settings.ambience.sound')}</Text>
          <View style={s.switchWrap}>
            <Switch value={amb.enabled} onValueChange={amb.setEnabled} style={s.switchNative}
              trackColor={{ false: '#223042', true: ui.switchTrue }} thumbColor={Platform.OS === 'android' ? '#e5f4ff' : undefined} />
          </View>
        </View>

        {amb.enabled && (
          <View style={{ gap: 10, marginTop: 8 }}>
            {([['ocean','Mare leggero / Ocean'],['rain','Pioggia soft / Rain'],['forest','Bosco tenue / Forest'],['brown','Brown noise']] as const).map(([id, label]) => (
              <Pressable key={id} onPress={() => amb.setType(id as any)} style={[s.row, amb.type === id && [s.rowActive, ui.activeRow]]}><Text style={s.label}>{label}</Text></Pressable>
            ))}
            <Text style={[s.section, { marginTop: 6 }]}>{t('settings.ambience.volume')}</Text>
            <BlueSlider min={0} max={100} step={1} value={Math.round(amb.volume * 100)} onChange={v => amb.setVolume(v / 100)}
              formatValue={(v) => `${Math.round(Number(v))}%`} snapPoints={[0,25,50,75,100]} tint={ui.primary} />
          </View>
        )}

        {/* Haptics */}
        <Text style={[s.section, { marginTop: 18 }]}>{t('settings.haptics')}</Text>
        <View style={s.rowSplit}>
          <Text style={s.label}>{t('settings.haptics.feedback')}</Text>
          <View style={s.switchWrap}>
            <Switch value={prefs.hapticsEnabled} onValueChange={prefs.setHapticsEnabled} style={s.switchNative}
              trackColor={{ false: '#223042', true: ui.switchTrue }} thumbColor={Platform.OS === 'android' ? '#e5f4ff' : undefined} />
          </View>
        </View>
        <View style={[s.row, { gap: 8, flexWrap: 'wrap' }]}>
          {([['light',t('settings.haptics.intensity.light')],['medium',t('settings.haptics.intensity.medium')],['heavy',t('settings.haptics.intensity.heavy')]] as const).map(([id, label]) => {
            const active = prefs.hapticsIntensity === id;
            return (
              <Pressable key={id} onPress={() => prefs.setHapticsIntensity(id as any)} style={[s.chip, active && { borderColor: ui.primary, backgroundColor: ui.ghostBg }]}>
                <Text style={[s.chipText, active && { color: '#e5e7eb' }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Campane */}
        <Text style={[s.section, { marginTop: 18 }]}>{t('settings.bells')}</Text>
        <View style={s.row}><View style={{ flex: 1 }}>
          <Text style={s.label}>{t('settings.bells.volume')}</Text>
          <BlueSlider min={0} max={100} step={1} value={Math.round(prefs.bellVolume * 100)} onChange={v => prefs.setBellVolume(Number(v)/100)}
            formatValue={(v)=>`${Math.round(Number(v))}%`} snapPoints={[0,25,50,75,100]} tint={lighten(palette.inhale,0.35)} />
        </View></View>

        {/* Schermo */}
        <Text style={[s.section, { marginTop: 18 }]}>{t('settings.screen')}</Text>
        <View style={s.rowSplit}>
          <Text style={s.label}>{t('settings.screen.keepAwake')}</Text>
          <View style={s.switchWrap}>
            <Switch value={prefs.keepAwake} onValueChange={prefs.setKeepAwake} style={s.switchNative}
              trackColor={{ false: '#223042', true: ui.switchTrue }} thumbColor={Platform.OS === 'android' ? '#e5f4ff' : undefined} />
          </View>
        </View>

        {/* Help */}
        <Text style={[s.section, { marginTop: 18 }]}>{t('settings.help')}</Text>
        <Pressable onPress={() => setShowHelp(true)} style={[s.row, { borderColor: ui.primary }]}>
          <Text style={[s.label, { color: '#e5e7eb' }]}>{t('settings.help.open')}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={showHelp} animationType="slide" onRequestClose={() => setShowHelp(false)}>
        <HelpScreen onClose={() => setShowHelp(false)} />
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 96 },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  section: { color: '#94a3b8', fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, minHeight: 56 },
  rowSplit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12, paddingRight: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, minHeight: 56, overflow: 'hidden' },
  rowActive: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },

  switchWrap: { width: 64, height: 28, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 2 },
  switchNative: Platform.select({ android: { transform: [{ scaleX: 0.92 }, { scaleY: 0.92 }] } }) as any,

  swatch: { width: 28, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#00000033' },
  label: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },

  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: '#0e141b' },
  chipText: { color: '#94a3b8', fontWeight: '600' },
});
