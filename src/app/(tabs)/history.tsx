import { useRouter } from 'expo-router';
import { History } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { OrderRow } from '@/components/OrderRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TripRow } from '@/components/TripRow';
import { colors, radius } from '@/constants/theme';
import { tripProgress, withinRange, type HistoryRange } from '@/services/tripRules';
import { useApp } from '@/state/AppProvider';
import { formatDateLabel, toDateKey } from '@/utils/date';

const RANGES = ['3d', '7d', 'all'] as const;
const RANGE_LABELS = { '3d': '3 hari terakhir', '7d': '7 hari terakhir', all: 'Semua waktu' } as const;
const OUTCOMES = ['All', 'Completed', 'Failed'] as const;
type Outcome = (typeof OUTCOMES)[number];
type Mode = 'trips' | 'deliveries';

export default function HistoryScreen() {
  const { data } = useApp();
  const router = useRouter();
  const todayKey = toDateKey(new Date());
  const [mode, setMode] = useState<Mode>('trips');
  const [range, setRange] = useState<HistoryRange>('7d');
  const [outcome, setOutcome] = useState<Outcome>('All');

  const trips = useMemo(
    () =>
      data.trips
        .filter((t) => (t.status === 'Completed' || t.status === 'Failed') && withinRange(t.date, todayKey, range))
        .filter((t) => outcome === 'All' || t.status === outcome)
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [data.trips, range, outcome, todayKey],
  );

  const deliveries = useMemo(() => {
    const dateOf = new Map(data.trips.map((t) => [t.id, t.date]));
    return data.orders
      .filter((o) => (o.status === 'Delivered' || o.status === 'Failed') && withinRange(dateOf.get(o.tripId) ?? '', todayKey, range))
      .filter((o) => outcome === 'All' || (outcome === 'Completed' ? o.status === 'Delivered' : o.status === 'Failed'))
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  }, [data.trips, data.orders, range, outcome, todayKey]);

  const count = mode === 'trips' ? trips.length : deliveries.length;

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Riwayat" subtitle="Trip dan pengiriman yang sudah selesai" />
      <View style={styles.segment}>
        {(['trips', 'deliveries'] as const).map((m) => (
          <Pressable key={m} accessibilityRole="button" accessibilityState={{ selected: mode === m }} onPress={() => setMode(m)} style={[styles.segBtn, mode === m && styles.segActive]}>
            <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m === 'trips' ? 'Trip' : 'Pengiriman'}</Text>
          </Pressable>
        ))}
      </View>
      <FilterChips options={RANGES} value={range} onChange={setRange} labels={RANGE_LABELS} />
      <FilterChips options={OUTCOMES} value={outcome} onChange={setOutcome} labels={{ All: 'Semua', Completed: mode === 'trips' ? 'Selesai' : 'Terkirim', Failed: 'Gagal' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {count === 0 ? (
          <EmptyState icon={<History size={36} color={colors.textMuted} />} title="Tidak ada data pada periode ini" message="Perluas rentang tanggal atau ubah filter hasil." actionLabel="Tampilkan semua waktu" onAction={() => { setRange('all'); setOutcome('All'); }} />
        ) : mode === 'trips' ? (
          trips.map((t) => (
            <View key={t.id}>
              <Text style={styles.date}>{formatDateLabel(t.date, todayKey)}</Text>
              <TripRow trip={t} progress={tripProgress(data.orders, t.id)} onPress={() => router.push(`/trip/${t.id}`)} />
            </View>
          ))
        ) : (
          deliveries.map((o) => <OrderRow key={o.id} order={o} onPress={() => router.push(`/order/${o.id}`)} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  segment: { flexDirection: 'row', margin: 16, marginBottom: 0, padding: 4, borderRadius: radius.md, backgroundColor: colors.border },
  segBtn: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segActive: { backgroundColor: colors.surface },
  segText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  segTextActive: { color: colors.navy900 },
  date: { fontSize: 13, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
});
