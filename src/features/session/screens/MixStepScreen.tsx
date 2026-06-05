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

      <Card style={styles.resumen}>
        <Fila etiqueta="Volumen de agua" valor={`${fmt(mezcla.volumenAguaL)} L`} />
        <Fila etiqueta="Volumen total de mezcla" valor={`${fmt(mezcla.volumenTotalL)} L`} destacado />
        <Fila etiqueta="Carga química" valor={`${fmt(mezcla.cargaQuimicaPct)} %`} />
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Por producto
      </AppText>
      <View style={styles.lista}>
        {mezcla.porProducto.map((p) => (
          <Card key={p.productoId} style={styles.prod}>
            <AppText variant="bodyStrong">{nombre(p.productoId)}</AppText>
            <Fila etiqueta="Dosis total" valor={`${fmt(p.dosisTotalL)} L`} />
            <Fila etiqueta="Concentración" valor={`${fmt(p.concentracionResultanteMlL)} ml/L`} />
          </Card>
        ))}
      </View>

      <AppText variant="subtitle" style={styles.section}>
        Orden de adición (W-A-L-E-S)
      </AppText>
      <View style={styles.orden}>
        {mezcla.ordenAdicion.map((id, i) => (
          <View key={id} style={styles.paso}>
            <View style={styles.num}>
              <AppText variant="label" color={colors.textOnBrand}>
                {i + 1}
              </AppText>
            </View>
            <AppText variant="body">{nombre(id)}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <View style={styles.fila}>
      <AppText variant="body" color={colors.textSecondary}>
        {etiqueta}
      </AppText>
      <AppText variant={destacado ? 'subtitle' : 'bodyStrong'} color={destacado ? colors.brand.primary : colors.textPrimary}>
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
  resumen: { gap: spacing.sm },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm },
  lista: { gap: spacing.sm },
  prod: { gap: spacing.xs },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orden: { gap: spacing.sm },
  paso: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  num: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
