import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing } from '@shared/ui/theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  tone?: 'surface' | 'alt';
}

/** Tarjeta base: superficie blanca, borde sutil, esquinas redondeadas. */
export function Card({ padded = true, tone = 'surface', style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: tone === 'surface' ? colors.surface : colors.surfaceAlt },
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
