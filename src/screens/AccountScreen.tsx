import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accountConfigured, authRedirectUrl, supabase } from '../auth/supabase';
import { Theme, serif } from '../theme/theme';

type Props = { theme: Theme };

export function AccountScreen({ theme }: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function sendLink() {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setMessage('Enter a valid email address.'); return; }
    if (!supabase) { setMessage('Account service is not configured yet.'); return; }
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true, emailRedirectTo: authRedirectUrl } });
      if (error) throw error;
      setEmail(address);
      setSent(true);
      setMessage('Check your email and open the sign in link on this device.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not send a sign in link.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.accent }]}>DIAR <Text style={{ color: theme.gold }}>✦</Text></Text>
        <View style={[styles.mark, { backgroundColor: theme.accentSoft }]}><Text style={{ color: theme.gold, fontSize: 31 }}>✦</Text></View>
        <Text style={[styles.heading, { color: theme.ink }]}>{sent ? 'Check your email' : 'Your private space starts here'}</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>{sent ? `Open the sign in link sent to ${email} on this device. DIAR will open automatically.` : 'Sign in with your email. Your diary entries stay encrypted on this device.'}</Text>
        {!accountConfigured ? <Text style={[styles.message, { color: theme.danger }]}>Email sign in needs a Supabase Project URL and publishable key in the app build.</Text> : <>
          {!sent && <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]} onSubmitEditing={() => void sendLink()} />}
          {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: sent ? theme.accent : theme.danger }]}>{message}</Text>}
          {!sent && <Pressable accessibilityRole="button" disabled={busy} onPress={() => void sendLink()} style={[styles.button, { backgroundColor: theme.accent, opacity: busy ? 0.7 : 1 }]}>{busy ? <ActivityIndicator color={theme.surface} /> : <Text style={{ color: theme.surface, fontSize: 16, fontWeight: '700' }}>Continue with email</Text>}</Pressable>}
          {sent && <View style={styles.actions}><Pressable disabled={busy} onPress={() => { setSent(false); setMessage(''); }}><Text style={{ color: theme.accent, fontWeight: '600' }}>Change email</Text></Pressable><Pressable disabled={busy} onPress={() => void sendLink()}><Text style={{ color: theme.accent, fontWeight: '600' }}>Resend link</Text></Pressable></View>}
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
  message: { textAlign: 'center', marginTop: 16, lineHeight: 20 },
  button: { minHeight: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  privacy: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 'auto', paddingTop: 50 },
});
