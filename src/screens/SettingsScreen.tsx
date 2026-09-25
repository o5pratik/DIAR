import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, ThemePreference, serif } from '../theme/theme';

type Props = {
  theme: Theme; preference: ThemePreference; onPreference: (value: ThemePreference) => Promise<void>;
  biometricAvailable: boolean; biometricEnabled: boolean; onBiometric: (value: boolean) => Promise<void>;
  onBack: () => void; onChangePin: () => void; onLock: () => void;
  onExport: (passphrase: string) => Promise<void>; onImport: (passphrase: string) => Promise<void>; onDelete: () => Promise<void>;
  accountEmail: string; onSignOut: () => Promise<void>; onDeleteAccount: () => Promise<void>;
};

export function SettingsScreen({ theme, preference, onPreference, biometricAvailable, biometricEnabled, onBiometric, onBack, onChangePin, onLock, onExport, onImport, onDelete, accountEmail, onSignOut, onDeleteAccount }: Props) {
  const [backupMode, setBackupMode] = useState<'export' | 'import' | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function runBackup() {
    if (!backupMode) return;
    if (backupMode === 'export' && passphrase.length < 8) { setMessage('Use at least 8 characters.'); return; }
    setBusy(true); setMessage('');
    try {
      if (backupMode === 'export') await onExport(passphrase);
      else await onImport(passphrase);
      setBackupMode(null); setPassphrase('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The backup could not be opened.'); }
    finally { setBusy(false); }
  }

  function confirmDelete() {
    Alert.alert('Delete your diary?', 'This will permanently remove every entry and your PIN from this device. This cannot be undone.', [
      { text: 'Keep diary', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: () => void onDelete().catch(() => Alert.alert('Could not delete', 'Please try again.')) },
    ]);
  }

  function confirmAccountDelete() {
    Alert.alert('Delete your DIAR account?', 'Your account, diary on this device, and PIN will be permanently deleted. Export an encrypted backup first if you want to keep your writing.', [
      { text: 'Keep account', style: 'cancel' },
      { text: 'Delete account and diary', style: 'destructive', onPress: () => void onDeleteAccount().catch(error => Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.')) },
    ]);
  }

  function row(label: string, detail: string, action: () => void, destructive = false) {
    return <Pressable onPress={action} style={[styles.row, { borderColor: theme.line }]}><View style={{ flex: 1 }}><Text style={{ color: destructive ? theme.danger : theme.ink, fontSize: 16, fontWeight: '600' }}>{label}</Text><Text style={{ color: theme.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>{detail}</Text></View><Text style={{ color: theme.muted, fontSize: 20 }}>›</Text></Pressable>;
  }

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={{ color: theme.accent, fontSize: 17 }}>‹  Diary</Text></Pressable><Text style={[styles.heading, { color: theme.ink }]}>Settings</Text><View style={{ width: 65 }} /></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[styles.groupTitle, { color: theme.accent }]}>PRIVACY & SECURITY</Text>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {row('Change PIN', 'Choose a new 4 or 6 digit PIN.', onChangePin)}
        <View style={[styles.row, { borderColor: theme.line }]}><View style={{ flex: 1 }}><Text style={{ color: theme.ink, fontSize: 16, fontWeight: '600' }}>Biometric unlock</Text><Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{biometricAvailable ? 'Use Face ID or fingerprint after opening the app.' : 'Not available on this device.'}</Text></View><Switch value={biometricEnabled} disabled={!biometricAvailable} onValueChange={value => void onBiometric(value).catch(() => Alert.alert('Could not update', 'Please try again.'))} trackColor={{ true: theme.accent }} /></View>
        {row('Lock now', 'Return to the PIN screen.', onLock)}
      </View>

      <Text style={[styles.groupTitle, { color: theme.accent }]}>APPEARANCE</Text>
      <View style={[styles.group, styles.themeRow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {(['system', 'light', 'dark'] as const).map(option => <Pressable key={option} onPress={() => void onPreference(option).catch(() => Alert.alert('Could not update', 'Please try again.'))} style={[styles.themeOption, { backgroundColor: preference === option ? theme.accentSoft : 'transparent' }]}><Text style={{ color: preference === option ? theme.accent : theme.muted, fontWeight: '700' }}>{option[0].toUpperCase() + option.slice(1)}</Text></Pressable>)}
      </View>

      <Text style={[styles.groupTitle, { color: theme.accent }]}>YOUR DATA</Text>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        {row('Export encrypted backup', 'Protect a portable copy with a passphrase.', () => { setMessage(''); setBackupMode('export'); })}
        {row('Import backup', 'Replace this diary with an encrypted backup.', () => { setMessage(''); setBackupMode('import'); })}
        {row('Delete all diary data', 'Permanently erase this device’s diary.', confirmDelete, true)}
      </View>

      <Text style={[styles.groupTitle, { color: theme.accent }]}>ACCOUNT</Text>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.row, { borderColor: theme.line }]}><View><Text style={{ color: theme.ink, fontSize: 16, fontWeight: '600' }}>Signed in</Text><Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>{accountEmail}</Text></View></View>
        {row('Sign out', 'Your diary stays on this device and remains linked to this email.', () => void onSignOut().catch(error => Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.')))}
        {row('Delete account and local diary', 'Permanently remove your account and this device’s diary.', confirmAccountDelete, true)}
      </View>

      <View style={[styles.about, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.accent, fontWeight: '800', letterSpacing: 1.5, fontSize: 11 }}>ABOUT DIAR</Text><Text style={[styles.aboutText, { color: theme.ink }]}>A quiet place to put your thoughts.</Text><Text style={{ color: theme.muted, marginTop: 8, lineHeight: 20 }}>Your diary stays on your device. No ads, purchases, or analytics.</Text><Text style={{ color: theme.muted, fontSize: 11, marginTop: 15 }}>Version 1.0.0</Text></View>
    </ScrollView>
    <Modal visible={backupMode !== null} transparent animationType="fade" onRequestClose={() => { if (!busy) setBackupMode(null); }}>
      <View style={styles.overlay}><View style={[styles.dialog, { backgroundColor: theme.surface }]}>
        <Text style={[styles.dialogTitle, { color: theme.ink }]}>{backupMode === 'export' ? 'Protect your backup' : 'Open a backup'}</Text>
        <Text style={{ color: theme.muted, lineHeight: 20, marginTop: 7 }}>{backupMode === 'export' ? 'Choose a passphrase you’ll remember. You’ll need it to import this backup.' : 'Enter the passphrase used when the backup was made. Import will replace your current diary after confirmation.'}</Text>
        <TextInput secureTextEntry value={passphrase} onChangeText={setPassphrase} placeholder="Backup passphrase" placeholderTextColor={theme.muted} style={[styles.passphrase, { color: theme.ink, borderColor: theme.line }]} />
        {!!message && <Text style={{ color: theme.danger, marginTop: 9 }}>{message}</Text>}
        <View style={styles.dialogActions}><Pressable disabled={busy} onPress={() => { setBackupMode(null); setPassphrase(''); }} style={styles.dialogAction}><Text style={{ color: theme.muted }}>Cancel</Text></Pressable><Pressable disabled={busy} onPress={() => void runBackup()} style={[styles.dialogAction, { backgroundColor: theme.accent, borderRadius: 10 }]}><Text style={{ color: theme.surface, fontWeight: '700' }}>{busy ? 'Working…' : backupMode === 'export' ? 'Export' : 'Choose file'}</Text></Pressable></View>
      </View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 21, paddingVertical: 15 }, back: { width: 65 }, heading: { fontFamily: serif, fontSize: 22 }, content: { padding: 20, paddingBottom: 50 },
  groupTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginTop: 16, marginBottom: 11 }, group: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'center', padding: 17, borderBottomWidth: StyleSheet.hairlineWidth, minHeight: 68 },
  themeRow: { flexDirection: 'row', padding: 6 }, themeOption: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 }, about: { borderRadius: 18, padding: 20, marginTop: 18 }, aboutText: { fontFamily: serif, fontSize: 20, marginTop: 10 },
  overlay: { flex: 1, backgroundColor: '#0009', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', borderRadius: 22, padding: 22 }, dialogTitle: { fontFamily: serif, fontSize: 24 }, passphrase: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 20, fontSize: 16 }, dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 19, gap: 8 }, dialogAction: { paddingVertical: 11, paddingHorizontal: 16 },
});
