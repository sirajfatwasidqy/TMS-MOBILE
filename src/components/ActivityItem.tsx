import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { Activity } from '@/types';
import { formatDateTime } from '@/utils/date';

const TONE: Record<Activity['kind'], string> = {
  trip_started: colors.blue,
  order_started: colors.blue,
  trip_completed: colors.green,
  order_delivered: colors.green,
  trip_failed: colors.red,
  order_failed: colors.red,
};

export function ActivityItem({ activity, todayKey, onPress }: { activity: Activity; todayKey: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.row}>
      <View style={[styles.dot, { backgroundColor: TONE[activity.kind] }]} />
      <View style={styles.body}>
        <Text style={styles.message}>{activity.message}</Text>
        <Text style={styles.time}>{formatDateTime(activity.at, todayKey)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  body: { flex: 1, gap: 2 },
  message: { fontSize: 15, color: colors.text, lineHeight: 20 },
  time: { fontSize: 13, color: colors.textMuted },
});
