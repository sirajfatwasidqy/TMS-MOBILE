import { StyleSheet, Text, View } from 'react-native';

import { radius, statusStyle } from '@/constants/theme';
import type { AnyStatus } from '@/types';

export function StatusBadge({ status }: { status: AnyStatus }) {
  const s = statusStyle[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.fg }]} />
      <Text style={[styles.label, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontSize: 13, fontWeight: '600' },
});
