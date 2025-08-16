import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useI18n } from '../state/I18nContext';
import { usePalette } from '../state/PaletteContext';

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a:number){ const {r,g,b}=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

export default function LanguageSwitch() {
  const { lang, toggleLang } = useI18n();
  const { palette } = usePalette();
  const bg = useMemo(()=>withAlpha(palette.inhale,0.12),[palette]);
  const border = palette.inhale;

  // Mostra la lingua verso cui passerai: EN quando sei in IT, IT quando sei in EN
  const label = lang === 'it' ? 'EN' : 'IT';
  const a11y = lang === 'it' ? 'Cambia lingua: English' : 'Change language: Italiano';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={toggleLang}
      style={[s.btn,{ backgroundColor: bg, borderColor: border }]}
    >
      <Text style={[s.txt,{ color: border }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  txt: { fontWeight: '800', letterSpacing: 0.5 },
});
