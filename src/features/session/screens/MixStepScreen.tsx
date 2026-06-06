import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { EntradaSesion } from '@core/models';
import { calcularMezcla } from '@core/calc/calcularMezcla';
import { isErr, isOk } from '@core/result';
import { useProducts } from '@features/products/hooks/useProducts';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { LOTE_COORDS } from '@shared/config/env';
import {
  AppText,
  Button,
  Card,
  ErrorState,
  LoadingState,
  Screen,
  StepHeader,
} from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

/** M2 — Cálculo de mezcla y volumen (muestra el cálculo paso a paso). */
export function MixStepScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const capacidadTanqueL = useSettingsStore((s) => s.capacidadTanqueL);
  const { productos, estado } = useProducts();
  const draft = useSessionDraftStore();
  const setMezcla = useSessionDraftStore((s) => s.setMezcla);

  const entrada: EntradaSesion | null = useMemo(() => {
    if (!rol || draft.areaLoteHa === undefined || draft.concentracionObjetivoMlL === undefined) return null;
    return {
      areaLoteHa: draft.areaLoteHa,
      coordenadas: LOTE_COORDS,
      items: draft.items,
      concentracionObjetivoMlL: draft.concentracionObjetivoMlL,
      capacidadTanqueL,
      rol,
    };
  }, [rol, draft.areaLoteHa, draft.concentracionObjetivoMlL, draft.items, capacidadTanqueL]);

  // Cálculo puro durante el render; el efecto solo sincroniza al store.
  const resultado = useMemo(
    () => (estado === 'ready' && entrada ? calcularMezcla(entrada, productos) : null),
    [estado, entrada, productos],
  );
  const mezcla = resultado && isOk(resultado) ? resultado.value : null;
  const error = resultado && isErr(resultado) ? mensajeError(resultado.error.tipo) : null;

  useEffect(() => {
    if (mezcla) setMezcla(mezcla);
  }, [mezcla, setMezcla]);

  const nombre = (id: string) => productos.find((p) => p.id === id)?.nombre ?? id;

  if (estado === 'loading') return <LoadingState mensaje="Cargando…" />;
  if (error) return <ErrorState mensaje={error} onRetry={() => router.back()} />;
  if (!mezcla) return <LoadingState mensaje="Calculando mezcla…" />;

  return (
    <Screen
      footer={<Button label="Validar mezcla" icon="arrow-forward" onPress={() => router.push('/session/step-technical')} />}
    >
      <StepHeader paso={2} total={5} titulo="Mezcla calculada" />

      {/* Grid de resumen en 3 columnas estilo Dashboard */}
      <Card style={styles.resumen} elevation="sm" padded={false}>
        <View style={styles.resumenGrid}>
          <View style={styles.resumenCol}>
            <AppText variant="caption" color={colors.textSecondary} center style={styles.resumenLabel}>
              Agua
            </AppText>
            <AppText variant="subtitle" color={colors.brand.primary} center style={styles.resumenVal}>
              {fmt(mezcla.volumenAguaL)} L
            </AppText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.resumenCol}>
            <AppText variant="caption" color={colors.textSecondary} center style={styles.resumenLabel}>
              Mezcla Total
            </AppText>
            <AppText variant="subtitle" color={colors.brand.primary} center style={styles.resumenVal}>
              {fmt(mezcla.volumenTotalL)} L
            </AppText>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.resumenCol}>
            <AppText variant="caption" color={colors.textSecondary} center style={styles.resumenLabel}>
              Carga Química
            </AppText>
            <AppText variant="subtitle" color={colors.brand.primary} center style={styles.resumenVal}>
              {fmt(mezcla.cargaQuimicaPct)} %
            </AppText>
          </View>
        </View>
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Detalle de Ingredientes
      </AppText>
      <View style={styles.lista}>
        {mezcla.porProducto.map((p) => (
          <Card key={p.productoId} style={styles.prod} elevation="sm">
            <AppText variant="bodyStrong" style={styles.prodName}>{nombre(p.productoId)}</AppText>
            <View style={styles.prodDivider} />
            <Fila etiqueta="Dosis total" valor={`${fmt(p.dosisTotalL)} L`} />
            <Fila etiqueta="Concentración en tanque" valor={`${fmt(p.concentracionResultanteMlL)} ml/L`} />
          </Card>
        ))}
      </View>

      <AppText variant="subtitle" style={styles.section}>
        Orden de Adición (W-A-L-E-S)
      </AppText>
      <Card style={styles.timelineCard} elevation="sm">
        <View style={styles.ordenTimeline}>
          {mezcla.ordenAdicion.map((id, i) => (
            <View key={id} style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View style={styles.timelineCircle}>
                  <AppText variant="caption" color={colors.textOnBrand} style={styles.timelineNum}>
                    {i + 1}
                  </AppText>
                </View>
                {i < mezcla.ordenAdicion.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <AppText variant="bodyStrong" style={styles.timelineTitle}>
                  {nombre(id)}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Paso {i + 1} en el orden de dilución
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <View style={styles.fila}>
      <AppText variant="body" color={colors.textSecondary} style={styles.filaLabel}>
        {etiqueta}
      </AppText>
      <AppText variant={destacado ? 'subtitle' : 'bodyStrong'} color={destacado ? colors.brand.primary : colors.textPrimary} style={styles.filaVal}>
        {valor}
      </AppText>
    </View>
  );
}

const fmt = (n: number) => Math.round(n * 10) / 10;

function mensajeError(tipo: string): string {
  if (tipo === 'volumen_insuficiente')
    return 'El volumen objetivo es insuficiente para la dosis solicitada. Baja la concentración objetivo o revisa la dosis.';
  if (tipo === 'producto_no_encontrado') return 'Producto no encontrado en la base.';
  return 'No se pudo calcular la mezcla.';
}

const styles = StyleSheet.create({
  resumen: {
    backgroundColor: colors.surface,
  },
  resumenGrid: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  resumenCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumenLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  resumenVal: {
    fontWeight: '700',
    fontSize: 18,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    height: '80%',
    alignSelf: 'center',
  },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm, fontWeight: '600' },
  lista: { gap: spacing.sm },
  prod: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  prodName: {
    fontSize: 15,
    fontWeight: '600',
  },
  prodDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  filaLabel: {
    fontSize: 13,
  },
  filaVal: {
    fontSize: 13,
    fontWeight: '600',
  },
  timelineCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  ordenTimeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 28,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNum: {
    fontWeight: '700',
    fontSize: 11,
  },
  timelineLine: {
    width: 2,
    backgroundColor: colors.brand.primary,
    flex: 1,
    marginTop: -2,
    marginBottom: -6,
    zIndex: 1,
    opacity: 0.3,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingBottom: spacing.md,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
