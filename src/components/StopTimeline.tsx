import { Check, Truck, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import { colors } from '@/constants/theme';
import type { DeliveryOrder } from '@/types';
import { formatTime } from '@/utils/date';

function Node({ status }: { status: DeliveryOrder['status'] }) {
  if (status === 'Delivered') {
    return (
      <View style={[styles.node, { backgroundColor: colors.green, borderColor: colors.green }]}>
        <Check size={16} color="#fff" strokeWidth={3} />
      </View>
    );
  }
  if (status === 'Failed') {
    return (
      <View style={[styles.node, { backgroundColor: colors.red, borderColor: colors.red }]}>
        <X size={16} color="#fff" strokeWidth={3} />
      </View>
    );
  }
  if (status === 'In Transit') {
    return (
      <View style={[styles.node, { backgroundColor: colors.blue, borderColor: colors.blue }]}>
        <Truck size={15} color="#fff" />
      </View>
    );
  }
  return <View style={[styles.node, { backgroundColor: colors.surface, borderColor: colors.border }]} />;
}

/** Rute stop vertikal. Hanya skematik: menunjukkan urutan stop, bukan posisi GPS. */
export function StopTimeline({ orders, onPressOrder }: { orders: DeliveryOrder[]; onPressOrder: (id: string) => void }) {
  return (
    <View style={styles.wrap}>
      {orders.map((o, i) => {
        const last = i === orders.length - 1;
        const done = o.status === 'Delivered' || o.status === 'Failed';
        return (
          <Pressable key={o.id} accessibilityRole="button" onPress={() => onPressOrder(o.id)} style={styles.row}>
            <View style={styles.rail}>
              <Node status={o.status} />
              {!last && <View style={[styles.line, done && { backgroundColor: o.status === 'Delivered' ? colors.green : colors.red }]} />}
            </View>
            <View style={[styles.body, last && { paddingBottom: 0 }]}>
              <View style={styles.titleRow}>
                <Text style={styles.recipient} numberOfLines={1}>{o.recipient}</Text>
                <StatusBadge status={o.status} />
              </View>
              <Text style={styles.meta}>{o.city} · {o.id}</Text>
              <Text style={styles.meta}>
                {o.itemCount} item{o.priority === 'High' ? ' · Prioritas tinggi' : ''}
                {o.completedAt ? ` · ${formatTime(o.completedAt)}` : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 28, alignItems: 'center' },
  node: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, width: 3, marginVertical: 2, backgroundColor: colors.border, borderRadius: 2 },
  body: { flex: 1, paddingBottom: 20, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  recipient: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
});
