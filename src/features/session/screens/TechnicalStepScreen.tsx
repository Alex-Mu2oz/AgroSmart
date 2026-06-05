import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
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
        <Card style={styles.ok}>
          <AppText variant="body">
            La mezcla cumple los umbrales técnicos de etiqueta y carga química.
          </AppText>
        </Card>
      ) : (
        <View style={styles.lista}>
          {validacion.alertas.map((a, i) => (
            <Card key={`${a.codigo}-${i}`} style={[styles.alerta, { borderLeftColor: semaforoColores[a.severidad].fill }]}>
              <SemaphoreBadge estado={a.severidad} />
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
  heroWrap: { alignItems: 'flex-start', marginBottom: spacing.lg },
  ok: {},
  lista: { gap: spacing.sm },
  alerta: { borderLeftWidth: 4, borderRadius: radius.md, gap: spacing.sm },
  alertaMsg: { color: colors.textPrimary },
});
