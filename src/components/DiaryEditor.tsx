import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Theme, serif } from '../theme/theme';

export function DiaryEditor({ value, onChange, onFocus, onBlur, placeholder, theme }: { value: string; onChange: (text: string) => void; onFocus: (node: number) => void; onBlur: () => void; placeholder: string; theme: Theme }) {
  return <View style={[styles.paper, { backgroundColor: theme.surface, borderColor: theme.line }]}>
    <TextInput multiline value={value} onChangeText={onChange} onFocus={event => onFocus(event.nativeEvent.target)} onBlur={onBlur} placeholder={placeholder} placeholderTextColor={theme.muted} textAlignVertical="top" scrollEnabled autoCorrect autoCapitalize="sentences" style={[styles.input, { color: theme.ink }]} />
  </View>;
}

const styles = StyleSheet.create({
  paper: { borderRadius: 22, borderWidth: 1, padding: 21, minHeight: 295 },
  input: { fontFamily: serif, fontSize: 17, lineHeight: 28, height: 250 },
});
