import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@shared/ui/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Aplica el inset superior (para pantallas sin header de navegación). */
  topInset?: boolean;
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}

/** Contenedor de pantalla: SafeArea + padding consistente + scroll opcional. */
export function Screen({ children, scroll = true, topInset = false, contentStyle, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding: ViewStyle = {
    padding: spacing.lg,
    paddingTop: topInset ? insets.top + spacing.md : spacing.lg,
    paddingBottom: spacing.xxl,
  };

  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={[padding, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
