import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../theme/theme';

export type Tab = 'whatsGoingOn' | 'positiveThings' | 'manifestation';
const tabs: { key: Tab; label: string }[] = [
  { key: 'whatsGoingOn', label: 'What’s Going On' },
  { key: 'positiveThings', label: 'Positive Things' },
  { key: 'manifestation', label: 'Manifestation' },
];

export function TopTabs({ active, onChange, theme }: { active: Tab; onChange: (tab: Tab) => void; theme: Theme }) {
  return <View style={[styles.tabs, { borderColor: theme.line }]}>{tabs.map(tab => <Pressable key={tab.key} onPress={() => onChange(tab.key)} accessibilityRole="tab" accessibilityState={{ selected: active === tab.key }} style={[styles.tab, active === tab.key && { borderBottomColor: theme.accent }]}>
    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, { color: active === tab.key ? theme.ink : theme.muted, fontWeight: active === tab.key ? '700' : '500' }]}>{tab.label}</Text>
  </Pressable>)}</View>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 13 },
  tab: { flex: 1, minWidth: 0, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: 'transparent', alignItems: 'center' },
  label: { fontSize: 12, textAlign: 'center', paddingHorizontal: 2 },
});
