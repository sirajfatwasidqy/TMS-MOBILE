import Constants from 'expo-constants';
import { LogOut } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { KeyValue, KeyValueGroup } from '@/components/KeyValue';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { colors } from '@/constants/theme';
import { useApp } from '@/state/AppProvider';
import { toDateKey } from '@/utils/date';

export default function ProfileScreen() {
  const { driver, vehicles, data, settings, persistError, setPriorityFirst, resetDemoData, signOut } = useApp();
  const todayKey = toDateKey(new Date());
  const activeTrip = data.trips.find((t) => t.status === 'In Progress');
  const todayTrip = data.trips.find((t) => t.date === todayKey);
  const vehicle = vehicles.find((v) => v.id === (activeTrip ?? todayTrip)?.vehicleId) ?? vehicles[0];

  const confirmReset = () =>
    Alert.alert('Reset data demo?', 'Semua trip dan pengiriman kembali ke kondisi awal, dengan tanggal di sekitar hari ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetDemoData },
    ]);

  const confirmSignOut = () =>
    Alert.alert('Keluar dari akun?', 'Data trip Anda tetap tersimpan di perangkat ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: signOut },
    ]);

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Profil" subtitle="Duta Abadi Primantara · proyek portofolio" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {persistError ? <View style={styles.banner}><ErrorBanner message={persistError} /></View> : null}

        <SectionTitle title="Driver" />
        <KeyValueGroup>
          <KeyValue label="Nama" value={driver.name} />
          <KeyValue label="ID driver" value={driver.id} />
          <KeyValue label="Depo" value={driver.depot} />
          <KeyValue label="SIM" value={driver.licenseClass} />
          <KeyValue label="Telepon" value={driver.phone} />
        </KeyValueGroup>

        <SectionTitle title="Kendaraan ditugaskan" />
        <KeyValueGroup>
          <KeyValue label="Plat nomor" value={vehicle.plate} />
          <KeyValue label="Jenis" value={vehicle.type} />
          <KeyValue label="Kapasitas" value={`${vehicle.capacityKg.toLocaleString('id-ID')} kg`} />
          <KeyValue label="Servis terakhir" value={vehicle.lastServiceDate} />
        </KeyValueGroup>

        <SectionTitle title="Pengaturan" />
        <View style={styles.setting}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Prioritas tinggi di atas</Text>
            <Text style={styles.settingHint}>Urutkan daftar di Beranda dan Order dengan order prioritas tinggi paling atas.</Text>
          </View>
          <Switch value={settings.priorityFirst} onValueChange={setPriorityFirst} trackColor={{ true: colors.navy700, false: colors.border }} />
        </View>
        <View style={styles.actions}>
          <Button label="Reset data demo" variant="secondary" onPress={confirmReset} />
          <Button label="Keluar" variant="danger" icon={<LogOut size={20} color={colors.red} />} onPress={confirmSignOut} />
        </View>
        <Text style={styles.footer}>
          TMS Mobile v{Constants.expoConfig?.version ?? '1.0.0'} · Proyek portofolio independen, bukan aplikasi resmi perusahaan. Semua data bersifat sintetis dan hanya tersimpan di perangkat ini.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  banner: { padding: 16, paddingBottom: 0 },
  setting: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  settingText: { flex: 1, gap: 2 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  settingHint: { fontSize: 13, color: colors.textMuted },
  actions: { padding: 16, gap: 12 },
  footer: { fontSize: 13, color: colors.textMuted, paddingHorizontal: 16, lineHeight: 19 },
});
