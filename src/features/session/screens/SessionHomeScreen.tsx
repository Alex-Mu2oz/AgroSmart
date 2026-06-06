import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Bitacora } from '@core/models';
import { logbookRepo } from '@data/repos/logbookRepo';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { useCan } from '@shared/rbac/useCan';
import { AppText, BrandHeader, Button, Card, Screen, SemaphoreBadge } from '@shared/ui/components';
import { colors, radius, semaforoColores, spacing } from '@shared/ui/theme';

const ROL_LABEL = { agricultor: 'Agricultor', supervisor: 'Supervisor', operador: 'Operador' } as const;

/** Inicio: identidad de marca, lote activo y CTA para iniciar una sesión. */
export function SessionHomeScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const loteNombre = useSettingsStore((s) => s.loteNombre);
  const reset = useSessionDraftStore((s) => s.reset);
  const puedeCrear = useCan('CREAR_SESION');
  const [ultimas, setUltimas] = useState<Bitacora[]>([]);

  useFocusEffect(
    useCallback(() => {
      logbookRepo.list().then((rows) => setUltimas(rows.slice(0, 3)));
    }, []),
  );

  const iniciar = () => {
    reset();
    router.push('/session/step-data');
  };

  return (
    <Screen
      header={<BrandHeader title="AgroSmart" subtitle={`${rol ? ROL_LABEL[rol] : ''} · ${loteNombre}`} />}
      footer={
        puedeCrear ? (
          <Button label="Nueva fumigación" icon="add-circle" onPress={iniciar} />
        ) : (
          <AppText variant="caption" center color={colors.textSecondary}>
            Tu rol no crea sesiones. Puedes consultar el historial.
          </AppText>
        )
      }
    >
      <Card elevation="md" style={styles.infoCard}>
        <View style={styles.infoHead}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={22} color={colors.brand.primary} />
          </View>
          <AppText variant="subtitle" style={styles.flex}>
            Antes de fumigar
          </AppText>
        </View>
        <AppText variant="body" color={colors.textSecondary} style={styles.infoDescription}>
          AgroSmart calcula la mezcla, valida la concentración y carga química, y evalúa las
          condiciones ambientales. Tú tomas la decisión final.
        </AppText>

        {/* Stepper conectado horizontal */}
        <View style={styles.stepperContainer}>
          {['Datos', 'Mezcla', 'Validación', 'Ambiente', 'Decisión'].map((p, i) => (
            <View key={p} style={styles.stepItem}>
              <View style={styles.stepIconWrap}>
                <View style={styles.stepCircle}>
                  <AppText variant="caption" color={colors.brand.primary} style={styles.stepNumber}>
                    {i + 1}
                  </AppText>
                </View>
                {i < 4 && <View style={styles.stepLine} />}
              </View>
              <AppText variant="caption" color={colors.textSecondary} style={styles.stepText}>
                {p}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Últimas sesiones
      </AppText>
      {ultimas.length === 0 ? (
        <Card tone="alt" elevation="none" style={styles.emptyCard}>
          <AppText variant="body" color={colors.textSecondary}>
            Aún no hay fumigaciones registradas. Toca “Nueva fumigación” para empezar.
          </AppText>
        </Card>
      ) : (
        <View style={styles.lista}>
          {ultimas.map((b) => (
            <Card
              key={b.sesionId}
              style={[styles.row, { borderLeftColor: semaforoColores[b.semaforoGlobal].fill }]}
            >
              <View style={styles.sessionIconWrap}>
                <Ionicons name="document-text-outline" size={20} color={colors.brand.primary} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong" style={styles.sessionDate}>
                  {formatFecha(b.cerradaEn)}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={styles.sessionDecision}>
                  {b.tipoDecision.replace(/_/g, ' ').toUpperCase()}
                </AppText>
              </View>
              <SemaphoreBadge estado={b.semaforoGlobal} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  infoCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDescription: {
    lineHeight: 22,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIconWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepNumber: {
    fontWeight: '700',
    fontSize: 11,
  },
  stepLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.border,
    top: 13,
    zIndex: 1,
  },
  stepText: {
    fontSize: 10,
    marginTop: spacing.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '600' },
  emptyCard: { padding: spacing.md },
  lista: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    padding: spacing.md,
    gap: spacing.md,
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
  rowText: { flex: 1, gap: 2 },
  sessionDate: {
    fontWeight: '600',
  },
  sessionDecision: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
