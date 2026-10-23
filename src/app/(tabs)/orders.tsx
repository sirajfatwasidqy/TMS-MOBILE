import { useRouter } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { OrderRow } from '@/components/OrderRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { colors } from '@/constants/theme';
import { filterOrders, sortOrders } from '@/services/tripRules';
import { useApp } from '@/state/AppProvider';

const OPTIONS = ['All', 'Assigned', 'In Transit', 'Delivered', 'Failed'] as const;
const FILTER_LABELS = { All: 'Semua', Assigned: 'Ditugaskan', 'In Transit': 'Dalam perjalanan', Delivered: 'Terkirim', Failed: 'Gagal' } as const;
type Filter = (typeof OPTIONS)[number];

export default function OrdersScreen() {
  const { data, settings } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Filter>('All');

  const orders = useMemo(
    () => sortOrders(filterOrders(data.orders, { query, status }), settings.priorityFirst),
    [data.orders, query, status, settings.priorityFirst],
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Delivery order" subtitle={`${orders.length} dari ${data.orders.length} order`} />
      <SearchField value={query} onChangeText={setQuery} placeholder="Cari nomor DO, penerima, atau kota" />
      <FilterChips options={OPTIONS} value={status} onChange={setStatus} labels={FILTER_LABELS} />
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderRow order={item} onPress={() => router.push(`/order/${item.id}`)} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<SearchX size={36} color={colors.textMuted} />}
            title="Order tidak ditemukan"
            message="Periksa ejaan atau hapus filter."
            actionLabel="Hapus pencarian dan filter"
            onAction={() => {
              setQuery('');
              setStatus('All');
            }}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1, backgroundColor: colors.bg } });
