import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Bitacora, TipoDecision } from '@core/models';
import { computeKpis, type Kpis } from '@core/calc/kpis';
import { logbookRepo, type FiltroHistorial } from '@data/repos/logbookRepo';
import { useCan } from '@shared/rbac/useCan';
import { AppText, BrandHeader, Card, EmptyState, Screen, SemaphoreBadge } from '@shared/ui/components';
import { colors, radius, semaforoColores, spacing } from '@shared/ui/theme';
import { formatFechaLarga as formatFecha } from '@shared/utils/date';

const FILTROS: { key: TipoDecision | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'recomendacion_seguida', label: 'Seguidas' },
  { key: 'precaucion_aceptada', label: 'Precaución' },
  { key: 'override_alerta_roja', label: 'Overrides' },
  { key: 'postergada', label: 'Postergadas' },
];

/** Historial filtrable + dashboard de KPIs (gate DASHBOARD_KPIS). */
export function HistoryScreen() {
  const router = useRouter();
  const verKpis = useCan('DASHBOARD_KPIS');
  const [filtro, setFiltro] = useState<TipoDecision | 'todas'>('todas');
  const [sesiones, setSesiones] = useState<Bitacora[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);

  const cargar = useCallback(() => {
    const f: FiltroHistorial = filtro === 'todas' ? {} : { tipoDecision: filtro };
    logbookRepo.list(f).then(setSesiones);
    if (verKpis) logbookRepo.list().then((all) => setKpis(computeKpis(all)));
  }, [filtro, verKpis]);

  useFocusEffect(useCallback(() => cargar(), [cargar]));

  return (
    <Screen header={<BrandHeader title="Historial" subtitle="Bitácora de fumigaciones" />}>
      {verKpis && kpis ? <KpisCard kpis={kpis} /> : null}

      <View style={styles.filtros}>
        {FILTROS.map((f) => {
          const sel = f.key === filtro;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFiltro(f.key)}
              style={({ pressed }) => [
                styles.chip,
                sel && styles.chipSel,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
            >
              <AppText variant="caption" color={sel ? colors.textOnBrand : colors.textSecondary} style={styles.chipText}>
                {f.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {sesiones.length === 0 ? (
        <EmptyState titulo="Sin sesiones" mensaje="Las fumigaciones registradas aparecerán aquí." icon="time-outline" />
      ) : (
        <View style={styles.lista}>
          {sesiones.map((b) => (
            <Pressable key={b.sesionId} onPress={() => router.push(`/detail/${b.sesionId}`)}>
              {({ pressed }) => (
                <Card
                  style={[
                    styles.row,
                    { borderLeftColor: semaforoColores[b.semaforoGlobal].fill },
                    pressed && styles.pressedRow,
                  ]}
                >
                  <View style={styles.sessionIconWrap}>
                    <Ionicons name="document-text-outline" size={20} color={colors.brand.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <AppText variant="bodyStrong" style={styles.sessionDate}>
                      {formatFecha(b.cerradaEn)}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} style={styles.sessionDecision}>
                      {b.tipoDecision.replace(/_/g, ' ').toUpperCase()} · {b.rol.toUpperCase()}
                    </AppText>
                  </View>
                  <SemaphoreBadge estado={b.semaforoGlobal} />
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </Card>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function KpisCard({ kpis }: { kpis: Kpis }) {
  return (
    <Card style={styles.kpis} elevation="md">
      <AppText variant="bodyStrong" style={styles.kpiTitle}>KPIs de temporada</AppText>
      
      <View style={styles.kpiRow}>
        <Kpi label="Sesiones" valor={String(kpis.totalSesiones)} icon="calendar-outline" />
        <Kpi label="Alertas OK" valor={`${Math.round(kpis.alertasAtendidasPct)}%`} icon="shield-checkmark-outline" />
        <Kpi label="Overrides" valor={String(kpis.overridesRojos)} icon="alert-circle-outline" />
      </View>

      <View style={styles.kpiRow}>
        <Kpi label="Postergadas" valor={String(kpis.postergadas)} icon="time-outline" />
        <Kpi label="Cumplimiento" valor={`${Math.round(kpis.cumplimientoProxyPct)}%`} icon="trophy-outline" />
      </View>
    </Card>
  );
}

interface KpiProps {
  label: string;
  valor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function Kpi({ label, valor, icon }: KpiProps) {
  return (
    <View style={styles.kpiBox}>
      <Ionicons name={icon} size={16} color={colors.brand.primary} style={styles.kpiIcon} />
      <AppText variant="subtitle" color={colors.brand.primary} style={styles.kpiValue}>
        {valor}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} center style={styles.kpiLabel}>
        {label}
      </AppText>
    </View>
  );
}


const styles = StyleSheet.create({
  kpis: {
    marginTop: spacing.md,
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  kpiTitle: {
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 76,
  },
  kpiIcon: {
    marginBottom: 2,
    opacity: 0.8,
  },
  kpiValue: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
  },
  kpiLabel: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSel: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
  pressedRow: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  lista: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderLeftWidth: 4,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  sessionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  sessionDate: {
    fontWeight: '600',
  },
  sessionDecision: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
