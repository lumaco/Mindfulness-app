import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { useI18n } from '../state/I18nContext';

function hexToRgb(hex: string) { let h=hex.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
function withAlpha(hex: string, a: number) { const { r,g,b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

export default function BreathPacer({
  phase,
  halfSec,
  tint = '#7dd3fc',
}: {
  phase: 'inhale' | 'exhale';
  halfSec: number;
  tint?: string;
}) {
  const { t } = useI18n();
  const p = useSharedValue(phase === 'inhale' ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(phase === 'inhale' ? 1 : 0, {
      duration: Math.max(250, halfSec * 1000),
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [phase, halfSec]);

  const style = useAnimatedStyle(() => {
    const scale = interpolate(p.value, [0, 1], [0.92, 1.12]);
    const op    = interpolate(p.value, [0, 1], [0.85, 1]);
    return { transform: [{ scale }], opacity: op };
  });

  return (
    <View style={s.wrap} accessible accessibilityLabel={`Breath guide, ${phase}`}>
      <Animated.View style={[
        s.circle,
        { backgroundColor: withAlpha(tint, 0.22), borderColor: withAlpha(tint, 0.55) },
        style,
      ]} />
      <Text style={s.caption}>
        {phase === 'inhale' ? t('inhale') : t('exhale')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  circle: { width: 160, height: 160, borderRadius: 999, borderWidth: 2 },
  caption: { color: colors.subtext, marginTop: 10, fontWeight: '600' },
});
