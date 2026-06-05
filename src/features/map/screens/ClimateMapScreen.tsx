import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@stores/useSettingsStore';
import { AppText, Card, Screen } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

/**
 * Mapa climático (vista contextual OPCIONAL). El mapa real usa react-native-maps
 * (módulo nativo) y NO funciona en Expo Go; por eso, en Expo Go se muestra un
 * aviso y en development build se carga el mapa real de forma diferida.
 */
const enExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function ClimateMapScreen() {
  const loteNombre = useSettingsStore((s) => s.loteNombre);
  const coords = useSettingsStore((s) => s.loteCoords);

  if (enExpoGo) {
    return (
      <Screen topInset>
        <Card style={styles.aviso}>
          <Ionicons name="map" size={48} color={colors.brand.primary} />
          <AppText variant="subtitle" center>
            Mapa no disponible en Expo Go
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            El mapa climático usa un módulo nativo (react-native-maps) que requiere un
            development build. El resto de la app funciona normalmente aquí.
          </AppText>
          <AppText variant="caption" center color={colors.textSecondary}>
            {loteNombre} · {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </AppText>
        </Card>
      </Screen>
    );
  }

  // Carga diferida: solo se evalúa react-native-maps fuera de Expo Go.
  const { RealClimateMap } = require('@features/map/screens/RealClimateMap') as typeof import('@features/map/screens/RealClimateMap');
  return <RealClimateMap />;
}

const styles = StyleSheet.create({
  aviso: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
});
