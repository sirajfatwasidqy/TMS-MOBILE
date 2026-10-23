import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { createSeedData } from '@/data/seed';
import { authenticate } from '@/services/auth';
import { DRIVER, VEHICLES } from '@/data/fixtures';
import {
  DEFAULT_SETTINGS,
  loadState,
  saveData,
  saveSession,
  saveSettings,
} from '@/services/storage';
import {
  confirmDelivery,
  reportFailure,
  startOrder,
  startTrip,
  type DeliveryInput,
  type FailureInput,
  type Result,
} from '@/services/tripRules';
import type { AppData, Driver, Settings, Vehicle } from '@/types';

type Action = (data: AppData, now: Date) => Result<AppData>;

interface AppContextValue {
  ready: boolean;
  loadError: string | null;
  persistError: string | null;
  retryLoad: () => void;
  signedIn: boolean;
  driver: Driver;
  vehicles: Vehicle[];
  data: AppData;
  settings: Settings;
  signIn: (driverId: string, password: string) => boolean;
  signOut: () => void;
  startTrip: (tripId: string) => Result<null>;
  startOrder: (orderId: string) => Result<null>;
  confirmDelivery: (orderId: string, input: DeliveryInput) => Result<null>;
  reportFailure: (orderId: string, input: FailureInput) => Result<null>;
  setPriorityFirst: (value: boolean) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const EMPTY: AppData = { trips: [], orders: [], activities: [], seededOn: '' };

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [attempt, setAttempt] = useState(0);
  const dataRef = useRef<AppData>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    loadState()
      .then((stored) => {
        if (cancelled) return;
        const initial = stored.data ?? createSeedData(new Date());
        dataRef.current = initial;
        setData(initial);
        setSettings(stored.settings);
        setSignedIn(stored.signedIn);
        setLoadError(null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Data tersimpan tidak dapat dibaca dari perangkat ini.');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready) return;
    saveData(data)
      .then(() => setPersistError(null))
      .catch(() => setPersistError('Perubahan tidak dapat disimpan di perangkat ini.'));
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;
    saveSettings(settings).catch(() => setPersistError('Pengaturan tidak dapat disimpan di perangkat ini.'));
  }, [settings, ready]);

  const apply = useCallback((action: Action): Result<null> => {
    const result = action(dataRef.current, new Date());
    if (!result.ok) return result;
    dataRef.current = result.data;
    setData(result.data);
    return { ok: true, data: null };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      loadError,
      persistError,
      retryLoad: () => {
        setLoadError(null);
        setAttempt((n) => n + 1);
      },
      signedIn,
      driver: DRIVER,
      vehicles: VEHICLES,
      data,
      settings,
      signIn: (driverId, password) => {
        if (!authenticate(driverId, password)) return false;
        setSignedIn(true);
        saveSession(true).catch(() => setPersistError('Status masuk tidak dapat disimpan.'));
        return true;
      },
      signOut: () => {
        setSignedIn(false);
        saveSession(false).catch(() => setPersistError('Status keluar tidak dapat disimpan.'));
      },
      startTrip: (id) => apply((d, now) => startTrip(d, id, now)),
      startOrder: (id) => apply((d, now) => startOrder(d, id, now)),
      confirmDelivery: (id, input) => apply((d, now) => confirmDelivery(d, id, input, now)),
      reportFailure: (id, input) => apply((d, now) => reportFailure(d, id, input, now)),
      setPriorityFirst: (priorityFirst) => setSettings((s) => ({ ...s, priorityFirst })),
      resetDemoData: () => {
        const fresh = createSeedData(new Date());
        dataRef.current = fresh;
        setData(fresh);
      },
    }),
    [ready, loadError, persistError, signedIn, data, settings, apply],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
