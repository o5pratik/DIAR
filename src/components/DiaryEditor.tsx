import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme, serif } from '../theme/theme';

export function DiaryEditor({ value, onPress, placeholder, theme }: { value: string; onPress: () => void; placeholder: string; theme: Theme }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={value ? 'Edit diary entry' : placeholder} style={[styles.paper, { backgroundColor: theme.surface, borderColor: theme.line }]}>
    <Text numberOfLines={8} style={[styles.preview, { color: value ? theme.ink : theme.muted }]}>{value || placeholder}</Text>
    <View style={styles.hintRow}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>Tap to write  ↗</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  paper: { borderRadius: 22, borderWidth: 1, padding: 21, minHeight: 295 },
  preview: { fontFamily: serif, fontSize: 17, lineHeight: 28 },
  hintRow: { marginTop: 'auto', alignItems: 'flex-end', paddingTop: 15 },
});
