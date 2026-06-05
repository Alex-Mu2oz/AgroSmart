import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useCan } from '@shared/rbac/useCan';
import { AppText, BrandHeader, Button, Card, NumberField, Screen } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

const ROL_LABEL = { agricultor: 'Agricultor', supervisor: 'Supervisor', operador: 'Operador' } as const;

/** Ajustes: perfil, lote, capacidad del tanque y acceso a productos. */
export function SettingsScreen() {
  const router = useRouter();
  const rol = useProfileStore((s) => s.rol);
  const clear = useProfileStore((s) => s.clear);
  const { capacidadTanqueL, setCapacidadTanque, loteNombre, loteCoords } = useSettingsStore();
  const puedeEditarProductos = useCan('EDITAR_PRODUCTOS');

  const cambiarPerfil = () => {
    clear();
    router.replace('/select-profile');
  };

  return (
    <Screen header={<BrandHeader title="Ajustes" subtitle="Perfil, lote y equipo" />}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person-circle" size={28} color={colors.brand.primary} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{rol ? ROL_LABEL[rol] : ''}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Perfil activo
            </AppText>
          </View>
        </View>
        <Button label="Cambiar de perfil" variant="outlined" icon="swap-horizontal" onPress={cambiarPerfil} />
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Lote
      </AppText>
      <Card style={styles.card}>
        <AppText variant="bodyStrong">{loteNombre}</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {loteCoords.lat.toFixed(4)}, {loteCoords.lon.toFixed(4)} · Campoalegre, Huila
        </AppText>
      </Card>

      <AppText variant="subtitle" style={styles.section}>
        Equipo
      </AppText>
      <NumberField
        label="Capacidad del tanque"
        value={capacidadTanqueL}
        onChange={(v) => v !== undefined && v > 0 && setCapacidadTanque(v)}
        unit="L"
        step={5}
        min={1}
        help="DJI Agras T40 por defecto: 40 L"
      />

      {puedeEditarProductos ? (
        <Button
          label="Base de productos"
          variant="secondary"
          icon="flask"
          onPress={() => router.push('/products')}
          style={styles.productos}
        />
      ) : null}

      <AppText variant="caption" color={colors.textSecondary} style={styles.footer}>
        AgroSmart v1.0 · Datos de clima por Open-Meteo. La app advierte, valida y registra; la
        decisión final es del operador.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  section: { marginTop: spacing.lg },
  productos: { marginTop: spacing.lg },
  footer: { marginTop: spacing.xl },
});
