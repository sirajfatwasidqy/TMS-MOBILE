import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/ErrorBanner';
import { TextField } from '@/components/TextField';
import { colors } from '@/constants/theme';
import { DEMO_ACCOUNT } from '@/constants/domain';
import { validateLogin, type LoginErrors } from '@/services/auth';
import { useApp } from '@/state/AppProvider';

export default function LoginScreen() {
  const { signIn } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [driverId, setDriverId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    const found = validateLogin(driverId, password);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;
    if (!signIn(driverId, password)) {
      setFormError('ID driver atau kata sandi salah.');
      return;
    }
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} style={styles.flex}>
        <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
          <Image source={require('../../assets/images/logo-dap.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="Logo Duta Abadi Primantara" />
          <Text style={styles.product}>Transportation Management System</Text>
          <Text style={styles.company}>Aplikasi driver · TMS Mobile</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.heading}>Masuk untuk memulai tugas Anda</Text>
          {formError ? <ErrorBanner message={formError} /> : null}
          <TextField
            label="ID driver"
            value={driverId}
            onChangeText={setDriverId}
            error={errors.driverId}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="RAJA123"
            returnKeyType="next"
          />
          <View>
            <TextField
              label="Kata sandi"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Kata sandi Anda"
              returnKeyType="done"
              onSubmitEditing={submit}
              style={{ paddingRight: 52 }}
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={styles.eye}
            >
              {showPassword ? <EyeOff size={22} color={colors.textMuted} /> : <Eye size={22} color={colors.textMuted} />}
            </Pressable>
          </View>
          <Button label="Masuk" onPress={submit} />
          <Button
            label="Isi akun demo"
            variant="secondary"
            onPress={() => {
              setDriverId(DEMO_ACCOUNT.driverId);
              setPassword(DEMO_ACCOUNT.password);
              setErrors({});
              setFormError(null);
            }}
          />
          <Text style={styles.disclaimer}>
            Proyek portofolio independen dengan data sintetis. Proses masuk hanya dicek secara lokal terhadap akun demo dan
            bukan autentikasi sungguhan.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  hero: { backgroundColor: colors.surface, alignItems: 'center', paddingHorizontal: 24, paddingBottom: 28, gap: 4, borderBottomWidth: 4, borderBottomColor: colors.navy900 },
  logo: { width: 220, height: 157, marginBottom: 8 },
  product: { fontSize: 20, fontWeight: '700', color: colors.navy900, textAlign: 'center' },
  company: { fontSize: 14, color: colors.textMuted },
  form: { padding: 24, gap: 16 },
  heading: { fontSize: 20, fontWeight: '700', color: colors.text },
  eye: { position: 'absolute', right: 14, top: 33 },
  disclaimer: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 4 },
});
