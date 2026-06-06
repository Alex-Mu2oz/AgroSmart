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
          <AppText variant="title" color={colors.textInverse} style={styles.titleText}>
            {title}
          </AppText>
          {subtitle ? (
            <View style={styles.subtitleBadge}>
              <AppText variant="caption" color={colors.textInverse} style={styles.subtitleText}>
                {subtitle}
              </AppText>
            </View>
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
    paddingBottom: spacing.lg + 4,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadows.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoWrap: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  logo: { width: 40, height: 40 },
  texts: { flex: 1, gap: 2 },
  titleText: {
    fontWeight: '700',
  },
  subtitleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
