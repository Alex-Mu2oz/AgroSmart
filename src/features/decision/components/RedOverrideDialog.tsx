import { useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MIN_MOTIVO_OVERRIDE } from '@core/calc/decision';
import { AppText, Button } from '@shared/ui/components';
import { colors, radius, semaforoColores, spacing, typography } from '@shared/ui/theme';

interface RedOverrideDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}

/**
 * Confirmación obligatoria de override sobre alerta ROJA (M5).
 * Exige motivo ≥ 20 caracteres y declaración explícita de responsabilidad.
 */
export function RedOverrideDialog({ visible, onCancel, onConfirm }: RedOverrideDialogProps) {
  const [motivo, setMotivo] = useState('');
  const restante = MIN_MOTIVO_OVERRIDE - motivo.trim().length;
  const valido = restante <= 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={[styles.header, { backgroundColor: semaforoColores.rojo.fill }]}>
            <Ionicons name="alert-circle" size={28} color={colors.textInverse} />
            <AppText variant="subtitle" color={colors.textInverse}>
              Condiciones de riesgo (ALTO)
            </AppText>
          </View>

          <View style={styles.body}>
            <AppText variant="body" color={colors.textSecondary}>
              El sistema desaconseja fumigar. Si decides continuar, asumes la responsabilidad de la
              operación. Esta decisión queda registrada con tu rol, hora y ubicación.
            </AppText>

            <AppText variant="label" color={colors.textSecondary} style={styles.lbl}>
              Motivo del override (obligatorio)
            </AppText>
            <TextInput
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={3}
              placeholder="Explica por qué continúas pese a la alerta…"
              placeholderTextColor={colors.disabledText}
              style={styles.input}
              accessibilityLabel="Motivo del override"
            />
            <AppText variant="caption" color={valido ? colors.brand.primary : colors.danger}>
              {valido ? 'Motivo suficiente' : `Mínimo ${MIN_MOTIVO_OVERRIDE} caracteres (faltan ${restante})`}
            </AppText>

            <View style={styles.actions}>
              <Button label="Cancelar" variant="outlined" onPress={onCancel} />
              <Button
                label="Sí, asumo la responsabilidad"
                variant="primary"
                disabled={!valido}
                onPress={() => onConfirm(motivo.trim())}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  body: { padding: spacing.lg, gap: spacing.sm },
  lbl: { marginTop: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    ...typography.body,
    color: colors.textPrimary,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
