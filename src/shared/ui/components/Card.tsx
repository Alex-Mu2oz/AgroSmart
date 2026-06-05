import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, shadows, spacing } from '@shared/ui/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'surface' | 'alt';
  /** Nivel de elevación visual. */
  elevation?: 'none' | 'sm' | 'md';
}

/** Tarjeta base: superficie blanca, borde sutil, esquinas redondeadas, sombra suave. */
export function Card({ padded = true, tone = 'surface', elevation = 'sm', style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tone === 'surface' ? colors.surface : colors.surfaceAlt },
        shadows[elevation],
        padded && styles.padded,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.md },
});
