import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { getDb } from '@data/db';
import { useProfileStore } from '@stores/useProfileStore';
import { LoadingState } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

/**
 * Layout raíz: carga la fuente Inter, inicializa la base SQLite y espera la
 * rehidratación del perfil antes de enrutar (evita el flicker de rol).
 * Mientras tanto muestra un splash de marca.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useProfileStore((s) => s.hydrated);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch(() => setDbReady(true)); // no bloquear el arranque si SQLite falla
  }, []);

  const listo = fontsLoaded && hydrated && dbReady;

  if (!listo) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="AgroSmart"
        />
        {fontsLoaded ? <LoadingState mensaje="Preparando AgroSmart…" /> : null}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="select-profile" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ presentation: 'modal' }} />
        <Stack.Screen name="products/index" options={{ headerShown: true, title: 'Productos' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  logo: { width: 180, height: 180, marginBottom: spacing.lg },
});
