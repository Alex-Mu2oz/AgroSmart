import { StyleSheet, View } from 'react-native';
import { useProducts } from '@features/products/hooks/useProducts';
import { AppText, Card, LoadingState, Screen } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

const CATEGORIA_LABEL: Record<string, string> = {
  wettable_powder: 'Polvo mojable (W)',
  agitated_soluble: 'Soluble (A)',
  liquid_flowable: 'Suspensión (L)',
  emulsifiable_concentrate: 'Conc. emulsionable (E)',
  surfactant: 'Coadyuvante (S)',
};

/** Base de productos (lectura). La edición del supervisor es ampliación futura. */
export function ProductsScreen() {
  const { productos, estado } = useProducts();
  if (estado === 'loading') return <LoadingState />;

  return (
    <Screen>
      <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
        Base interna de productos (Tabla 1). Rangos de etiqueta y orden de adición.
      </AppText>
      <View style={styles.lista}>
        {productos.map((p) => (
          <Card key={p.id} style={styles.card}>
            <View style={styles.row}>
              <AppText variant="bodyStrong">{p.nombre}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {p.source === 'seed' ? 'base' : 'manual'}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary}>
              Dosis: {p.dosisRecomendada} {p.unidadDosis}
              {p.concentracionMaxMlL ? ` · etiqueta ${p.concentracionMinMlL ?? '?'}–${p.concentracionMaxMlL} ml/L` : ''}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Adición: {CATEGORIA_LABEL[p.categoriaAdicion] ?? p.categoriaAdicion}
            </AppText>
          </Card>
        ))}
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.nota}>
        Nota: la categoría de adición y las incompatibilidades deben confirmarse con el agrónomo
        (D-PRODDATA).
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: spacing.md },
  lista: { gap: spacing.sm },
  card: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nota: { marginTop: spacing.lg },
});
