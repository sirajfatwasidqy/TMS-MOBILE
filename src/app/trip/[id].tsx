import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Route } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityItem } from '@/components/ActivityItem';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { KeyValue, KeyValueGroup } from '@/components/KeyValue';
import { SectionTitle } from '@/components/SectionTitle';
import { StatusBadge } from '@/components/StatusBadge';
import { StopTimeline } from '@/components/StopTimeline';
import { colors } from '@/constants/theme';
import { getVehicle } from '@/data/fixtures';
import { nextOrderForTrip, ordersOfTrip, tripProgress } from '@/services/tripRules';
import { useApp } from '@/state/AppProvider';
import { formatDateLabel, formatDateTime, toDateKey } from '@/utils/date';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, startTrip } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const todayKey = toDateKey(new Date());

  const trip = data.trips.find((t) => t.id === id);
  if (!trip) {
    return (
      <EmptyState icon={<Route size={36} color={colors.textMuted} />} title="Trip tidak ditemukan" message="Trip ini sudah tidak ada di daftar Anda." actionLabel="Kembali" onAction={() => router.back()} />
    );
  }

  const vehicle = getVehicle(trip.vehicleId);
  const stops = ordersOfTrip(data.orders, trip.id);
  const progress = tripProgress(data.orders, trip.id);
  const next = nextOrderForTrip(data.orders, trip.id);
  const log = data.activities.filter((a) => a.tripId === trip.id).slice(0, 8);

  const confirmStart = () =>
    Alert.alert('Mulai trip ini?', `${trip.id} menuju ${trip.destination}. Trip lain tidak bisa dimulai sebelum trip ini selesai.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Mulai trip',
        onPress: () => {
          const result = startTrip(trip.id);
          setError(result.ok ? null : result.error);
        },
      },
    ]);

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: trip.id }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={styles.route}>{trip.origin} ke {trip.destination}</Text>
            <StatusBadge status={trip.status} />
          </View>
          <Text style={styles.progress}>{progress.finished} dari {progress.total} stop selesai · {progress.delivered} terkirim · {progress.failed} gagal</Text>
        </View>

        <KeyValueGroup>
          <KeyValue label="Tanggal" value={formatDateLabel(trip.date, todayKey)} />
          <KeyValue label="Jadwal" value={`${trip.scheduledStart}–${trip.scheduledEnd}`} />
          <KeyValue label="Jarak" value={`${trip.distanceKm} km`} />
          <KeyValue label="Kendaraan" value={vehicle ? `${vehicle.plate} · ${vehicle.type}` : 'Tidak diketahui'} />
          <KeyValue label="Kapasitas muatan" value={vehicle ? `${vehicle.capacityKg.toLocaleString('id-ID')} kg` : '-'} />
          {trip.startedAt && <KeyValue label="Dimulai" value={formatDateTime(trip.startedAt, todayKey)} />}
          {trip.completedAt && <KeyValue label="Selesai" value={formatDateTime(trip.completedAt, todayKey)} />}
        </KeyValueGroup>

        <SectionTitle title="Stop" trailing="Urutan skematik, bukan GPS" />
        <StopTimeline orders={stops} onPressOrder={(oid) => router.push(`/order/${oid}`)} />

        <SectionTitle title="Aktivitas" />
        {log.length === 0 ? <Text style={styles.none}>Belum ada aktivitas. Aktivitas tercatat setelah trip dimulai.</Text> : log.map((a) => <ActivityItem key={a.id} activity={a} todayKey={todayKey} />)}
      </ScrollView>

      {(trip.status === 'Assigned' || trip.status === 'In Progress') && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          {error ? <ErrorBanner message={error} /> : null}
          {trip.status === 'Assigned' ? (
            <Button label="Mulai trip" onPress={confirmStart} />
          ) : next ? (
            <Button label={next.status === 'In Transit' ? `Lanjutkan pengiriman ${next.id}` : `Stop berikutnya: ${next.recipient}`} onPress={() => router.push(`/deliver/${next.id}`)} />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  summary: { backgroundColor: colors.navy900, paddingHorizontal: 16, paddingBottom: 18, gap: 8 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  route: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textOnNavy },
  progress: { fontSize: 14, color: colors.textOnNavyMuted },
  none: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
