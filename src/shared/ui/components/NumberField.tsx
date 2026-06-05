import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui/components/AppText';
import { colors, radius, sizes, spacing, typography } from '@shared/ui/theme';

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  error?: string;
  help?: string;
}

/**
 * Campo numérico con steppers +/− y unidad visible, pensado para campo
 * (menos escritura, targets grandes). Acepta decimales con coma o punto.
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 1,
  min,
  max,
  error,
  help,
}: NumberFieldProps) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');

  const commit = (raw: string) => {
    setText(raw);
    const normalized = raw.replace(',', '.').trim();
    if (normalized === '') return onChange(undefined);
    const n = Number(normalized);
    if (!Number.isNaN(n)) onChange(n);
  };

  const bump = (delta: number) => {
    const current = value ?? 0;
    let next = Math.round((current + delta) * 1000) / 1000;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setText(String(next));
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="label" color={colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.row, { borderColor: error ? colors.danger : colors.border }]}>
        <Pressable
          onPress={() => bump(-step)}
          accessibilityRole="button"
          accessibilityLabel={`Disminuir ${label}`}
          style={styles.stepper}
        >
          <Ionicons name="remove" size={sizes.iconMd} color={colors.brand.primary} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={commit}
          keyboardType="decimal-pad"
          accessibilityLabel={label}
          style={styles.input}
          placeholder="0"
          placeholderTextColor={colors.disabledText}
        />
        {unit ? (
          <AppText variant="label" color={colors.textSecondary} style={styles.unit}>
            {unit}
          </AppText>
        ) : null}
        <Pressable
          onPress={() => bump(step)}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
          style={styles.stepper}
        >
          <Ionicons name="add" size={sizes.iconMd} color={colors.brand.primary} />
        </Pressable>
      </View>
      {error ? (
        <AppText variant="caption" color={colors.danger}>
          {error}
        </AppText>
      ) : help ? (
        <AppText variant="caption" color={colors.textSecondary}>
          {help}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minHeight: sizes.touchMin,
  },
  stepper: {
    width: sizes.touchMin,
    height: sizes.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    ...typography.bodyStrong,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  unit: { paddingHorizontal: spacing.xs },
});
