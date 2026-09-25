import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { Diary, DiaryEntry, emptyEntry } from './src/models/DiaryEntry';
import { DiaryScreen } from './src/screens/DiaryScreen';
import { PinScreen } from './src/screens/PinScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { createPortableBackup, deleteDiary, loadDiary, readPortableBackup, releaseDiaryKey, saveDiary } from './src/storage/diaryStorage';
import { bindAccountId, clearBoundAccountId, createDataKey, getBiometricPreference, getBoundAccountId, getPinLength, getThemePreference, removeSecurity, setBiometricPreference, setPin, setThemePreference, verifyPin } from './src/storage/secureStorage';
import { completeEmailLink, supabase } from './src/auth/supabase';
import { AccountScreen } from './src/screens/AccountScreen';
import { AccountMismatchScreen } from './src/screens/AccountMismatchScreen';
import { makeTheme, ThemePreference } from './src/theme/theme';
import { dateKey } from './src/utils/dateUtils';

type Phase = 'loading' | 'account' | 'account-mismatch' | 'welcome' | 'setup' | 'unlock' | 'ready' | 'error';

export default function App() {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const theme = makeTheme(preference === 'system' ? systemScheme === 'dark' : preference === 'dark');
  const [phase, setPhase] = useState<Phase>('loading');
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [diary, setDiary] = useState<Diary>({});
  const diaryRef = useRef<Diary>({});
  const [date, setDate] = useState(dateKey(new Date()));
  const [screen, setScreen] = useState<'diary' | 'settings'>('diary');
  const [changingPin, setChangingPin] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [bootError, setBootError] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revision = useRef(0);
  const saveTail = useRef<Promise<void>>(Promise.resolve());
  const phaseRef = useRef<Phase>('loading');
  const accountChangeRef = useRef(false);
  const handledLink = useRef('');
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const boot = useCallback(async () => {
    setPhase('loading');
    try {
      if (!supabase) { setPhase('account'); return; }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) { setAccountEmail(''); setPhase('account'); return; }
      setAccountEmail(session.user.email ?? '');
      const owner = await getBoundAccountId();
      if (owner && owner !== session.user.id) { setPhase('account-mismatch'); return; }
      await bindAccountId(session.user.id);
      const [length, appearance, biometric, hardware, enrolled] = await Promise.all([
        getPinLength(), getThemePreference(), getBiometricPreference(),
        LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(),
      ]);
      setPreference(appearance);
      setBiometricAvailable(hardware && enrolled);
      setBiometricEnabled(biometric && hardware && enrolled);
      if (length) { setPinLength(length); setPhase('unlock'); }
      else setPhase('welcome');
    } catch {
      setBootError('DIAR could not read its secure settings. Please try again.');
      setPhase('error');
    }
  }, []);
  useEffect(() => { void boot(); }, [boot]);

  useEffect(() => {
    async function openEmailLink(url: string) {
      if (handledLink.current === url) return;
      handledLink.current = url;
      try {
        if (await completeEmailLink(url)) await boot();
      } catch (error) {
        Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Request a new sign in link.');
      }
    }
    const listener = Linking.addEventListener('url', event => { void openEmailLink(event.url); });
    void Linking.getInitialURL().then(url => { if (url) void openEmailLink(url); });
    return () => listener.remove();
  }, [boot]);

  function forgetOpenDiary() {
    diaryRef.current = {};
    setDiary({});
    releaseDiaryKey();
    setScreen('diary');
  }

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' && !accountChangeRef.current) {
        setPhase('account');
        if (phaseRef.current === 'ready') void flush().finally(() => forgetOpenDiary());
        else forgetOpenDiary();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function updateEntry(entry: DiaryEntry) {
    const next = { ...diaryRef.current, [entry.date]: entry };
    diaryRef.current = next;
    setDiary(next);
    revision.current += 1;
    setSaveStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 350);
  }

  async function flush(): Promise<boolean> {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const writingRevision = revision.current;
    const snapshot = diaryRef.current;
    const write = saveTail.current.then(() => saveDiary(snapshot));
    saveTail.current = write.catch(() => {});
    try {
      await write;
      if (revision.current === writingRevision) setSaveStatus('saved');
      return true;
    } catch {
      setSaveStatus('error');
      return false;
    }
  }

  async function activateDiary() {
    const data = await loadDiary();
    const currentDate = dateKey(new Date());
    const next = data[currentDate] ? data : { ...data, [currentDate]: emptyEntry(currentDate) };
    if (next !== data) await saveDiary(next);
    diaryRef.current = next;
    setDiary(next);
    setDate(currentDate);
    setScreen('diary');
    setSaveStatus('saved');
    setPhase('ready');
  }

  function selectDate(nextDate: string) {
    setDate(nextDate);
    if (!diaryRef.current[nextDate]) updateEntry(emptyEntry(nextDate));
  }

  function lock() {
    void flush();
    setChangingPin(false);
    setScreen('diary');
    setPhase('unlock');
  }

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active' && phase === 'ready') lock();
    });
    return () => listener.remove();
  }, [phase]);

  async function biometricUnlock() {
    if (!biometricEnabled || !biometricAvailable) return;
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock DIAR', disableDeviceFallback: true });
    if (result.success) {
      try { await activateDiary(); } catch { Alert.alert('Could not open diary', 'Your diary could not be read. Please try again.'); }
    }
  }

  async function toggleBiometric(value: boolean) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable biometric unlock', disableDeviceFallback: true });
      if (!result.success) return;
    }
    await setBiometricPreference(value);
    setBiometricEnabled(value);
  }

  async function chooseTheme(value: ThemePreference) {
    await setThemePreference(value);
    setPreference(value);
  }

  async function exportBackup(passphrase: string) {
    await flush();
    if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
    const file = new File(Paths.cache, 'DIAR-backup.json');
    try {
      file.write(createPortableBackup(diaryRef.current, passphrase));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export encrypted DIAR backup' });
    } finally { if (file.exists) file.delete(); }
  }

  async function importBackup(passphrase: string) {
    await flush();
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (picked.canceled) return;
    const file = new File(picked.assets[0].uri);
    const imported = readPortableBackup(await file.text(), passphrase);
    await new Promise<void>((resolve, reject) => Alert.alert('Replace this diary?', 'Importing will replace all current entries on this device. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
      { text: 'Replace diary', style: 'destructive', onPress: async () => {
        try {
          const today = dateKey(new Date());
          const next = imported[today] ? imported : { ...imported, [today]: emptyEntry(today) };
          await saveDiary(next);
          diaryRef.current = next;
          setDiary(next);
          setDate(today);
          resolve();
        }
        catch { reject(new Error('Could not save the imported diary')); }
      } },
    ]));
  }

  async function deleteEverything() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    await deleteDiary();
    await removeSecurity();
    diaryRef.current = {};
    setDiary({});
    setBiometricEnabled(false);
    setScreen('diary');
    setPhase('welcome');
  }

  async function signOut() {
    if (phaseRef.current === 'ready' && !(await flush())) throw new Error('Your diary could not be saved. Try again before signing out.');
    accountChangeRef.current = true;
    try {
      const { error } = await supabase!.auth.signOut({ scope: 'local' });
      if (error) throw error;
      forgetOpenDiary();
      setAccountEmail('');
      setPhase('account');
    } finally { accountChangeRef.current = false; }
  }

  async function eraseLocalForNewAccount() {
    await deleteDiary();
    await removeSecurity();
    await clearBoundAccountId();
    forgetOpenDiary();
    await boot();
  }

  async function deleteAccount() {
    if (!(await flush())) throw new Error('Your diary could not be saved. Try again before deleting your account.');
    const { error } = await supabase!.functions.invoke('delete-account', { body: { action: 'delete-session' } });
    if (error) throw new Error('Could not delete your account. Please try again.');
    await deleteDiary();
    await removeSecurity();
    await clearBoundAccountId();
    accountChangeRef.current = true;
    try { await supabase!.auth.signOut({ scope: 'local' }); }
    finally { accountChangeRef.current = false; }
    forgetOpenDiary();
    setAccountEmail('');
    setPhase('account');
  }

  const common = <StatusBar style={theme.dark ? 'light' : 'dark'} />;
  if (phase === 'loading') return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}><ActivityIndicator color={theme.accent} /></View>{common}</SafeAreaProvider>;
  if (phase === 'error') return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 30 }}><Text style={{ color: theme.ink, fontSize: 22, textAlign: 'center' }}>{bootError}</Text><Pressable onPress={() => void boot()} style={{ padding: 16, alignSelf: 'center' }}><Text style={{ color: theme.accent }}>Try again</Text></Pressable></View>{common}</SafeAreaProvider>;

  return <SafeAreaProvider>
    {phase === 'account' && <AccountScreen theme={theme} />}
    {phase === 'account-mismatch' && <AccountMismatchScreen theme={theme} email={accountEmail} onSignOut={signOut} onErase={eraseLocalForNewAccount} />}
    {phase === 'welcome' && <WelcomeScreen theme={theme} onContinue={() => setPhase('setup')} />}
    {phase === 'setup' && <PinScreen kind="setup" theme={theme} onSet={async pin => { await createDataKey(); await setPin(pin); setPinLength(pin.length as 4 | 6); await activateDiary(); }} />}
    {phase === 'unlock' && <PinScreen kind="unlock" length={pinLength} theme={theme} onVerify={verifyPin} onUnlocked={activateDiary} onBiometric={biometricEnabled && biometricAvailable ? biometricUnlock : undefined} />}
    {phase === 'ready' && changingPin && <PinScreen kind="change" length={pinLength} theme={theme} onVerify={verifyPin} onSet={async pin => { await setPin(pin); setPinLength(pin.length as 4 | 6); setChangingPin(false); }} onCancel={() => setChangingPin(false)} />}
    {phase === 'ready' && !changingPin && screen === 'diary' && <DiaryScreen diary={diary} date={date} onDate={selectDate} onUpdate={updateEntry} onSave={() => void flush()} saveStatus={saveStatus} onSettings={() => { void flush(); setScreen('settings'); }} theme={theme} />}
    {phase === 'ready' && !changingPin && screen === 'settings' && <SettingsScreen theme={theme} preference={preference} onPreference={chooseTheme} biometricAvailable={biometricAvailable} biometricEnabled={biometricEnabled} onBiometric={toggleBiometric} onBack={() => setScreen('diary')} onChangePin={() => setChangingPin(true)} onLock={lock} onExport={exportBackup} onImport={importBackup} onDelete={deleteEverything} accountEmail={accountEmail} onSignOut={signOut} onDeleteAccount={deleteAccount} />}
    {common}
  </SafeAreaProvider>;
}
