import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui/components/AppText';
import { Button } from '@shared/ui/components/Button';
import { colors, spacing } from '@shared/ui/theme';

/** Estado de carga centrado. */
export function LoadingState({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.brand.primary} />
      <AppText variant="body" color={colors.textSecondary} style={styles.gap}>
        {mensaje}
      </AppText>
    </View>
  );
}

/** Estado de error con reintento opcional. */
export function ErrorState({
  mensaje,
  onRetry,
}: {
  mensaje: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle" size={48} color={colors.danger} />
      <AppText variant="body" center color={colors.textSecondary} style={styles.gap}>
        {mensaje}
      </AppText>
      {onRetry ? (
        <Button label="Reintentar" variant="outlined" icon="refresh" fullWidth={false} onPress={onRetry} />
      ) : null}
    </View>
  );
}

/** Estado vacío (sin datos). */
export function EmptyState({
  titulo,
  mensaje,
  icon = 'document-text-outline',
}: {
  titulo: string;
  mensaje?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={48} color={colors.disabledText} />
      <AppText variant="subtitle" center style={styles.gap}>
        {titulo}
      </AppText>
      {mensaje ? (
        <AppText variant="body" center color={colors.textSecondary}>
          {mensaje}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  gap: { marginTop: spacing.sm },
});
