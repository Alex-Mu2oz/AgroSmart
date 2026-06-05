import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { Bitacora } from '@core/models';
import { logbookRepo } from '@data/repos/logbookRepo';
import { verificarChecksum } from '@services/crypto/checksum';
import { AppText, Card, LoadingState, Screen, SemaphoreBadge } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

/** Detalle de una sesión de la bitácora (soporte de evidencia). */
export function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bitacora, setBitacora] = useState<Bitacora | null>(null);
  const [cargando, setCargando] = useState(true);
  const [integro, setIntegro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    logbookRepo.getById(id).then(async (b) => {
      setBitacora(b);
      setCargando(false);
      if (b) setIntegro(await verificarChecksum(b));
    });
  }, [id]);

  if (cargando) return <LoadingState />;
  if (!bitacora) return <Screen><AppText variant="body">Sesión no encontrada.</AppText></Screen>;

  const b = bitacora;
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Detalle de sesión' }} />
      <Screen>
        <View style={styles.heroWrap}>
          <SemaphoreBadge estado={b.semaforoGlobal} variant="hero" detalle={b.tipoDecision.replace(/_/g, ' ')} />
        </View>

        <Card style={styles.card}>
          <Dato etiqueta="Fecha de cierre" valor={new Date(b.cerradaEn).toLocaleString('es-CO')} />
          <Dato etiqueta="Rol" valor={b.rol} />
          <Dato etiqueta="Ubicación" valor={`${b.geolocalizacion.lat.toFixed(4)}, ${b.geolocalizacion.lon.toFixed(4)}`} />
          {b.motivoOverride ? <Dato etiqueta="Motivo override" valor={b.motivoOverride} /> : null}
        </Card>

        <AppText variant="subtitle" style={styles.section}>Mezcla</AppText>
        <Card style={styles.card}>
          <Dato etiqueta="Volumen total" valor={`${round(b.mezcla.volumenTotalL)} L`} />
          <Dato etiqueta="Agua" valor={`${round(b.mezcla.volumenAguaL)} L`} />
          <Dato etiqueta="Carga química" valor={`${round(b.mezcla.cargaQuimicaPct)} %`} />
        </Card>

        <AppText variant="subtitle" style={styles.section}>Ambiente</AppText>
        <Card style={styles.card}>
          <Dato etiqueta="Semáforo ambiental" valor={b.evaluacionAmbiental.estado} />
          <Dato etiqueta="Score" valor={String(b.evaluacionAmbiental.scoreGlobal)} />
        </Card>

        <Card style={[styles.card, styles.integridad]}>
          <AppText variant="caption" color={integro ? colors.brand.primary : colors.danger}>
            {integro === null ? 'Verificando integridad…' : integro ? '✓ Checksum verificado (sin alteraciones)' : '⚠ Checksum no coincide'}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {b.checksum}
          </AppText>
        </Card>
      </Screen>
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <AppText variant="body" color={colors.textSecondary}>{etiqueta}</AppText>
      <AppText variant="bodyStrong" style={styles.valor}>{valor}</AppText>
    </View>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'flex-start', marginBottom: spacing.md },
  card: { gap: spacing.sm },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  dato: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  valor: { flexShrink: 1, textAlign: 'right' },
  integridad: { marginTop: spacing.lg, gap: spacing.xs },
});
