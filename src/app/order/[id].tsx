import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { KeyValue, KeyValueGroup } from '@/components/KeyValue';
import { SectionTitle } from '@/components/SectionTitle';
import { StatusBadge } from '@/components/StatusBadge';
import { PRIORITY_LABEL } from '@/constants/labels';
import { colors } from '@/constants/theme';
import { useApp } from '@/state/AppProvider';
import { formatDateTime, toDateKey } from '@/utils/date';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const todayKey = toDateKey(new Date());

  const order = data.orders.find((o) => o.id === id);
  if (!order) {
    return <EmptyState icon={<Package size={36} color={colors.textMuted} />} title="Order tidak ditemukan" message="Delivery order ini sudah tidak ada di daftar Anda." actionLabel="Kembali" onAction={() => router.back()} />;
  }

  const trip = data.trips.find((t) => t.id === order.tripId);
  const open = order.status === 'Assigned' || order.status === 'In Transit';
  const canProcess = open && trip?.status === 'In Progress';

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: order.id }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.recipient}>{order.recipient}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.address}>{order.address}, {order.city}</Text>
        </View>

        <SectionTitle title="Muatan" />
        <KeyValueGroup>
          <KeyValue label="Barang" value={`${order.itemCount} item · ${order.itemSummary}`} />
          <KeyValue label="Berat" value={`${order.weightKg} kg`} />
          <KeyValue label="Prioritas" value={PRIORITY_LABEL[order.priority]} />
          <KeyValue label="Stop" value={`#${order.sequence} pada ${order.tripId}`} />
        </KeyValueGroup>

        <SectionTitle title="Progres" />
        <KeyValueGroup>
          <KeyValue label="Dimulai" value={order.startedAt ? formatDateTime(order.startedAt, todayKey) : 'Belum dimulai'} />
          {order.completedAt && <KeyValue label={order.status === 'Delivered' ? 'Terkirim' : 'Gagal'} value={formatDateTime(order.completedAt, todayKey)} />}
          {order.receivedBy && <KeyValue label="Diterima oleh" value={order.receivedBy} />}
          {order.failureReason && <KeyValue label="Alasan" value={order.failureReason} />}
          {order.status === 'Delivered' && <KeyValue label="Bukti" value={order.proofCapturedAt ? 'Placeholder diambil (simulasi)' : 'Tidak diwajibkan'} />}
          {order.note && <KeyValue label="Catatan" value={order.note} />}
        </KeyValueGroup>

        {open && !canProcess && <Text style={styles.hint}>Mulai trip {order.tripId} sebelum mengerjakan pengiriman ini.</Text>}
        <View style={styles.link}>
          <Button label="Lihat trip" variant="secondary" onPress={() => router.push(`/trip/${order.tripId}`)} />
        </View>
      </ScrollView>

      {canProcess && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button label={order.status === 'Assigned' ? 'Buka proses pengiriman' : 'Lanjutkan pengiriman'} onPress={() => router.push(`/deliver/${order.id}`)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.navy900, paddingHorizontal: 16, paddingBottom: 18, gap: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  recipient: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textOnNavy },
  address: { fontSize: 15, color: colors.textOnNavyMuted },
  hint: { fontSize: 14, color: colors.textMuted, paddingHorizontal: 16, paddingTop: 12 },
  link: { padding: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
