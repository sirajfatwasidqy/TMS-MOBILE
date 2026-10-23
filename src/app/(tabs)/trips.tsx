import { useRouter } from 'expo-router';
import { Route } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { FilterChips } from '@/components/FilterChips';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TripRow } from '@/components/TripRow';
import { colors } from '@/constants/theme';
import { filterTrips, tripProgress } from '@/services/tripRules';
import { useApp } from '@/state/AppProvider';
import type { Trip, TripStatus } from '@/types';
import { formatDateLabel, toDateKey } from '@/utils/date';

const OPTIONS = ['All', 'Assigned', 'In Progress', 'Completed', 'Failed'] as const;
const FILTER_LABELS = { All: 'Semua', Assigned: 'Ditugaskan', 'In Progress': 'Berjalan', Completed: 'Selesai', Failed: 'Gagal' } as const;
type Filter = (typeof OPTIONS)[number];

export default function TripsScreen() {
  const { data } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('All');
  const todayKey = toDateKey(new Date());

  const sections = useMemo(() => {
    const trips = filterTrips(data.trips, filter === 'All' ? 'All' : (filter as TripStatus));
    const byDate = new Map<string, Trip[]>();
    for (const t of trips) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
    return [...byDate.entries()].map(([date, items]) => ({ title: formatDateLabel(date, todayKey), data: items }));
  }, [data.trips, filter, todayKey]);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Trip saya" subtitle={`${data.trips.length} trip tercatat`} />
      <FilterChips options={OPTIONS} value={filter} onChange={setFilter} labels={FILTER_LABELS} />
      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <TripRow trip={item} progress={tripProgress(data.orders, item.id)} onPress={() => router.push(`/trip/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Route size={36} color={colors.textMuted} />}
            title="Tidak ada trip untuk filter ini"
            message="Coba status lain untuk melihat trip lainnya."
            actionLabel="Tampilkan semua trip"
            onAction={() => setFilter('All')}
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  section: { fontSize: 14, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
});
