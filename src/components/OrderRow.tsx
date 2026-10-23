import { ChevronRight, Flag } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from './StatusBadge';
import { colors } from '@/constants/theme';
import type { DeliveryOrder } from '@/types';

export function OrderRow({ order, onPress }: { order: DeliveryOrder; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.bg }]}>
      <View style={styles.main}>
        <View style={styles.top}>
          <Text style={styles.id}>{order.id}</Text>
          {order.priority === 'High' && (
            <View style={styles.priority}>
              <Flag size={12} color={colors.navy900} fill={colors.navy900} />
              <Text style={styles.priorityText}>Prioritas tinggi</Text>
            </View>
          )}
        </View>
        <Text style={styles.recipient} numberOfLines={1}>{order.recipient}</Text>
        <Text style={styles.meta} numberOfLines={1}>{order.city} · {order.itemCount} item · {order.weightKg} kg</Text>
      </View>
      <View style={styles.side}>
        <StatusBadge status={order.status} />
        <ChevronRight size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  main: { flex: 1, gap: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  id: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  priority: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityText: { fontSize: 12, fontWeight: '700', color: colors.navy900 },
  recipient: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { fontSize: 14, color: colors.textMuted },
  side: { alignItems: 'flex-end', gap: 6 },
});
