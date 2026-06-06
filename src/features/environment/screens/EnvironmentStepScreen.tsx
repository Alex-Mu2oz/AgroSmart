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
import { colors, radius, semaforoColores, semaforoLabel, spacing } from '@shared/ui/theme';
import { formatHoraConDia as formatHora } from '@shared/utils/date';

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
            Variables de Control
          </AppText>
          <View style={styles.lista}>
            {evaluacion.variables.map((v) => (
              <VariableRow key={v.clave} v={v} />
            ))}
          </View>

          <AppText variant="subtitle" style={styles.section}>
            Ventana Sugerida (72 h)
          </AppText>
          <Card
            style={[
              styles.ventana,
              evaluacion.ventanaSugerida ? styles.ventanaOk : styles.ventanaError,
            ]}
            elevation="none"
          >
            <Ionicons
              name={evaluacion.ventanaSugerida ? 'time-sharp' : 'close-circle-sharp'}
              size={22}
              color={evaluacion.ventanaSugerida ? colors.brand.primary : colors.danger}
            />
            <AppText
              variant="body"
              color={evaluacion.ventanaSugerida ? colors.brand.primary : colors.danger}
              style={styles.ventanaText}
            >
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

const ICONS: Record<VariableAmbientalEvaluada['clave'], keyof typeof Ionicons.glyphMap> = {
  viento: 'flag-outline',
  precipitacion: 'rainy-outline',
  distancia_agua: 'water-outline',
  temperatura: 'thermometer-outline',
  humedad: 'cloudy-outline',
  punto_rocio: 'analytics-outline',
};

function VariableRow({ v }: { v: VariableAmbientalEvaluada }) {
  const icon = ICONS[v.clave] || 'help-circle-outline';
  const c = semaforoColores[v.estado];

  return (
    <Card style={styles.varBox} elevation="sm">
      <View style={styles.varHeader}>
        <View style={styles.varIconWrap}>
          <Ionicons name={icon} size={18} color={colors.brand.primary} />
        </View>
        <View style={[styles.miniBadge, { backgroundColor: c.fill }]}>
          <AppText variant="caption" color={c.text} style={styles.miniBadgeText}>
            {semaforoLabel[v.estado]}
          </AppText>
        </View>
      </View>
      <View style={styles.varContent}>
        <AppText variant="caption" color={colors.textSecondary} style={styles.varLabel} numberOfLines={1}>
          {ETIQUETAS[v.clave]}
        </AppText>
        <AppText variant="bodyStrong" style={styles.varValue}>
          {formatValor(v)}
        </AppText>
      </View>
    </Card>
  );
}

const ETIQUETAS: Record<VariableAmbientalEvaluada['clave'], string> = {
  viento: 'Viento',
  precipitacion: 'Precipitación',
  distancia_agua: 'Distancia a agua',
  temperatura: 'Temperatura',
  humedad: 'Humedad rel.',
  punto_rocio: 'Punto de rocío',
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


const styles = StyleSheet.create({
  banner: { marginBottom: spacing.sm },
  heroWrap: { alignItems: 'stretch', marginVertical: spacing.md },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '600' },
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  varBox: {
    width: '48%',
    padding: spacing.sm + 4,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  varHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  varIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadge: {
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  varContent: {
    gap: 2,
  },
  varLabel: {
    fontSize: 12,
  },
  varValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  ventana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  ventanaOk: {
    backgroundColor: 'rgba(27, 107, 58, 0.05)',
    borderColor: 'rgba(27, 107, 58, 0.15)',
  },
  ventanaError: {
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    borderColor: 'rgba(198, 40, 40, 0.15)',
  },
  ventanaText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
});
