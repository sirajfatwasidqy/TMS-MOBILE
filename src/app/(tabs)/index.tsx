import { useRouter } from 'expo-router';
import { Inbox } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityItem } from '@/components/ActivityItem';
import { EmptyState } from '@/components/EmptyState';
import { OrderRow } from '@/components/OrderRow';
import { SectionTitle } from '@/components/SectionTitle';
import { StopTimeline } from '@/components/StopTimeline';
import { TripRow } from '@/components/TripRow';
import { colors } from '@/constants/theme';
import { getVehicle } from '@/data/fixtures';
import { ordersOfTrip, sortOrders, summarizeDay, tripProgress } from '@/services/tripRules';
import { useApp } from '@/state/AppProvider';
import { greetingFor, toDateKey } from '@/utils/date';

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tone ? { color: tone } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { driver, data, settings } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = new Date();
  const todayKey = toDateKey(now);

  const view = (() => {
    const todayTrips = data.trips.filter((t) => t.date === todayKey);
    const ids = new Set(todayTrips.map((t) => t.id));
    return {
      summary: summarizeDay(data.trips, todayKey),
      active: todayTrips.find((t) => t.status === 'In Progress'),
      next: todayTrips.filter((t) => t.status === 'Assigned').sort((a, b) => a.scheduledStart.localeCompare(b.scheduledStart))[0],
      deliveries: sortOrders(data.orders.filter((o) => ids.has(o.tripId)), settings.priorityFirst),
    };
  })();

  const activeVehicle = view.active ? getVehicle(view.active.vehicleId) : undefined;
  const initials = driver.name.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greetingFor(now)},</Text>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.sub}>{driver.depot}{activeVehicle ? ` · ${activeVehicle.plate}` : ''}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
      </View>

      <View style={styles.stats}>
        <Stat label="Trip hari ini" value={view.summary.total} />
        <View style={styles.divider} />
        <Stat label="Aktif" value={view.summary.active} tone={colors.blue} />
        <View style={styles.divider} />
        <Stat label="Selesai" value={view.summary.completed} tone={colors.green} />
        <View style={styles.divider} />
        <Stat label="Tertunda" value={view.summary.pending} tone={colors.orange} />
      </View>
      {view.summary.failed > 0 && <Text style={styles.failedNote}>{view.summary.failed} trip gagal hari ini</Text>}

      {view.active ? (
        <>
          <SectionTitle title="Trip aktif" trailing={`${tripProgress(data.orders, view.active.id).finished}/${tripProgress(data.orders, view.active.id).total} stop selesai`} />
          <Text style={styles.route}>{view.active.origin} ke {view.active.destination}</Text>
          <StopTimeline orders={ordersOfTrip(data.orders, view.active.id)} onPressOrder={(id) => router.push(`/order/${id}`)} />
        </>
      ) : view.next ? (
        <>
          <SectionTitle title="Trip berikutnya" />
          <TripRow trip={view.next} progress={tripProgress(data.orders, view.next.id)} onPress={() => router.push(`/trip/${view.next!.id}`)} />
        </>
      ) : null}

      <SectionTitle title="Pengiriman hari ini" trailing={`${view.deliveries.length} order`} />
      {view.deliveries.length === 0 ? (
        <EmptyState icon={<Inbox size={36} color={colors.textMuted} />} title="Belum ada pengiriman hari ini" message="Trip yang dijadwalkan hari ini akan muncul di sini. Reset data demo di menu Profil jika Anda membuka aplikasi di hari yang berbeda." />
      ) : (
        view.deliveries.map((o) => <OrderRow key={o.id} order={o} onPress={() => router.push(`/order/${o.id}`)} />)
      )}

      <SectionTitle title="Aktivitas terbaru" />
      {data.activities.slice(0, 5).map((a) => (
        <ActivityItem
          key={a.id}
          activity={a}
          todayKey={todayKey}
          onPress={() => router.push(a.orderId ? `/order/${a.orderId}` : `/trip/${a.tripId}`)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.navy900, paddingHorizontal: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1, gap: 2 },
  greeting: { fontSize: 15, color: colors.textOnNavyMuted },
  name: { fontSize: 24, fontWeight: '700', color: colors.textOnNavy },
  sub: { fontSize: 14, color: colors.textOnNavyMuted, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.navy500, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.textOnNavy },
  stats: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, color: colors.textMuted },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  failedNote: { fontSize: 13, color: colors.red, paddingHorizontal: 16, paddingTop: 8 },
  route: { fontSize: 15, color: colors.textMuted, paddingHorizontal: 16, marginBottom: 14 },
});
