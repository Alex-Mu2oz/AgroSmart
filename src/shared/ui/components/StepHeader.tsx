import { StyleSheet, View } from 'react-native';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, spacing } from '@shared/ui/theme';

interface StepHeaderProps {
  paso: number; // 1-based
  total: number;
  titulo: string;
}

/** Encabezado del wizard: "Paso n de N" + barra de progreso + título. */
export function StepHeader({ paso, total, titulo }: StepHeaderProps) {
  const pct = Math.max(0, Math.min(1, paso / total));
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color={colors.textSecondary}>
        Paso {paso} de {total}
      </AppText>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: paso, min: 0, max: total }}
      >
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <AppText variant="title">{titulo}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.md },
  track: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: 6, backgroundColor: colors.brand.primary, borderRadius: radius.pill },
});
