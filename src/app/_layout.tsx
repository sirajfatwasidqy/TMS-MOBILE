import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { colors } from '@/constants/theme';
import { AppProvider, useApp } from '@/state/AppProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { ready, loadError, retryLoad, signedIn } = useApp();

  useEffect(() => {
    if (ready || loadError) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, loadError]);

  if (loadError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>Tidak dapat membuka TMS Mobile</Text>
        <Text style={styles.errorBody}>{loadError}</Text>
        <Button label="Coba lagi" onPress={retryLoad} />
      </View>
    );
  }
  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy900 },
          headerTintColor: colors.textOnNavy,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="trip/[id]" options={{ title: 'Trip' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Delivery order' }} />
          <Stack.Screen name="deliver/[id]" options={{ title: 'Proses pengiriman' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: colors.bg },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  errorBody: { fontSize: 15, color: colors.textMuted, marginBottom: 8 },
});
