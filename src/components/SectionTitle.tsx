import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function SectionTitle({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  trailing: { fontSize: 13, color: colors.textMuted },
});
