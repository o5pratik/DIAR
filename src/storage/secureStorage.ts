import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode, deriveKey, encode, equalBytes, randomBase64 } from './crypto';

const PIN_KEY = 'diar.pin.v1';
const DATA_KEY = 'diar.data-key.v1';
const THEME_KEY = 'diar.theme.v1';
const BIOMETRIC_KEY = 'diar.biometric.v1';
const ACCOUNT_KEY = 'diar.account-id.v1';
const LOCAL_MODE_KEY = 'diar.local-mode.v1';
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

type PinRecord = { length: 4 | 6; salt: string; verifier: string };

async function pinRecord(): Promise<PinRecord | null> {
  const raw = await SecureStore.getItemAsync(PIN_KEY);
  if (!raw) return null;
  const value = JSON.parse(raw) as PinRecord;
  if (![4, 6].includes(value.length) || !value.salt || !value.verifier) throw new Error('PIN settings are damaged');
  return value;
}

export async function getPinLength(): Promise<4 | 6 | null> {
  return (await pinRecord())?.length ?? null;
}

export async function setPin(pin: string): Promise<void> {
  if (!/^\d{4}(\d{2})?$/.test(pin)) throw new Error('PIN must be 4 or 6 digits');
  const length = pin.length as 4 | 6;
  const salt = randomBase64(16);
  const verifier = encode(deriveKey(pin, salt));
  await SecureStore.setItemAsync(PIN_KEY, JSON.stringify({ length, salt, verifier }), OPTIONS);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const record = await pinRecord();
  if (!record || pin.length !== record.length) return false;
  return equalBytes(deriveKey(pin, record.salt), decode(record.verifier));
}

export async function getDataKey(): Promise<Uint8Array> {
  const saved = await SecureStore.getItemAsync(DATA_KEY);
  if (!saved) throw new Error('The diary encryption key is missing');
  return decode(saved);
}

export async function createDataKey(): Promise<void> {
  if (await SecureStore.getItemAsync(DATA_KEY)) return;
  await SecureStore.setItemAsync(DATA_KEY, randomBase64(32), OPTIONS);
}

export async function getThemePreference(): Promise<'system' | 'light' | 'dark'> {
  const value = await SecureStore.getItemAsync(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export async function setThemePreference(value: 'system' | 'light' | 'dark'): Promise<void> {
  await SecureStore.setItemAsync(THEME_KEY, value, OPTIONS);
}

export async function getBiometricPreference(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === 'true';
}

export async function setBiometricPreference(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_KEY, String(value), OPTIONS);
}

export async function removeSecurity(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(DATA_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
}

export async function clearLegacyAccount(): Promise<void> {
  await Promise.allSettled([
    SecureStore.deleteItemAsync(ACCOUNT_KEY),
    SecureStore.deleteItemAsync(LOCAL_MODE_KEY),
    AsyncStorage.removeItem('sb-qtudcokmkwriylfsiqcm-auth-token'),
  ]);
}
