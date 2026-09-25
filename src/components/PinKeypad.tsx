import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';

type Props = { value: string; length: 4 | 6; onDigit: (digit: string) => void; onDelete: () => void; theme: Theme; busy?: boolean };

export function PinKeypad({ value, length, onDigit, onDelete, theme, busy }: Props) {
  return <View>
    <View style={styles.dots} accessibilityLabel={`${value.length} of ${length} digits entered`}>
      {Array.from({ length }, (_, i) => <View key={i} style={[styles.dot, { borderColor: theme.accent, backgroundColor: i < value.length ? theme.accent : 'transparent' }]} />)}
    </View>
    <View style={styles.grid}>
      {['1','2','3','4','5','6','7','8','9','','0','delete'].map((key, i) => key ? <Pressable
        key={i} accessibilityRole="button" accessibilityLabel={key === 'delete' ? 'Delete last digit' : key}
        disabled={busy} onPress={() => key === 'delete' ? onDelete() : onDigit(key)}
        style={({ pressed }) => [styles.key, { backgroundColor: pressed ? theme.surfaceAlt : 'transparent' }]}>
        <Text style={[styles.keyText, { color: theme.ink }, key === 'delete' && styles.delete]}>{key === 'delete' ? '⌫' : key}</Text>
      </Pressable> : <View key={i} style={styles.key} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 30, marginBottom: 28 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  grid: { width: 270, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap' },
  key: { width: 90, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 36 },
  keyText: { fontSize: 27, fontWeight: '300' },
  delete: { fontSize: 30 },
});
