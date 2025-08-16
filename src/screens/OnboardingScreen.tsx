import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '../state/PaletteContext';
import { colors } from '../theme';
import { useI18n } from '../state/I18nContext';
import LanguageSwitch from '../components/LanguageSwitch';

const { width } = Dimensions.get('window');

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a: number) { const { r,g,b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function lighten(hex: string, t: number) { const a=hexToRgb(hex), b={r:255,g:255,b:255}; const m=(x:number,y:number)=>Math.round(x+(y-x)*t); return `#${[m(a.r,b.r),m(a.g,b.g),m(a.b,b.b)].map(v=>v.toString(16).padStart(2,'0')).join('')}`; }

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { palette } = usePalette();
  const { t } = useI18n();
  const primary = useMemo(() => lighten(palette.inhale, 0.35), [palette]);
  const ghostBg = withAlpha(primary, 0.12);

  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(p);
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: palette.exhale }]}>
      {/* top-right language switch */}
      <View style={{ alignItems: 'flex-end' }}><LanguageSwitch /></View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} ref={ref} contentContainerStyle={{ alignItems: 'stretch' }}>
        <View style={[s.slide, { width }]}>
          <Text style={s.title}>{t('onb.welcome')}</Text>
          <Text style={s.text}>{t('onb.w1')}</Text>
          <View style={s.bullets}>
            <Text style={s.bullet}>{t('onb.b1')}</Text>
            <Text style={s.bullet}>{t('onb.b2')}</Text>
            <Text style={s.bullet}>{t('onb.b3')}</Text>
          </View>
        </View>

        <View style={[s.slide, { width }]}>
          <Text style={s.title}>{t('onb.tips')}</Text>
          <Text style={s.text}>{t('onb.w2a')}</Text>
          <Text style={[s.text, { marginTop: 8 }]}>{t('onb.w2b')}</Text>
        </View>
      </ScrollView>

      <View style={s.dots}>
        {[0,1].map(i => (<View key={i} style={[s.dot, { backgroundColor: i===page ? primary : '#344155' }]} />))}
      </View>

      <View style={s.actions}>
        {page === 0 ? (
          <Pressable style={[s.btn, { backgroundColor: ghostBg, borderColor: primary }]} onPress={() => ref.current?.scrollTo({ x: width, animated: true })}>
            <Text style={[s.btnGhostText, { color: primary }]}>{t('onb.next')}</Text>
          </Pressable>
        ) : (
          <Pressable style={[s.btn, { backgroundColor: primary, borderColor: primary }]} onPress={onDone}>
            <Text style={s.btnTextOn}>{t('onb.start')}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  slide: { flex: 1, justifyContent: 'center', gap: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  text: { color: '#94a3b8', fontSize: 16, lineHeight: 22 },
  bullets: { gap: 6 },
  bullet: { color: '#94a3b8', fontSize: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 14 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  actions: { alignItems: 'center' },
  btn: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1 },
  btnTextOn: { color: '#0b0f14', fontWeight: '800' },
  btnGhostText: { fontWeight: '700' },
});
