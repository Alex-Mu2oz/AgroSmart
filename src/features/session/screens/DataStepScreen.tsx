import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import type { EntradaSesion, ItemMezcla } from '@core/models';
import { validarEntrada } from '@core/calc/validarEntrada';
import { useProducts } from '@features/products/hooks/useProducts';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useSessionDraftStore } from '@stores/useSessionDraftStore';
import { LOTE_COORDS } from '@shared/config/env';
import {
  AppText,
  Button,
  Card,
  LoadingState,
  NumberField,
  Screen,
  StepHeader,
} from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

/** M1 — Ingreso y validación de datos. */
export function DataStepScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const capacidadTanqueL = useSettingsStore((s) => s.capacidadTanqueL);
  const { productos, estado } = useProducts();
  const iniciar = useSessionDraftStore((s) => s.iniciar);
  const setEntrada = useSessionDraftStore((s) => s.setEntrada);

  const [areaLoteHa, setArea] = useState<number | undefined>(8);
  const [productoId, setProductoId] = useState<string | undefined>('agrotin');
  const [dosis, setDosis] = useState<number | undefined>(0.25);
  const [cObj, setCObj] = useState<number | undefined>(10);
  const [tocado, setTocado] = useState(false);

  const entrada: EntradaSesion | null = useMemo(() => {
    if (!rol || areaLoteHa === undefined || productoId === undefined || dosis === undefined || cObj === undefined) {
      return null;
    }
    const items: ItemMezcla[] = [{ productoId, dosisPlaneada: dosis }];
    return {
      areaLoteHa,
      coordenadas: LOTE_COORDS,
      items,
      concentracionObjetivoMlL: cObj,
      capacidadTanqueL,
      rol,
    };
  }, [rol, areaLoteHa, productoId, dosis, cObj, capacidadTanqueL]);

  const validacion = entrada ? validarEntrada(entrada) : null;
  const puedeAvanzar = !!validacion?.ok;

  const continuar = () => {
    setTocado(true);
    if (!entrada || !validacion?.ok) return;
    const id = Crypto.randomUUID();
    iniciar(id, new Date().toISOString());
    setEntrada({
      areaLoteHa: entrada.areaLoteHa,
      items: entrada.items,
      concentracionObjetivoMlL: entrada.concentracionObjetivoMlL,
    });
    router.push('/session/step-mix');
  };

  if (estado === 'loading') return <LoadingState mensaje="Cargando productos…" />;

  return (
    <Screen footer={<Button label="Calcular mezcla" icon="arrow-forward" disabled={!puedeAvanzar} onPress={continuar} />}>
      <StepHeader paso={1} total={5} titulo="Datos del lote y producto" />

      <View style={styles.fields}>
        <NumberField
          label="Área del lote"
          value={areaLoteHa}
          onChange={setArea}
          unit="ha"
          step={0.5}
          min={0}
          help="Lote piloto: 8 ha"
        />

        <View style={styles.group}>
          <AppText variant="label" color={colors.textSecondary}>
            Producto principal
          </AppText>
          <View style={styles.chips}>
            {productos.map((p) => {
              const sel = p.id === productoId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setProductoId(p.id);
                    setDosis(p.dosisRecomendada);
                    if (p.concentracionMaxMlL) setCObj(p.concentracionMaxMlL);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <AppText variant="label" color={sel ? colors.textOnBrand : colors.textPrimary}>
                    {p.nombre}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <NumberField label="Dosis planeada" value={dosis} onChange={setDosis} unit="L/ha" step={0.05} min={0} />
        <NumberField
          label="Concentración objetivo"
          value={cObj}
          onChange={setCObj}
          unit="ml/L"
          step={1}
          min={0}
          help="Máx. etiqueta AGROTIN: 10 ml/L"
        />

        <Card tone="alt" style={styles.tanque}>
          <Ionicons name="water" size={20} color={colors.brand.primary} />
          <AppText variant="label" color={colors.textSecondary}>
            Tanque: {capacidadTanqueL} L (DJI Agras T40)
          </AppText>
        </Card>
      </View>

      {tocado && validacion && !validacion.ok ? (
        <View style={styles.errores}>
          {validacion.errores.map((e) => (
            <AppText key={e.campo} variant="caption" color={colors.danger}>
              • {e.mensaje}
            </AppText>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSel: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  tanque: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errores: { marginTop: spacing.md, gap: spacing.xs },
});
