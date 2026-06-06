import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  BigChoiceButton,
  Button,
  Card,
  ErrorState,
  Screen,
  SemaphoreBadge,
  StepHeader,
} from '@shared/ui/components';
import { colors, radius, semaforoColores, semaforoLabel, spacing } from '@shared/ui/theme';

/** M5 — Panel de decisión, override y registro en bitácora. */
export function DecisionStepScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const clear = useProfileStore((s) => s.clear);
  const coords = useSettingsStore((s) => s.loteCoords);
  const draft = useSessionDraftStore();
  const reset = useSessionDraftStore((s) => s.reset);

  const [overrideVisible, setOverrideVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiarPerfil = () => {
    clear();
    router.replace('/select-profile');
  };

  const panel: PanelPrefumigacion | null = useMemo(() => {
    if (!draft.validacion || !draft.ambiental || !draft.mezcla) return null;
    return construirPanel(draft.validacion, draft.ambiental, draft.mezcla);
  }, [draft.validacion, draft.ambiental, draft.mezcla]);

  console.log('DIAGNOSTIC - DecisionStepScreen:', {
    hasPanel: !!panel,
    hasRol: !!rol,
    rolValue: rol,
    hasSesionId: !!draft.sesionId,
    sesionIdValue: draft.sesionId,
    hasCreadaEn: !!draft.creadaEn,
    hasDraftValidacion: !!draft.validacion,
    hasDraftAmbiental: !!draft.ambiental,
    hasDraftMezcla: !!draft.mezcla,
  });

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
      if (Platform.OS === 'web') {
        window.alert(`No se pudo registrar: ${mensajeErrorDecision(r.error)}`);
      } else {
        Alert.alert('No se pudo registrar', mensajeErrorDecision(r.error));
      }
      return;
    }
    try {
      setGuardando(true);
      const sellada: Bitacora = await sellarBitacora(r.bitacora);
      await logbookRepo.insert(sellada);
      
      if (Platform.OS === 'web') {
        const irAlHistorial = window.confirm(
          `Sesión registrada: ${resumenDecision(r.tipoDecision)}\n\n¿Deseas ir al Historial para ver el registro?\n(Aceptar para ver Historial, Cancelar para ir al Inicio)`
        );
        reset();
        if (irAlHistorial) {
          router.replace('/(tabs)/history');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert('Sesión registrada', resumenDecision(r.tipoDecision), [
          {
            text: 'Ver historial',
            onPress: () => {
              reset();
              router.replace('/(tabs)/history');
            },
          },
          {
            text: 'Inicio',
            onPress: () => {
              reset();
              router.replace('/(tabs)');
            },
          },
        ]);
      }
    } catch {
      if (Platform.OS === 'web') {
        window.alert('Error: No se pudo guardar la bitácora. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo guardar la bitácora. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  const descartarYSalir = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(
        '¿Descartar sesión?\n\nSe borrarán todos los datos ingresados en esta sesión y volverás al inicio sin registrar ningún historial.'
      );
      if (ok) {
        reset();
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert(
        '¿Descartar sesión?',
        'Se borrarán todos los datos ingresados en esta sesión y volverás al inicio sin registrar ningún historial.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descartar y salir',
            style: 'destructive',
            onPress: () => {
              reset();
              router.replace('/(tabs)');
            },
          },
        ]
      );
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
        <Card style={styles.alertas} elevation="sm">
          <View style={styles.alertasHeader}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <AppText variant="bodyStrong" color={colors.danger} style={styles.alertasTitle}>
              Alertas Activas Detectadas ({alertas.length})
            </AppText>
          </View>
          <View style={styles.alertasList}>
            {alertas.map((a, i) => (
              <View key={`${a.codigo}-${i}`} style={styles.alertaItem}>
                <View style={[styles.dot, { backgroundColor: semaforoColores[a.severidad].fill }]} />
                <AppText variant="body" color={colors.textSecondary} style={styles.flex}>
                  {a.mensaje}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <Card style={styles.okCard} elevation="none">
          <View style={styles.okHeader}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.brand.primary} />
            <AppText variant="bodyStrong" color={colors.brand.primary} style={styles.okTitle}>
              Sin alertas de riesgo
            </AppText>
          </View>
          <AppText variant="body" color={colors.textSecondary} style={styles.okText}>
            Todas las variables técnicas y ambientales se encuentran en rangos óptimos y seguros.
          </AppText>
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
            <Card style={styles.bloqueo} elevation="none">
              <View style={styles.bloqueoHead}>
                <Ionicons name="lock-closed" size={18} color={colors.danger} />
                <AppText variant="body" color={colors.danger} style={styles.bloqueoText}>
                  Solo el operador del dron puede hacer override de una alerta {semaforoLabel.rojo}.
                </AppText>
              </View>
              <Button
                label="Cambiar de perfil"
                variant="outlined"
                icon="swap-horizontal"
                onPress={cambiarPerfil}
                style={styles.bloqueoBtn}
              />
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

        <BigChoiceButton
          label="Corregir datos de sesión"
          description="Volver al paso 1 para ajustar variables"
          icon="create-outline"
          tone="neutral"
          disabled={guardando}
          onPress={() => router.replace('/session/step-data')}
        />

        <BigChoiceButton
          label="Descartar y salir"
          description="Borrar borrador y volver al inicio"
          icon="trash-outline"
          tone="neutral"
          disabled={guardando}
          onPress={descartarYSalir}
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
  heroWrap: { alignItems: 'stretch', marginBottom: spacing.md },
  alertas: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  alertasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  alertasTitle: {
    fontSize: 15,
  },
  alertasList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  alertaItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  flex: { flex: 1, lineHeight: 20 },
  okCard: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  okText: {
    lineHeight: 20,
  },
  acciones: { marginTop: spacing.lg, gap: spacing.md },
  bloqueo: {
    borderColor: 'rgba(198, 40, 40, 0.2)',
    borderWidth: 1,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  bloqueoHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bloqueoText: {
    flex: 1,
    lineHeight: 20,
    fontWeight: '600',
  },
  bloqueoBtn: {
    marginTop: spacing.xs,
    alignSelf: 'stretch',
  },
});
