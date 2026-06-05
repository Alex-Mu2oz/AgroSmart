import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { EntradaAmbiental, VariableAmbientalEvaluada } from '@core/models';
import { scoreAmbiental } from '@core/calc/scoreAmbiental';
import { useWeather } from '@features/environment/hooks/useWeather';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';
import {
  AppText,
  Button,
  Card,
  ErrorState,
  LoadingState,
  NumberField,
  OfflineBanner,
  Screen,
  SemaphoreBadge,
  StaleDataBanner,
  StepHeader,
} from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

/** M4 — Integración ambiental (clima Open-Meteo + distancia a agua manual). */
export function EnvironmentStepScreen() {
  const router = useRouter();
  const coords = useSettingsStore((s) => s.loteCoords);
  const { online } = useNetworkStatus();
  const weather = useWeather(coords);
  const setAmbiental = useSessionDraftStore((s) => s.setAmbiental);

  const [distanciaAguaM, setDistancia] = useState<number | undefined>(50);

  const entradaAmbiental: EntradaAmbiental | null = useMemo(() => {
    if (!weather.forecast || distanciaAguaM === undefined) return null;
    return {
      actual: weather.forecast.actual,
      distanciaAguaM,
      pronostico72h: weather.forecast.pronostico72h,
      antiguedadMin: weather.ageMinutes,
    };
  }, [weather.forecast, weather.ageMinutes, distanciaAguaM]);

  const evaluacion = useMemo(
    () => (entradaAmbiental ? scoreAmbiental(entradaAmbiental) : null),
    [entradaAmbiental],
  );

  useEffect(() => {
    if (evaluacion && distanciaAguaM !== undefined) setAmbiental(evaluacion, distanciaAguaM);
  }, [evaluacion, distanciaAguaM, setAmbiental]);

  if (weather.status === 'loading') return <LoadingState mensaje="Consultando clima…" />;
  if (weather.status === 'error') return <ErrorState mensaje={weather.errorMsg ?? 'Error de clima'} onRetry={weather.reload} />;

  return (
    <Screen
      footer={
        <Button
          label="Ver decisión"
          icon="arrow-forward"
          disabled={!evaluacion}
          onPress={() => router.push('/session/step-decision')}
        />
      }
    >
      <StepHeader paso={4} total={5} titulo="Condiciones ambientales" />

      {!online ? <OfflineBanner /> : null}
      {weather.status === 'degraded' ? (
        <View style={styles.banner}>
          <StaleDataBanner ageMinutes={weather.ageMinutes} />
        </View>
      ) : null}

      {evaluacion ? (
        <>
          <View style={styles.heroWrap}>
            <SemaphoreBadge
              estado={evaluacion.estado}
              variant="hero"
              detalle={`Riesgo ambiental · score ${evaluacion.scoreGlobal}`}
            />
          </View>

          <NumberField
            label="Distancia al cuerpo de agua más cercano"
            value={distanciaAguaM}
            onChange={setDistancia}
            unit="m"
            step={5}
            min={0}
            help="Ingreso manual (acequias, drenajes, quebradas)"
          />

          <AppText variant="subtitle" style={styles.section}>
            Variables
          </AppText>
          <View style={styles.lista}>
            {evaluacion.variables.map((v) => (
              <VariableRow key={v.clave} v={v} />
            ))}
          </View>

          <AppText variant="subtitle" style={styles.section}>
            Ventana sugerida (72 h)
          </AppText>
          <Card style={styles.ventana}>
            <Ionicons
              name={evaluacion.ventanaSugerida ? 'time' : 'close-circle'}
              size={22}
              color={evaluacion.ventanaSugerida ? colors.brand.primary : colors.danger}
            />
            <AppText variant="body">
              {evaluacion.ventanaSugerida
                ? `Próximo bloque apto: ${formatHora(evaluacion.ventanaSugerida.iso)}`
                : 'No hay bloques con condiciones aptas en las próximas 72 h.'}
            </AppText>
          </Card>
        </>
      ) : (
        <LoadingState mensaje="Evaluando…" />
      )}
    </Screen>
  );
}

function VariableRow({ v }: { v: VariableAmbientalEvaluada }) {
  return (
    <Card style={styles.varRow}>
      <View style={styles.varText}>
        <AppText variant="bodyStrong">{ETIQUETAS[v.clave]}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatValor(v)}
        </AppText>
      </View>
      <SemaphoreBadge estado={v.estado} />
    </Card>
  );
}

const ETIQUETAS: Record<VariableAmbientalEvaluada['clave'], string> = {
  viento: 'Viento',
  precipitacion: 'Prob. precipitación',
  distancia_agua: 'Distancia a agua',
  temperatura: 'Temperatura',
  humedad: 'Humedad relativa',
  punto_rocio: 'Margen punto de rocío',
};

function formatValor(v: VariableAmbientalEvaluada): string {
  const u: Record<VariableAmbientalEvaluada['clave'], string> = {
    viento: 'm/s',
    precipitacion: '%',
    distancia_agua: 'm',
    temperatura: '°C',
    humedad: '%',
    punto_rocio: '°C ΔT',
  };
  return `${Math.round(v.valor * 10) / 10} ${u[v.clave]}`;
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-CO', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  banner: { marginBottom: spacing.sm },
  heroWrap: { alignItems: 'flex-start', marginVertical: spacing.md },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  lista: { gap: spacing.sm },
  varRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  varText: { gap: 2 },
  ventana: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md },
});
