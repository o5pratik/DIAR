import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, Text, useColorScheme, View } from 'react-native';
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
import { createPortableBackup, deleteDiary, loadDiary, readPortableBackup, saveDiary } from './src/storage/diaryStorage';
import { createDataKey, getBiometricPreference, getPinLength, getThemePreference, removeSecurity, setBiometricPreference, setPin, setThemePreference, verifyPin } from './src/storage/secureStorage';
import { makeTheme, ThemePreference } from './src/theme/theme';
import { dateKey } from './src/utils/dateUtils';

type Phase = 'loading' | 'welcome' | 'setup' | 'unlock' | 'ready' | 'error';

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revision = useRef(0);

  const boot = useCallback(async () => {
    setPhase('loading');
    try {
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

  function updateEntry(entry: DiaryEntry) {
    const next = { ...diaryRef.current, [entry.date]: entry };
    diaryRef.current = next;
    setDiary(next);
    revision.current += 1;
    setSaveStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush(); }, 350);
  }

  async function flush() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const writingRevision = revision.current;
    try {
      await saveDiary(diaryRef.current);
      if (revision.current === writingRevision) setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
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

  const common = <StatusBar style={theme.dark ? 'light' : 'dark'} />;
  if (phase === 'loading') return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center' }}><ActivityIndicator color={theme.accent} /></View>{common}</SafeAreaProvider>;
  if (phase === 'error') return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 30 }}><Text style={{ color: theme.ink, fontSize: 22, textAlign: 'center' }}>{bootError}</Text><Pressable onPress={() => void boot()} style={{ padding: 16, alignSelf: 'center' }}><Text style={{ color: theme.accent }}>Try again</Text></Pressable></View>{common}</SafeAreaProvider>;

  return <SafeAreaProvider>
    {phase === 'welcome' && <WelcomeScreen theme={theme} onContinue={() => setPhase('setup')} />}
    {phase === 'setup' && <PinScreen kind="setup" theme={theme} onSet={async pin => { await createDataKey(); await setPin(pin); setPinLength(pin.length as 4 | 6); await activateDiary(); }} />}
    {phase === 'unlock' && <PinScreen kind="unlock" length={pinLength} theme={theme} onVerify={verifyPin} onUnlocked={activateDiary} onBiometric={biometricEnabled && biometricAvailable ? biometricUnlock : undefined} />}
    {phase === 'ready' && changingPin && <PinScreen kind="change" length={pinLength} theme={theme} onVerify={verifyPin} onSet={async pin => { await setPin(pin); setPinLength(pin.length as 4 | 6); setChangingPin(false); }} onCancel={() => setChangingPin(false)} />}
    {phase === 'ready' && !changingPin && screen === 'diary' && <DiaryScreen diary={diary} date={date} onDate={selectDate} onUpdate={updateEntry} onSave={() => void flush()} saveStatus={saveStatus} onSettings={() => { void flush(); setScreen('settings'); }} theme={theme} />}
    {phase === 'ready' && !changingPin && screen === 'settings' && <SettingsScreen theme={theme} preference={preference} onPreference={chooseTheme} biometricAvailable={biometricAvailable} biometricEnabled={biometricEnabled} onBiometric={toggleBiometric} onBack={() => setScreen('diary')} onChangePin={() => setChangingPin(true)} onLock={lock} onExport={exportBackup} onImport={importBackup} onDelete={deleteEverything} />}
    {common}
  </SafeAreaProvider>;
}
