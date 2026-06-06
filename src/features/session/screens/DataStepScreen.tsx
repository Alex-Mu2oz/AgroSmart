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

      <Card style={styles.formCard} elevation="sm">
        <View style={styles.fields}>
          <NumberField
            label="Área del cultivo"
            value={areaLoteHa}
            onChange={setArea}
            unit="ha"
            step={0.5}
            min={0}
            help="Lote piloto: 8 ha"
          />

          <View style={styles.group}>
            <AppText variant="label" color={colors.textSecondary} style={styles.labelStyle}>
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
                    style={({ pressed }) => [
                      styles.chip,
                      sel && styles.chipSel,
                      pressed && styles.pressedChip,
                    ]}
                  >
                    <AppText
                      variant="label"
                      color={sel ? colors.textOnBrand : colors.textPrimary}
                      style={styles.chipText}
                    >
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

          <View style={styles.tanque}>
            <Ionicons name="water-sharp" size={18} color={colors.brand.primary} />
            <AppText variant="label" color={colors.brand.primary} style={styles.tanqueText}>
              Capacidad del tanque: {capacidadTanqueL} L (DJI Agras T40)
            </AppText>
          </View>
        </View>
      </Card>

      {tocado && validacion && !validacion.ok ? (
        <Card style={styles.erroresBox} elevation="none">
          <Ionicons name="warning-outline" size={18} color={colors.danger} style={styles.errorIcon} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong" color={colors.danger}>
              Errores de validación:
            </AppText>
            {validacion.errores.map((e) => (
              <AppText key={e.campo} variant="caption" color={colors.danger} style={styles.errorText}>
                • {e.mensaje}
              </AppText>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  fields: { gap: spacing.md },
  group: { gap: spacing.xs },
  labelStyle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipSel: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipText: {
    fontWeight: '600',
  },
  pressedChip: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  tanque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(27, 107, 58, 0.05)',
    borderColor: 'rgba(27, 107, 58, 0.15)',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  tanqueText: {
    fontWeight: '600',
    fontSize: 13,
  },
  erroresBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
    borderColor: 'rgba(198, 40, 40, 0.15)',
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  errorIcon: {
    marginTop: 2,
  },
  errorText: {
    lineHeight: 16,
    marginTop: 2,
  },
  flex: { flex: 1 },
});
