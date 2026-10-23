import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import { colors } from '@/constants/theme';
import { getVehicle } from '@/data/fixtures';
import type { Trip } from '@/types';

interface Props {
  trip: Trip;
  progress: { finished: number; total: number };
  onPress: () => void;
}

export function TripRow({ trip, progress, onPress }: Props) {
  const plate = getVehicle(trip.vehicleId)?.plate ?? 'Kendaraan tidak diketahui';
  const pct = progress.total === 0 ? 0 : progress.finished / progress.total;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]}>
      <View style={styles.main}>
        <View style={styles.top}>
          <Text style={styles.id}>{trip.id}</Text>
          <StatusBadge status={trip.status} />
        </View>
        <Text style={styles.route}>{trip.origin} ke {trip.destination}</Text>
        <Text style={styles.meta}>{trip.scheduledStart}–{trip.scheduledEnd} · {plate} · {trip.distanceKm} km</Text>
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress.finished}/{progress.total} stop</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  main: { flex: 1, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  id: { fontSize: 14, fontWeight: '600', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  route: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.navy700, borderRadius: 3 },
  progressText: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
});
