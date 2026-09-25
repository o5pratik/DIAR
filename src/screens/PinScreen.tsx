import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinKeypad } from '../components/PinKeypad';
import { Theme, serif } from '../theme/theme';

type Props = {
  kind: 'setup' | 'unlock' | 'change';
  length?: 4 | 6;
  theme: Theme;
  onVerify?: (pin: string) => Promise<boolean>;
  onSet?: (pin: string) => Promise<void>;
  onUnlocked?: () => Promise<void>;
  onCancel?: () => void;
  onBiometric?: () => Promise<void>;
};

export function PinScreen({ kind, length: existingLength, theme, onVerify, onSet, onUnlocked, onCancel, onBiometric }: Props) {
  const [length, setLength] = useState<4 | 6>(existingLength ?? 4);
  const [stage, setStage] = useState<'current' | 'new' | 'confirm'>(kind === 'change' ? 'current' : 'new');
  const [value, setValue] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const target = kind === 'unlock' || stage === 'current' ? existingLength ?? 4 : length;

  useEffect(() => { setValue(''); }, [stage, length]);

  async function submit(pin: string) {
    setBusy(true);
    setError('');
    try {
      if (kind === 'unlock') {
        if (!(await onVerify?.(pin))) { setError('That PIN didn’t match. Try again.'); return; }
        await onUnlocked?.();
      } else if (stage === 'current') {
        if (!(await onVerify?.(pin))) { setError('That PIN didn’t match. Try again.'); return; }
        setStage('new');
      } else if (stage === 'new') {
        setFirst(pin);
        setStage('confirm');
      } else if (pin !== first) {
        setError('PINs didn’t match. Start again.');
        setStage('new');
      } else {
        await onSet?.(pin);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setValue('');
      setBusy(false);
    }
  }

  function digit(d: string) {
    if (busy || value.length >= target) return;
    const next = value + d;
    setValue(next);
    if (next.length === target) void submit(next);
  }

  const heading = kind === 'unlock' ? 'Welcome back' : stage === 'current' ? 'Your current PIN' : stage === 'confirm' ? 'One more time' : kind === 'setup' ? 'A space of your own' : 'Choose a new PIN';
  const subtitle = kind === 'unlock' ? 'Enter your PIN to open your diary.' : stage === 'current' ? 'Confirm it’s you before changing your PIN.' : stage === 'confirm' ? 'Re-enter your new PIN to confirm.' : 'Create a PIN to keep your thoughts private.';

  return <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
    <View style={styles.top}>
      {onCancel && <Pressable onPress={onCancel} accessibilityRole="button" style={styles.cancel}><Text style={{ color: theme.muted, fontSize: 16 }}>Cancel</Text></Pressable>}
      <Text style={[styles.brand, { color: theme.accent }]}>DIAR</Text>
    </View>
    <View style={styles.center}>
      <View style={[styles.mark, { backgroundColor: theme.accentSoft }]}><Text style={{ fontSize: 29, color: theme.accent }}>✦</Text></View>
      <Text style={[styles.heading, { color: theme.ink }]}>{heading}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
      {stage === 'new' && kind !== 'unlock' && <View style={[styles.lengthSwitch, { backgroundColor: theme.surfaceAlt }]}>
        {([4, 6] as const).map(n => <Pressable key={n} onPress={() => { setLength(n); setError(''); }} style={[styles.lengthOption, length === n && { backgroundColor: theme.surface }]}><Text style={{ color: length === n ? theme.ink : theme.muted, fontWeight: '600' }}>{n} digits</Text></Pressable>)}
      </View>}
      <PinKeypad value={value} length={target} onDigit={digit} onDelete={() => setValue(v => v.slice(0, -1))} theme={theme} busy={busy} />
      <View style={styles.message}>{busy ? <ActivityIndicator color={theme.accent} /> : <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, textAlign: 'center' }}>{error}</Text>}</View>
      {kind === 'unlock' && onBiometric && <Pressable onPress={() => void onBiometric()} style={styles.biometric}><Text style={{ color: theme.accent, fontWeight: '600' }}>Use Face ID / fingerprint</Text></Pressable>}
    </View>
    <Text style={[styles.privacy, { color: theme.muted }]}>Your diary stays on your device.</Text>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24 },
  top: { minHeight: 56, justifyContent: 'center', alignItems: 'center' },
  brand: { fontSize: 14, letterSpacing: 4, fontWeight: '700' },
  cancel: { position: 'absolute', left: 0, paddingVertical: 12, zIndex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 10 },
  mark: { width: 65, height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  heading: { fontFamily: serif, fontSize: 31, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 21 },
  lengthSwitch: { flexDirection: 'row', padding: 4, borderRadius: 14, marginTop: 27 },
  lengthOption: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 11 },
  message: { height: 26, justifyContent: 'center', marginTop: 8 },
  biometric: { padding: 14, marginTop: 4 },
  privacy: { textAlign: 'center', fontSize: 12, paddingBottom: 18 },
});
