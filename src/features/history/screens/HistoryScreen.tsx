import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Bitacora, TipoDecision } from '@core/models';
import { computeKpis, type Kpis } from '@core/calc/kpis';
import { logbookRepo, type FiltroHistorial } from '@data/repos/logbookRepo';
import { useCan } from '@shared/rbac/useCan';
import { AppText, BrandHeader, Card, EmptyState, Screen, SemaphoreBadge } from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

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
              style={[styles.chip, sel && styles.chipSel]}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
            >
              <AppText variant="caption" color={sel ? colors.textOnBrand : colors.textSecondary}>
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
              <Card style={styles.row}>
                <View style={styles.rowText}>
                  <AppText variant="bodyStrong">{formatFecha(b.cerradaEn)}</AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {b.tipoDecision.replace(/_/g, ' ')} · {b.rol}
                  </AppText>
                </View>
                <SemaphoreBadge estado={b.semaforoGlobal} />
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function KpisCard({ kpis }: { kpis: Kpis }) {
  return (
    <Card style={styles.kpis}>
      <AppText variant="subtitle">KPIs de temporada</AppText>
      <View style={styles.kpiGrid}>
        <Kpi label="Sesiones" valor={String(kpis.totalSesiones)} />
        <Kpi label="Alertas atendidas" valor={`${Math.round(kpis.alertasAtendidasPct)}%`} />
        <Kpi label="Overrides rojos" valor={String(kpis.overridesRojos)} />
        <Kpi label="Postergadas" valor={String(kpis.postergadas)} />
        <Kpi label="Cumplimiento" valor={`${Math.round(kpis.cumplimientoProxyPct)}%`} />
      </View>
    </Card>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.kpi}>
      <AppText variant="title" color={colors.brand.primary}>
        {valor}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  kpis: { marginTop: spacing.md, gap: spacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpi: { minWidth: 80 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSel: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  lista: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowText: { flex: 1, gap: 2 },
});
