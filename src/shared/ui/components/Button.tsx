import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, sizes, spacing, typography } from '@shared/ui/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/** Botón de marca con 4 variantes (Primary / Secondary / Inverted / Outlined). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = VARIANTS[variant];
  const fg = isDisabled ? colors.disabledText : v.fg;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: isDisabled ? colors.disabledBg : v.bg, borderColor: isDisabled ? colors.disabledBg : v.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={sizes.iconMd} color={fg} style={styles.icon} />}
          <AppText style={[typography.bodyStrong, { color: fg }]}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const VARIANTS: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.brand.primary, fg: colors.textOnBrand, border: colors.brand.primary },
  secondary: { bg: colors.brand.secondary, fg: colors.textPrimary, border: colors.brand.secondary },
  inverted: { bg: colors.inkDark, fg: colors.textInverse, border: colors.inkDark },
  outlined: { bg: 'transparent', fg: colors.brand.primary, border: colors.brand.primary },
};

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touchMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: spacing.sm },
});
