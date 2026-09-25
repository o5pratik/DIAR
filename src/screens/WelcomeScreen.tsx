import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, serif } from '../theme/theme';

export function WelcomeScreen({ theme, onContinue }: { theme: Theme; onContinue: () => void }) {
  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <Text style={[styles.brand, { color: theme.accent }]}>DIAR <Text style={{ color: theme.gold }}>✦</Text></Text>
    <View style={styles.middle}>
      <View style={[styles.book, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.spine, { backgroundColor: theme.accentSoft }]} />
        <Text style={{ color: theme.gold, fontSize: 33, marginBottom: 22 }}>✦</Text>
        <View style={[styles.line, { backgroundColor: theme.line, width: 95 }]} />
        <View style={[styles.line, { backgroundColor: theme.line, width: 112 }]} />
        <View style={[styles.line, { backgroundColor: theme.line, width: 70 }]} />
      </View>
      <Text style={[styles.title, { color: theme.ink }]}>A quiet place for{ '\n' }your thoughts.</Text>
      <Text style={[styles.copy, { color: theme.muted }]}>The ordinary days, the bright moments, and the life you’re becoming. Keep them all here.</Text>
    </View>
    <View style={styles.bottom}>
      <Pressable onPress={onContinue} style={[styles.button, { backgroundColor: theme.accent }]}><Text style={{ color: theme.surface, fontWeight: '700', fontSize: 16 }}>Create my private diary  →</Text></Pressable>
      <Text style={[styles.privacy, { color: theme.muted }]}>Your diary stays on your device.</Text>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 27 }, brand: { fontSize: 18, fontWeight: '800', letterSpacing: 3, marginTop: 18 }, middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  book: { width: 194, height: 236, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }], marginBottom: 53, overflow: 'hidden' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 19 }, line: { height: 2, borderRadius: 1, marginTop: 10 },
  title: { fontFamily: serif, fontSize: 35, lineHeight: 43, textAlign: 'center' }, copy: { textAlign: 'center', fontSize: 15, lineHeight: 24, marginTop: 18, maxWidth: 330 },
  bottom: { paddingBottom: 20 }, button: { borderRadius: 16, padding: 18, alignItems: 'center' }, privacy: { textAlign: 'center', fontSize: 12, marginTop: 18 },
});
