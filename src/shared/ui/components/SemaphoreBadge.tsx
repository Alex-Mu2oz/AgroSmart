import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Semaforo } from '@core/models';
import { AppText } from '@shared/ui/components/AppText';
import { radius, semaforoColores, semaforoLabel, spacing } from '@shared/ui/theme';

/**
 * Indicador de semáforo accesible: NUNCA depende solo del color.
 * Combina color + ícono + forma implícita + PALABRA, para usuarios con
 * daltonismo y baja alfabetización digital.
 */
const ICONO: Record<Semaforo, keyof typeof Ionicons.glyphMap> = {
  verde: 'checkmark-circle',
  amarillo: 'warning',
  rojo: 'alert-circle',
};

interface SemaphoreBadgeProps {
  estado: Semaforo;
  variant?: 'hero' | 'chip';
  /** Texto adicional opcional bajo la palabra (ej. score o mensaje corto). */
  detalle?: string;
}

export function SemaphoreBadge({ estado, variant = 'chip', detalle }: SemaphoreBadgeProps) {
  const c = semaforoColores[estado];
  const palabra = semaforoLabel[estado];
  const hero = variant === 'hero';
  const iconSize = hero ? 40 : 18;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Estado ${palabra}${detalle ? `, ${detalle}` : ''}`}
      style={[
        styles.base,
        hero ? styles.hero : styles.chip,
        { backgroundColor: c.fill, borderColor: c.border },
      ]}
    >
      <Ionicons name={ICONO[estado]} size={iconSize} color={c.text} />
      <View style={hero ? styles.heroText : styles.chipText}>
        <AppText variant={hero ? 'title' : 'label'} color={c.text} style={styles.palabra}>
          {palabra}
        </AppText>
        {hero && detalle ? (
          <AppText variant="caption" color={c.text}>
            {detalle}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  chipText: { marginLeft: spacing.xs },
  heroText: { marginLeft: spacing.md },
  palabra: { letterSpacing: 0.5 },
});
