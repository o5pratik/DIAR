import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accountConfigured, supabase } from '../auth/supabase';
import { Theme, serif } from '../theme/theme';

type Props = { theme: Theme; onSignedIn: () => Promise<void> };

export function AccountScreen({ theme, onSignedIn }: Props) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function sendCode() {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setMessage('Enter a valid email address.'); return; }
    if (!supabase) { setMessage('Account service is not configured yet.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } });
      if (error) throw error;
      setEmail(address);
      setCode('');
      setStage('code');
      setMessage('Check your email for a six digit sign in code.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not send a code.'); }
    finally { setBusy(false); }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code.trim())) { setMessage('Enter the six digit code from your email.'); return; }
    if (!supabase) return;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
      if (error) throw error;
      await onSignedIn();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.accent }]}>DIAR <Text style={{ color: theme.gold }}>✦</Text></Text>
        <View style={[styles.mark, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.gold, fontSize: 31 }}>✦</Text></View>
        <Text style={[styles.heading, { color: theme.ink }]}>{stage === 'email' ? 'Your private space starts here' : 'Check your email'}</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>{stage === 'email' ? 'Sign in with your email. Your diary entries stay encrypted on this device.' : `Enter the six digit code sent to ${email}.`}</Text>
        {!accountConfigured ? <Text style={[styles.message, { color: theme.danger }]}>Email sign in needs a Supabase Project URL and publishable key in the app build.</Text> : <>
          {stage === 'email' ? <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]} onSubmitEditing={() => void sendCode()} /> : <TextInput accessibilityLabel="Six digit email code" autoComplete="one-time-code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} placeholder="6 digit code" placeholderTextColor={theme.muted} style={[styles.input, styles.code, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]} onSubmitEditing={() => void verifyCode()} />}
          {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: message.startsWith('Check') ? theme.accent : theme.danger }]}>{message}</Text>}
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void (stage === 'email' ? sendCode() : verifyCode())} style={[styles.button, { backgroundColor: theme.accent, opacity: busy ? 0.7 : 1 }]}>{busy ? <ActivityIndicator color={theme.surface} /> : <Text style={{ color: theme.surface, fontSize: 16, fontWeight: '700' }}>{stage === 'email' ? 'Continue with email' : 'Verify code'}</Text>}</Pressable>
          {stage === 'code' && <View style={styles.actions}><Pressable disabled={busy} onPress={() => { setStage('email'); setMessage(''); }}><Text style={{ color: theme.accent, fontWeight: '600' }}>Change email</Text></Pressable><Pressable disabled={busy} onPress={() => void sendCode()}><Text style={{ color: theme.accent, fontWeight: '600' }}>Resend code</Text></Pressable></View>}
        </>}
        <Text style={[styles.privacy, { color: theme.muted }]}>No ads, no subscription. Your diary is stored on your device.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { flexGrow: 1, paddingHorizontal: 27, paddingBottom: 30 },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 3, marginTop: 18 },
  mark: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 120, marginBottom: 24 },
  heading: { fontFamily: serif, fontSize: 32, lineHeight: 39, textAlign: 'center' },
  copy: { fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 12, marginBottom: 26 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16 },
  code: { textAlign: 'center', fontSize: 25, letterSpacing: 6 },
  message: { textAlign: 'center', marginTop: 16, lineHeight: 20 },
  button: { minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  privacy: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 'auto', paddingTop: 50 },
});
