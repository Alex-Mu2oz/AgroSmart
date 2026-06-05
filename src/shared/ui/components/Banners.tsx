import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, semaforoColores, spacing } from '@shared/ui/theme';

/** Banner persistente de "sin conexión". */
export function OfflineBanner() {
  return (
    <View style={[styles.banner, { backgroundColor: colors.inkDark }]} accessibilityRole="alert">
      <Ionicons name="cloud-offline" size={18} color={colors.textInverse} />
      <AppText variant="label" color={colors.textInverse} style={styles.text}>
        Sin conexión — usando datos guardados
      </AppText>
    </View>
  );
}

/** Banner de dato meteorológico antiguo (modo degradado del M4). */
export function StaleDataBanner({ ageMinutes }: { ageMinutes: number }) {
  const amarillo = semaforoColores.amarillo;
  return (
    <View style={[styles.banner, { backgroundColor: amarillo.fill, borderColor: amarillo.border }]}>
      <Ionicons name="time" size={18} color={amarillo.text} />
      <AppText variant="label" color={amarillo.text} style={styles.text}>
        Datos de hace {formatAge(ageMinutes)} — pueden no estar actualizados
      </AppText>
    </View>
  );
}

function formatAge(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${Math.round(min % 60)} min`;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  text: { flex: 1 },
});
