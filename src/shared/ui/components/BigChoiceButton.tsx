import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, spacing } from '@shared/ui/theme';

interface BigChoiceButtonProps {
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'primary' | 'neutral' | 'danger';
  disabled?: boolean;
}

/** Botón grande de decisión (M5): ícono + texto + descripción, target amplio. */
export function BigChoiceButton({
  label,
  description,
  icon,
  onPress,
  tone = 'primary',
  disabled,
}: BigChoiceButtonProps) {
  const palette = TONES[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label}${description ? `. ${description}` : ''}`}
      style={({ pressed }) => [
        styles.base,
        { borderColor: disabled ? colors.disabledBg : palette.border, backgroundColor: disabled ? colors.disabledBg : palette.bg },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={28} color={disabled ? colors.disabledText : palette.fg} />
      <View style={styles.texts}>
        <AppText variant="bodyStrong" color={disabled ? colors.disabledText : palette.fg}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color={disabled ? colors.disabledText : palette.fgSoft}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={22} color={disabled ? colors.disabledText : palette.fgSoft} />
    </Pressable>
  );
}

const TONES = {
  primary: { bg: colors.surface, border: colors.brand.primary, fg: colors.brand.primary, fgSoft: colors.textSecondary },
  neutral: { bg: colors.surface, border: colors.border, fg: colors.textPrimary, fgSoft: colors.textSecondary },
  danger: { bg: '#FCEBEA', border: colors.danger, fg: colors.danger, fgSoft: '#8A3A36' },
} as const;

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    minHeight: 64,
  },
  texts: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
});
