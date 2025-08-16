import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Animated, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

// util semplici per alpha
function hexToRgb(hex: string) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function withAlpha(hex: string, a: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export default function BlueSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  formatValue = (v: number) => String(v),
  snapPoints = [],
  showTicks = true,
  tint, // NUOVO
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  formatValue?: (v: number) => string;
  snapPoints?: number[];
  showTicks?: boolean;
  tint?: string;            // colore principale (se assente, usa theme primary)
}) {
  const themeTint = tint ?? colors.primary;
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const ratio = useMemo(() => (value - min) / (max - min), [value, min, max]);
  const activeW = Math.max(0, Math.min(1, ratio)) * width;

  const [dragging, setDragging] = useState(false);
  const pillOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pillOpacity, {
      toValue: dragging ? 1 : 0,
      duration: dragging ? 80 : 160,
      useNativeDriver: true,
    }).start();
  }, [dragging]);

  const ticks = (showTicks ? snapPoints : []).map((p) => ({
    key: String(p),
    left: ((p - min) / (max - min)) * width,
  }));

  return (
    <View pointerEvents={disabled ? 'none' : 'auto'}>
      <View onLayout={onLayout} style={s.trackBox}>
        <View style={s.trackBase} />
        <View style={[s.trackActive, { width: activeW, backgroundColor: themeTint }]} />
        {ticks.map(t => (
          <View key={t.key} style={[s.tick, { left: t.left - 1, backgroundColor: withAlpha(themeTint, 0.6) }]} />
        ))}
        <Animated.View style={[s.pill, { left: Math.max(0, Math.min(activeW, width - 42)) - 8, opacity: pillOpacity, borderColor: withAlpha(themeTint, 0.6) }] }>
          <Text style={s.pillText}>{formatValue(value)}</Text>
        </Animated.View>
      </View>

      <Slider
        style={s.native}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={(v) => { setDragging(true); onChange(typeof v === 'number' ? v : (v as any)); }}
        onSlidingComplete={() => { setDragging(false); Haptics.selectionAsync(); }}
        minimumTrackTintColor="transparent"
        maximumTrackTintColor="transparent"
        thumbTintColor={Platform.OS === 'android' ? themeTint : undefined}
        accessibilityRole="adjustable"
        disabled={disabled}
      />
    </View>
  );
}

const s = StyleSheet.create({
  trackBox: { height: 32, justifyContent: 'center' },
  trackBase: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 999, backgroundColor: 'rgba(148,163,184,0.25)' },
  trackActive: { position: 'absolute', left: 0, height: 8, borderRadius: 999 },
  tick: { position: 'absolute', top: 12, width: 2, height: 8, borderRadius: 1 },
  native: { position: 'absolute', left: -8, right: -8, top: 0, bottom: 0 },
  pill: { position: 'absolute', top: -30, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(17,24,39,0.75)', borderWidth: 1 },
  pillText: { color: '#e5e7eb', fontVariant: ['tabular-nums'], fontSize: 12 },
});
