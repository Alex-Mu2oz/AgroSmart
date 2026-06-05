import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Bitacora, DecisionUsuario, PanelPrefumigacion } from '@core/models';
import { construirPanel, resolverDecision, type ContextoCierre } from '@core/calc/decision';
import { puede } from '@core/rbac/puede';
import { sellarBitacora } from '@services/crypto/checksum';
import { logbookRepo } from '@data/repos/logbookRepo';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { RedOverrideDialog } from '@features/decision/components/RedOverrideDialog';
import {
  AppText,
  BigChoiceButton,
  Card,
  ErrorState,
  Screen,
  SemaphoreBadge,
  StepHeader,
} from '@shared/ui/components';
import { colors, semaforoColores, semaforoLabel, spacing } from '@shared/ui/theme';

/** M5 — Panel de decisión, override y registro en bitácora. */
export function DecisionStepScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const coords = useSettingsStore((s) => s.loteCoords);
  const draft = useSessionDraftStore();
  const reset = useSessionDraftStore((s) => s.reset);

  const [overrideVisible, setOverrideVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const panel: PanelPrefumigacion | null = useMemo(() => {
    if (!draft.validacion || !draft.ambiental || !draft.mezcla) return null;
    return construirPanel(draft.validacion, draft.ambiental, draft.mezcla);
  }, [draft.validacion, draft.ambiental, draft.mezcla]);

  if (!panel || !rol || !draft.sesionId || !draft.creadaEn) {
    return <ErrorState mensaje="Faltan datos de la sesión. Vuelve a iniciar." onRetry={() => router.replace('/(tabs)')} />;
  }

  const ctx: ContextoCierre = {
    sesionId: draft.sesionId,
    creadaEn: draft.creadaEn,
    cerradaEn: new Date().toISOString(),
    rol,
    geolocalizacion: coords,
  };

  const persistir = async (decision: DecisionUsuario) => {
    const r = resolverDecision(panel, decision, { ...ctx, cerradaEn: new Date().toISOString() });
    if (!r.ok) {
      Alert.alert('No se pudo registrar', mensajeErrorDecision(r.error));
      return;
    }
    try {
      setGuardando(true);
      const sellada: Bitacora = await sellarBitacora(r.bitacora);
      await logbookRepo.insert(sellada);
      reset();
      Alert.alert('Sesión registrada', resumenDecision(r.tipoDecision), [
        { text: 'Ver historial', onPress: () => router.replace('/(tabs)/history') },
        { text: 'Inicio', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la bitácora. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const aplicar = () => persistir({ accion: 'aplicar' });
  const postergar = () => persistir({ accion: 'postergar' });
  const confirmarOverride = (motivo: string) => {
    setOverrideVisible(false);
    persistir({ accion: 'aplicar', motivoOverride: motivo });
  };

  const s = panel.semaforoGlobal;
  const puedeOverrideRojo = puede(rol, 'OVERRIDE_ROJA');
  const alertas = [...panel.validacionTecnica.alertas, ...panel.evaluacionAmbiental.alertas];

  return (
    <Screen>
      <StepHeader paso={5} total={5} titulo="Panel de decisión" />

      <View style={styles.heroWrap}>
        <SemaphoreBadge estado={s} variant="hero" detalle="Semáforo global (técnico + ambiental)" />
      </View>

      {alertas.length > 0 ? (
        <Card style={styles.alertas}>
          <AppText variant="bodyStrong">Alertas activas</AppText>
          {alertas.map((a, i) => (
            <View key={`${a.codigo}-${i}`} style={styles.alertaItem}>
              <View style={[styles.dot, { backgroundColor: semaforoColores[a.severidad].fill }]} />
              <AppText variant="body" color={colors.textSecondary} style={styles.flex}>
                {a.mensaje}
              </AppText>
            </View>
          ))}
        </Card>
      ) : (
        <Card>
          <AppText variant="body">Sin alertas. Condiciones aptas para fumigar.</AppText>
        </Card>
      )}

      <View style={styles.acciones}>
        {s === 'verde' ? (
          <BigChoiceButton
            label="Iniciar fumigación"
            description="Condiciones seguras"
            icon="checkmark-circle"
            tone="primary"
            disabled={guardando}
            onPress={aplicar}
          />
        ) : null}

        {s === 'amarillo' ? (
          <BigChoiceButton
            label="Continuar con precaución"
            description="Acepto las alertas y procedo"
            icon="warning"
            tone="primary"
            disabled={guardando}
            onPress={aplicar}
          />
        ) : null}

        {s === 'rojo' ? (
          puedeOverrideRojo ? (
            <BigChoiceButton
              label="Override de alerta roja"
              description="Requiere motivo y asumir responsabilidad"
              icon="alert-circle"
              tone="danger"
              disabled={guardando}
              onPress={() => setOverrideVisible(true)}
            />
          ) : (
            <Card style={styles.bloqueo}>
              <AppText variant="body" color={colors.danger}>
                Solo el operador del dron puede hacer override de una alerta {semaforoLabel.rojo}.
              </AppText>
            </Card>
          )
        ) : null}

        <BigChoiceButton
          label="Postergar"
          description="No fumigar ahora; registrar la decisión"
          icon="time"
          tone="neutral"
          disabled={guardando}
          onPress={postergar}
        />
      </View>

      <RedOverrideDialog
        visible={overrideVisible}
        onCancel={() => setOverrideVisible(false)}
        onConfirm={confirmarOverride}
      />
    </Screen>
  );
}

function mensajeErrorDecision(error: { tipo: string; min?: number }): string {
  if (error.tipo === 'motivo_requerido') return `El motivo debe tener al menos ${error.min} caracteres.`;
  if (error.tipo === 'rol_no_autorizado_override_rojo')
    return 'Tu rol no puede hacer override de una alerta roja.';
  return 'Decisión no válida.';
}

function resumenDecision(tipo: string): string {
  const map: Record<string, string> = {
    recomendacion_seguida: 'Fumigación registrada siguiendo la recomendación.',
    precaucion_aceptada: 'Fumigación registrada con precaución.',
    override_alerta_roja: 'Override registrado con motivo y responsabilidad.',
    postergada: 'Sesión postergada y registrada.',
  };
  return map[tipo] ?? 'Sesión registrada.';
}

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'flex-start', marginBottom: spacing.md },
  alertas: { gap: spacing.sm },
  alertaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  flex: { flex: 1 },
  acciones: { marginTop: spacing.lg, gap: spacing.md },
  bloqueo: { borderColor: colors.danger, borderWidth: 1 },
});
