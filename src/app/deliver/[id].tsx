import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, Package, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorBanner } from '@/components/ErrorBanner';
import { FilterChips } from '@/components/FilterChips';
import { KeyValue, KeyValueGroup } from '@/components/KeyValue';
import { SectionTitle } from '@/components/SectionTitle';
import { StatusBadge } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import { colors, radius } from '@/constants/theme';
import { FAILURE_REASONS, LIMITS, OTHER_REASON } from '@/constants/domain';
import { useApp } from '@/state/AppProvider';
import { formatTime } from '@/utils/date';

type Mode = 'deliver' | 'fail';
const STEPS = ['Ditugaskan', 'Dalam perjalanan', 'Selesai'] as const;

function Stepper({ status }: { status: 'Assigned' | 'In Transit' | 'Delivered' | 'Failed' }) {
  const current = status === 'Assigned' ? 0 : status === 'In Transit' ? 1 : 2;
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const reached = i <= current;
        const bad = i === 2 && status === 'Failed';
        const color = bad ? colors.red : reached ? colors.navy900 : colors.border;
        return (
          <View key={label} style={styles.step}>
            <View style={[styles.stepDot, { backgroundColor: reached ? color : colors.surface, borderColor: color }]}>
              {reached && i < current ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
              {bad ? <X size={12} color="#fff" strokeWidth={3} /> : null}
            </View>
            <Text style={[styles.stepLabel, reached && { color: colors.text, fontWeight: '600' }]}>
              {i === 2 && status === 'Failed' ? 'Gagal' : i === 2 && status === 'Delivered' ? 'Terkirim' : label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function DeliveryProcessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, startOrder, confirmDelivery, reportFailure } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('deliver');
  const [receivedBy, setReceivedBy] = useState('');
  const [note, setNote] = useState('');
  const [proofAt, setProofAt] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(FAILURE_REASONS[0]);
  const [error, setError] = useState<string | null>(null);

  const order = data.orders.find((o) => o.id === id);
  if (!order) {
    return <EmptyState icon={<Package size={36} color={colors.textMuted} />} title="Order tidak ditemukan" message="Delivery order ini sudah tidak ada di daftar Anda." actionLabel="Kembali" onAction={() => router.back()} />;
  }

  const finish = (title: string, message: string) => Alert.alert(title, message, [{ text: 'OK', onPress: () => router.back() }]);

  const handleStart = () => {
    const r = startOrder(order.id);
    setError(r.ok ? null : r.error);
  };

  const handleConfirm = () =>
    Alert.alert('Konfirmasi pengiriman?', `Tandai ${order.id} sebagai terkirim ke ${receivedBy.trim() || 'penerima'}. Tindakan ini tidak dapat dibatalkan.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Konfirmasi',
        onPress: () => {
          const r = confirmDelivery(order.id, { receivedBy, note, proofCaptured: proofAt !== null });
          if (!r.ok) return setError(r.error);
          setError(null);
          finish('Pengiriman dikonfirmasi', `${order.id} ditandai sebagai terkirim.`);
        },
      },
    ]);

  const handleFailure = () =>
    Alert.alert('Laporkan pengiriman gagal?', `${order.id} akan ditandai gagal: ${reason}.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Laporkan gagal',
        style: 'destructive',
        onPress: () => {
          const r = reportFailure(order.id, { reason, note });
          if (!r.ok) return setError(r.error);
          setError(null);
          finish('Kegagalan dicatat', `${order.id} ditandai sebagai gagal.`);
        },
      },
    ]);

  const finished = order.status === 'Delivered' || order.status === 'Failed';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: order.id }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.recipient}>{order.recipient}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.address}>{order.address}, {order.city}</Text>
          <Text style={styles.address}>{order.itemCount} item · {order.itemSummary} · {order.weightKg} kg</Text>
        </View>
        <Stepper status={order.status} />

        {error ? <View style={styles.pad}><ErrorBanner message={error} /></View> : null}

        {order.status === 'Assigned' && (
          <View style={styles.pad}>
            <Text style={styles.lead}>Siap menuju stop ini?</Text>
            <Text style={styles.body}>Memulai pengiriman menandai Anda sedang dalam perjalanan ke penerima ini. Hanya satu pengiriman yang boleh berjalan dalam satu waktu.</Text>
            <Button label="Mulai pengiriman" onPress={handleStart} />
          </View>
        )}

        {order.status === 'In Transit' && (
          <>
            <View style={styles.modeRow}>
              <FilterChips options={['deliver', 'fail'] as const} value={mode} onChange={(m) => { setMode(m); setError(null); }} labels={{ deliver: 'Konfirmasi serah terima', fail: 'Laporkan kendala' }} />
            </View>

            {mode === 'deliver' ? (
              <View style={styles.form}>
                <TextField label="Diterima oleh" value={receivedBy} onChangeText={setReceivedBy} placeholder="Nama orang yang menerima barang" maxLength={LIMITS.receiverMax} autoCapitalize="words" />
                <View style={{ gap: 6 }}>
                  <Text style={styles.fieldLabel}>Bukti pengiriman{order.priority === 'High' ? ' (wajib)' : ' (opsional)'}</Text>
                  {proofAt ? (
                    <View style={styles.proof}>
                      <Camera size={22} color={colors.green} />
                      <Text style={styles.proofText}>Placeholder diambil pukul {formatTime(proofAt)}. Demo ini tidak menyimpan foto.</Text>
                      <Pressable accessibilityLabel="Hapus bukti" hitSlop={10} onPress={() => setProofAt(null)}><X size={20} color={colors.textMuted} /></Pressable>
                    </View>
                  ) : (
                    <Button label="Ambil bukti (simulasi)" variant="secondary" icon={<Camera size={20} color={colors.navy900} />} onPress={() => setProofAt(new Date().toISOString())} />
                  )}
                </View>
                <TextField label="Catatan pengiriman (opsional)" value={note} onChangeText={setNote} multiline maxLength={LIMITS.noteMax} placeholder="Hal yang perlu diketahui dispatcher" />
                <Button label="Konfirmasi pengiriman" onPress={handleConfirm} icon={<Check size={20} color="#fff" />} />
              </View>
            ) : (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>Apa kendalanya?</Text>
                <View style={styles.reasons}>
                  {FAILURE_REASONS.map((r) => (
                    <Pressable key={r} accessibilityRole="radio" accessibilityState={{ selected: reason === r }} onPress={() => setReason(r)} style={[styles.reason, reason === r && styles.reasonActive]}>
                      <Text style={[styles.reasonText, reason === r && { color: colors.textOnNavy }]}>{r}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextField label={reason === OTHER_REASON ? 'Jelaskan kendalanya' : 'Catatan (opsional)'} value={note} onChangeText={setNote} multiline maxLength={LIMITS.noteMax} />
                <Button label="Laporkan pengiriman gagal" variant="danger" onPress={handleFailure} />
              </View>
            )}
          </>
        )}

        {finished && (
          <>
            <SectionTitle title="Hasil" />
            <KeyValueGroup>
              {order.completedAt && <KeyValue label="Waktu" value={formatTime(order.completedAt)} />}
              {order.receivedBy && <KeyValue label="Diterima oleh" value={order.receivedBy} />}
              {order.failureReason && <KeyValue label="Alasan" value={order.failureReason} />}
              {order.note && <KeyValue label="Catatan" value={order.note} />}
            </KeyValueGroup>
            <View style={styles.pad}>
              <Button label="Kembali ke trip" variant="secondary" onPress={() => router.replace(`/trip/${order.tripId}`)} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.navy900, paddingHorizontal: 16, paddingBottom: 18, gap: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  recipient: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.textOnNavy },
  address: { fontSize: 14, color: colors.textOnNavyMuted },
  stepper: { flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 13, color: colors.textMuted },
  pad: { padding: 16, gap: 12 },
  lead: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.textMuted, lineHeight: 21 },
  modeRow: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  form: { padding: 16, gap: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  proof: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.greenBg },
  proofText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  reasons: { gap: 8 },
  reason: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  reasonActive: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  reasonText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
