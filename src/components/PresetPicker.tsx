import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { PRESETS } from '../logic/presets';

export default function PresetPicker({ value, onChange }: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {PRESETS.map(p => (
        <Pressable
          key={p.id}
          onPress={() => onChange(p.id)}
          style={[styles.item, value === p.id && styles.itemActive]}
        >
          <Text style={styles.itemTitle}>{p.label}</Text>
          <Text style={styles.itemSub}>{p.durationMin} min</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  item: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    width: '47%',
  },
  itemActive: {
    borderColor: colors.primary,
  },
  itemTitle: { color: colors.text, fontWeight: '600' },
  itemSub: { color: colors.subtext, marginTop: 4, fontSize: 12 },
});