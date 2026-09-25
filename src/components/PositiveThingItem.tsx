import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Theme } from '../theme/theme';

export function PositiveThingItem({ index, value, onChange, onDelete, onMoveUp, onMoveDown, theme }: {
  index: number; value: string; onChange: (value: string) => void; onDelete: () => void; onMoveUp?: () => void; onMoveDown?: () => void; theme: Theme;
}) {
  return <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.line }]}>
    <View style={[styles.number, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontWeight: '700' }}>{index + 1}</Text></View>
    <TextInput value={value} onChangeText={onChange} multiline placeholder="A good thing that happened…" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.ink }]} />
    <View style={styles.actions}>
      {onMoveUp && <Pressable onPress={onMoveUp} accessibilityLabel={`Move item ${index + 1} up`} style={styles.action}><Text style={{ color: theme.muted }}>↑</Text></Pressable>}
      {onMoveDown && <Pressable onPress={onMoveDown} accessibilityLabel={`Move item ${index + 1} down`} style={styles.action}><Text style={{ color: theme.muted }}>↓</Text></Pressable>}
      <Pressable onPress={onDelete} accessibilityLabel={`Delete item ${index + 1}`} style={styles.action}><Text style={{ color: theme.muted, fontSize: 18 }}>×</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  number: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  input: { flex: 1, fontSize: 15, lineHeight: 22, minHeight: 40, paddingVertical: 8 },
  actions: { alignItems: 'center' },
  action: { minWidth: 28, minHeight: 24, justifyContent: 'center', alignItems: 'center' },
});
