import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Theme, serif } from '../theme/theme';

export function DiaryEditor({ value, onChange, placeholder, theme }: { value: string; onChange: (text: string) => void; placeholder: string; theme: Theme }) {
  return <View style={[styles.paper, { backgroundColor: theme.surface, borderColor: theme.line }]}>
    <TextInput multiline value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={theme.muted} textAlignVertical="top" scrollEnabled={false} autoCorrect autoCapitalize="sentences" style={[styles.input, { color: theme.ink }]} />
  </View>;
}

const styles = StyleSheet.create({
  paper: { borderRadius: 22, borderWidth: 1, padding: 21, minHeight: 295 },
  input: { fontFamily: serif, fontSize: 17, lineHeight: 28, minHeight: 250 },
});
