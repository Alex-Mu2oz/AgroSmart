import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { evaluarTecnica } from '@core/calc/evaluarTecnica';
import { useProducts } from '@features/products/hooks/useProducts';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { AppText, Button, Card, LoadingState, Screen, SemaphoreBadge, StepHeader } from '@shared/ui/components';
import { colors, radius, semaforoColores, spacing } from '@shared/ui/theme';

/** M3 — Validación técnica (semáforo técnico + alertas). */
export function TechnicalStepScreen() {
  const router = useRouter();
  const { productos, estado } = useProducts();
  const mezcla = useSessionDraftStore((s) => s.mezcla);
  const setValidacion = useSessionDraftStore((s) => s.setValidacion);

  // Se calcula durante el render (función pura); el efecto solo sincroniza al store.
  const validacion = useMemo(
    () => (estado === 'ready' && mezcla ? evaluarTecnica(mezcla, productos) : null),
    [estado, mezcla, productos],
  );

  useEffect(() => {
    if (validacion) setValidacion(validacion);
  }, [validacion, setValidacion]);

  if (!validacion || estado !== 'ready') return <LoadingState mensaje="Validando…" />;

  return (
    <Screen
      footer={<Button label="Evaluar ambiente" icon="arrow-forward" onPress={() => router.push('/session/step-environment')} />}
    >
      <StepHeader paso={3} total={5} titulo="Validación técnica" />

      <View style={styles.heroWrap}>
        <SemaphoreBadge estado={validacion.estado} variant="hero" detalle="Estado de la mezcla" />
      </View>

      {validacion.alertas.length === 0 ? (
        <Card style={styles.ok} elevation="none">
          <View style={styles.okHeader}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.brand.primary} />
            <AppText variant="bodyStrong" color={colors.brand.primary} style={styles.okTitle}>
              Mezcla validada con éxito
            </AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary} style={styles.okText}>
            La mezcla cumple con todos los umbrales técnicos de etiqueta y carga química requeridos.
          </AppText>
        </Card>
      ) : (
        <View style={styles.lista}>
          {validacion.alertas.map((a, i) => (
            <Card
              key={`${a.codigo}-${i}`}
              style={[styles.alerta, { borderLeftColor: semaforoColores[a.severidad].fill }]}
              elevation="sm"
            >
              <View style={styles.alertaHeader}>
                <Ionicons
                  name={a.severidad === 'rojo' ? 'alert-circle' : 'warning'}
                  size={16}
                  color={semaforoColores[a.severidad].fill}
                />
                <AppText variant="caption" color={semaforoColores[a.severidad].fill} style={styles.alertaBadgeText}>
                  {a.severidad === 'rojo' ? 'ALTO RIESGO' : 'PRECAUCIÓN'}
                </AppText>
              </View>
              <AppText variant="body" style={styles.alertaMsg}>
                {a.mensaje}
              </AppText>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'stretch', marginBottom: spacing.lg },
  ok: {
    padding: spacing.md,
    backgroundColor: 'rgba(27, 107, 58, 0.05)',
    borderColor: 'rgba(27, 107, 58, 0.15)',
    borderWidth: 1,
    borderRadius: radius.md,
  },
  okHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  okTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  okText: {
    lineHeight: 20,
  },
  lista: { gap: spacing.sm },
  alerta: {
    borderLeftWidth: 4,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  alertaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  alertaBadgeText: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  alertaMsg: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
