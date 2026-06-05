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
import { colors, radius, spacing } from '@shared/ui/theme';

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
        <AppText variant="body" color={colors.textSecondary}>
          AgroSmart calcula la mezcla, valida la concentración y carga química, y evalúa las
          condiciones ambientales. Tú tomas la decisión final.
        </AppText>
        <View style={styles.pasos}>
          {['Datos', 'Mezcla', 'Validación', 'Ambiente', 'Decisión'].map((p, i) => (
            <View key={p} style={styles.pasoChip}>
              <AppText variant="caption" color={colors.brand.primary}>
                {i + 1}. {p}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Últimas sesiones
      </AppText>
      {ultimas.length === 0 ? (
        <Card tone="alt" elevation="none">
          <AppText variant="body" color={colors.textSecondary}>
            Aún no hay fumigaciones registradas. Toca “Nueva fumigación” para empezar.
          </AppText>
        </Card>
      ) : (
        <View style={styles.lista}>
          {ultimas.map((b) => (
            <Card key={b.sesionId} style={styles.row}>
              <View style={styles.rowText}>
                <AppText variant="bodyStrong">{formatFecha(b.cerradaEn)}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {b.tipoDecision.replace(/_/g, ' ')}
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
  infoCard: { gap: spacing.sm },
  infoHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  pasoChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  lista: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { gap: 2 },
});
