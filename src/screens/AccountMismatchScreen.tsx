import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, serif } from '../theme/theme';

type Props = { theme: Theme; email: string; onSignOut: () => Promise<void>; onErase: () => Promise<void> };

export function AccountMismatchScreen({ theme, email, onSignOut, onErase }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true); setError('');
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <View style={styles.content}>
      <Text style={[styles.heading, { color: theme.ink }]}>A diary is already on this device</Text>
      <Text style={[styles.copy, { color: theme.muted }]}>This diary belongs to another DIAR account. Sign in with its email, or erase the local diary before using {email}.</Text>
      {!!error && <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.danger }]}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run(onSignOut)} style={[styles.button, { backgroundColor: theme.accent }]}><Text style={{ color: theme.surface, textAlign: 'center', fontWeight: '700' }}>Sign in with another email</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => Alert.alert('Erase local diary?', 'Every entry and the PIN on this device will be permanently deleted. Export a backup from the original account first if needed.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase local diary', style: 'destructive', onPress: () => void run(onErase) },
      ])} style={styles.erase}><Text style={{ color: theme.danger, textAlign: 'center' }}>Erase local diary</Text></Pressable>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { flex: 1, padding: 30, justifyContent: 'center' },
  heading: { fontFamily: serif, fontSize: 29, textAlign: 'center' },
  copy: { marginTop: 16, textAlign: 'center', lineHeight: 22 },
  error: { marginTop: 14, textAlign: 'center' },
  button: { padding: 18, marginTop: 30, borderRadius: 15 }, erase: { padding: 18, marginTop: 12 },
});
