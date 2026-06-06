import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Bitacora } from '@core/models';
import { logbookRepo } from '@data/repos/logbookRepo';
import { verificarChecksum } from '@services/crypto/checksum';
import { AppText, Card, LoadingState, Screen, SemaphoreBadge } from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

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
          <SemaphoreBadge estado={b.semaforoGlobal} variant="hero" detalle={b.tipoDecision.replace(/_/g, ' ').toUpperCase()} />
        </View>

        {/* Sección General */}
        <Card style={styles.card} elevation="sm">
          <Dato etiqueta="Fecha de cierre" valor={new Date(b.cerradaEn).toLocaleString('es-CO')} />
          <Dato etiqueta="Rol de registro" valor={b.rol.toUpperCase()} />
          <Dato etiqueta="Ubicación (Lote)" valor={`${b.geolocalizacion.lat.toFixed(4)}, ${b.geolocalizacion.lon.toFixed(4)}`} />
          {b.motivoOverride ? <Dato etiqueta="Motivo de Override" valor={b.motivoOverride} isLast={true} /> : null}
        </Card>

        {/* Sección Mezcla */}
        <View style={styles.sectionHeader}>
          <Ionicons name="beaker-outline" size={18} color={colors.brand.primary} />
          <AppText variant="subtitle" style={styles.sectionTitle}>Dosificación de Mezcla</AppText>
        </View>
        <Card style={styles.card} elevation="sm">
          <Dato etiqueta="Volumen total" valor={`${round(b.mezcla.volumenTotalL)} L`} />
          <Dato etiqueta="Agua requerida" valor={`${round(b.mezcla.volumenAguaL)} L`} />
          <Dato etiqueta="Carga de ingredientes" valor={`${round(b.mezcla.cargaQuimicaPct)} %`} isLast={true} />
        </Card>

        {/* Sección Ambiente */}
        <View style={styles.sectionHeader}>
          <Ionicons name="partly-sunny-outline" size={18} color={colors.brand.primary} />
          <AppText variant="subtitle" style={styles.sectionTitle}>Evaluación Ambiental</AppText>
        </View>
        <Card style={styles.card} elevation="sm">
          <Dato etiqueta="Semáforo ambiental" valor={b.evaluacionAmbiental.estado.toUpperCase()} />
          <Dato etiqueta="Puntuación de seguridad" valor={`${b.evaluacionAmbiental.scoreGlobal} / 100`} isLast={true} />
        </Card>

        {/* Verificación de Integridad */}
        <Card style={[styles.card, styles.integridad, integro ? styles.integroOk : styles.integroError]} elevation="none">
          <View style={styles.integridadHeader}>
            <Ionicons
              name={integro ? 'shield-checkmark-sharp' : 'alert-circle-sharp'}
              size={20}
              color={integro ? colors.brand.primary : colors.danger}
            />
            <AppText variant="bodyStrong" color={integro ? colors.brand.primary : colors.danger}>
              {integro === null ? 'Verificando firma digital…' : integro ? 'Firma digital íntegra' : 'Firma digital no válida'}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={styles.checksumText}>
            Checksum: {b.checksum}
          </AppText>
        </Card>
      </Screen>
    </>
  );
}

interface DatoProps {
  etiqueta: string;
  valor: string;
  isLast?: boolean;
}

function Dato({ etiqueta, valor, isLast = false }: DatoProps) {
  return (
    <View style={[styles.dato, !isLast && styles.datoBorder]}>
      <AppText variant="body" color={colors.textSecondary} style={styles.etiqueta}>
        {etiqueta}
      </AppText>
      <AppText variant="bodyStrong" style={styles.valor}>
        {valor}
      </AppText>
    </View>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;

const styles = StyleSheet.create({
  heroWrap: { alignItems: 'stretch', marginBottom: spacing.md },
  card: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  datoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  etiqueta: {
    fontSize: 14,
  },
  valor: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  integridad: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  integroOk: {
    backgroundColor: 'rgba(27, 107, 58, 0.06)',
    borderColor: 'rgba(27, 107, 58, 0.2)',
  },
  integroError: {
    backgroundColor: 'rgba(198, 40, 40, 0.06)',
    borderColor: 'rgba(198, 40, 40, 0.2)',
  },
  integridadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checksumText: {
    fontFamily: 'monospace',
    fontSize: 11,
    marginTop: 2,
  },
});
