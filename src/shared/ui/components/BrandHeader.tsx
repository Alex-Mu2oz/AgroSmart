import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, shadows, spacing } from '@shared/ui/theme';

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  /** Acción opcional a la derecha (p. ej. un botón/icono). */
  right?: React.ReactNode;
  /** Muestra el logo a la izquierda (por defecto sí). */
  showLogo?: boolean;
}

/**
 * Encabezado de marca: banda verde con el logo de AgroSmart, título y subtítulo.
 * Da identidad visual consistente y presencia al logo dentro de la interfaz.
 */
export function BrandHeader({ title, subtitle, right, showLogo = true }: BrandHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.band, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.row}>
        {showLogo ? (
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="AgroSmart"
            />
          </View>
        ) : null}
        <View style={styles.texts}>
          <AppText variant="title" color={colors.textInverse}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="rgba(255,255,255,0.85)">
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadows.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logo: { width: 44, height: 44 },
  texts: { flex: 1, gap: 2 },
});
