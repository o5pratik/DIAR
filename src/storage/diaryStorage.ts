import { File, Paths } from 'expo-file-system';
import { Diary, validEntry } from '../models/DiaryEntry';
import { decrypt, deriveKey, encrypt, randomBase64 } from './crypto';
import { getDataKey } from './secureStorage';

const diaryFile = new File(Paths.document, 'diary.enc');
const backupFile = new File(Paths.document, 'diary.previous.enc');
let activeKey: Uint8Array | null = null;

function parseDiary(raw: string): Diary {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Diary data is damaged');
  const result: Diary = {};
  for (const [key, value] of Object.entries(data)) {
    if (!validEntry(value) || key !== value.date) throw new Error('Diary data is damaged');
    result[key] = value;
  }
  return result;
}

export async function loadDiary(): Promise<Diary> {
  const key = await getDataKey();
  activeKey = key;
  if (!diaryFile.exists) {
    if (backupFile.exists) return parseDiary(decrypt(await backupFile.text(), key));
    return {};
  }
  try {
    return parseDiary(decrypt(await diaryFile.text(), key));
  } catch {
    if (backupFile.exists) return parseDiary(decrypt(await backupFile.text(), key));
    throw new Error('The diary could not be opened. Your data has not been changed.');
  }
}

export async function saveDiary(diary: Diary): Promise<void> {
  const key = activeKey ?? await getDataKey();
  activeKey = key;
  const encrypted = encrypt(JSON.stringify(diary), key);
  if (diaryFile.exists) {
    if (backupFile.exists) backupFile.delete();
    diaryFile.copySync(backupFile);
  }
  diaryFile.write(encrypted);
}

export async function deleteDiary(): Promise<void> {
  if (diaryFile.exists) diaryFile.delete();
  if (backupFile.exists) backupFile.delete();
  activeKey?.fill(0);
  activeKey = null;
}

export function createPortableBackup(diary: Diary, passphrase: string): string {
  if (passphrase.length < 8) throw new Error('Use at least 8 characters for the backup passphrase');
  const salt = randomBase64(16);
  const payload = encrypt(JSON.stringify(diary), deriveKey(passphrase, salt));
  return JSON.stringify({ format: 'diar-backup', version: 1, salt, payload: JSON.parse(payload) });
}

export function readPortableBackup(raw: string, passphrase: string): Diary {
  const backup = JSON.parse(raw) as { format: string; version: number; salt: string; payload: object };
  if (backup.format !== 'diar-backup' || backup.version !== 1 || !backup.salt || !backup.payload) {
    throw new Error('This is not a DIAR backup');
  }
  try {
    return parseDiary(decrypt(JSON.stringify(backup.payload), deriveKey(passphrase, backup.salt)));
  } catch {
    throw new Error('The passphrase is incorrect or the backup is damaged');
  }
}
