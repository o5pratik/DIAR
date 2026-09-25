import { parseDate } from '../utils/dateUtils';

export type DiaryEntry = {
  date: string;
  whatsGoingOn: string;
  positiveThings: string[];
  manifestation: string;
  createdAt: string;
  updatedAt: string;
};

export type Diary = Record<string, DiaryEntry>;

export function emptyEntry(date: string): DiaryEntry {
  const now = new Date().toISOString();
  return { date, whatsGoingOn: '', positiveThings: [], manifestation: '', createdAt: now, updatedAt: now };
}

export function hasContent(entry: DiaryEntry): boolean {
  return Boolean(entry.whatsGoingOn.trim() || entry.manifestation.trim() || entry.positiveThings.some(x => x.trim()));
}

export function validEntry(value: unknown): value is DiaryEntry {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<DiaryEntry>;
  if (typeof item.date !== 'string') return false;
  try { parseDate(item.date); } catch { return false; }
  return typeof item.whatsGoingOn === 'string' && typeof item.manifestation === 'string'
    && Array.isArray(item.positiveThings) && item.positiveThings.every(x => typeof x === 'string')
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string';
}

