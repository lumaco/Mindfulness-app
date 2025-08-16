import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '../state/PaletteContext';
import { colors } from '../theme';
import { useI18n } from '../state/I18nContext';

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a:number){ const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

export default function HelpScreen({ onClose }: { onClose?: () => void }) {
  const { palette } = usePalette();
  const { t } = useI18n();
  const primary = palette.inhale;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: palette.exhale }]}>
      <View style={s.header}>
        <Text style={s.title}>{t('help.title')}</Text>
        {onClose && (
          <Pressable onPress={onClose} style={[s.btn, { borderColor: primary, backgroundColor: withAlpha(primary, 0.12) }]}>
            <Text style={[s.btnText, { color: primary }]}>{t('help.close')}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={s.h2}>{t('help.pre')}</Text>
        <Text style={s.p}>{t('help.pre.p')}</Text>

        <Text style={s.h2}>{t('help.during')}</Text>
        <Text style={s.p}>{t('help.during.p')}</Text>

        <Text style={s.h2}>{t('help.mind')}</Text>
        <Text style={s.p}>{t('help.mind.p')}</Text>

        <Text style={s.h2}>{t('help.audio')}</Text>
        <Text style={s.p}>{t('help.audio.p')}</Text>

        <Text style={s.h2}>{t('help.cont')}</Text>
        <Text style={s.p}>{t('help.cont.p')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  h2: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  p: { color: '#94a3b8', fontSize: 16, lineHeight: 22 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  btnText: { fontWeight: '700' },
});
