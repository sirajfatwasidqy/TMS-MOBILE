import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppData, Settings } from '@/types';

const KEYS = {
  data: 'tms.data.v2',
  settings: 'tms.settings.v2',
  session: 'tms.session.v2',
} as const;

export const DEFAULT_SETTINGS: Settings = { priorityFirst: true };

export interface StoredState {
  data: AppData | null;
  settings: Settings;
  signedIn: boolean;
}

function isAppData(value: unknown): value is AppData {
  const v = value as Partial<AppData> | null;
  return (
    !!v &&
    Array.isArray(v.trips) &&
    Array.isArray(v.orders) &&
    Array.isArray(v.activities) &&
    typeof v.seededOn === 'string'
  );
}

function parse<T>(raw: string | null, guard: (v: unknown) => v is T): T | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return guard(value) ? value : null;
  } catch {
    return null; // JSON rusak dianggap sebagai "tidak ada data tersimpan".
  }
}

const isSettings = (v: unknown): v is Settings =>
  typeof v === 'object' && v !== null && typeof (v as Settings).priorityFirst === 'boolean';

/** Melempar error jika AsyncStorage tidak tersedia; pemanggil menampilkan layar coba lagi. */
export async function loadState(): Promise<StoredState> {
  const [rawData, rawSettings, rawSession] = await Promise.all([
    AsyncStorage.getItem(KEYS.data),
    AsyncStorage.getItem(KEYS.settings),
    AsyncStorage.getItem(KEYS.session),
  ]);
  return {
    data: parse(rawData, isAppData),
    settings: parse(rawSettings, isSettings) ?? DEFAULT_SETTINGS,
    signedIn: rawSession === 'signed-in',
  };
}

export const saveData = (data: AppData) => AsyncStorage.setItem(KEYS.data, JSON.stringify(data));
export const saveSettings = (s: Settings) => AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
export const saveSession = (signedIn: boolean) =>
  signedIn ? AsyncStorage.setItem(KEYS.session, 'signed-in') : AsyncStorage.removeItem(KEYS.session);
