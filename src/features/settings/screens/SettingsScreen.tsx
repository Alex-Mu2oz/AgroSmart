import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileStore } from '@stores/useProfileStore';
import { useSettingsStore } from '@stores/useSettingsStore';
import { useCan } from '@shared/rbac/useCan';
import { AppText, BrandHeader, Button, Card, NumberField, Screen } from '@shared/ui/components';
import { colors, radius, spacing } from '@shared/ui/theme';

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
      <Card style={styles.card} elevation="sm">
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person-outline" size={24} color={colors.brand.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="bodyStrong" style={styles.profileName}>
              {rol ? ROL_LABEL[rol] : ''}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Rol Activo de la Aplicación
            </AppText>
          </View>
        </View>
        <Button
          label="Cambiar de perfil"
          variant="outlined"
          icon="swap-horizontal"
          onPress={cambiarPerfil}
          style={styles.changeProfileBtn}
        />
      </Card>

      <View style={styles.sectionHeader}>
        <Ionicons name="location-outline" size={18} color={colors.brand.primary} />
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Lote Asignado
        </AppText>
      </View>
      <Card style={styles.card} elevation="sm">
        <View style={styles.row}>
          <Ionicons name="map-outline" size={20} color={colors.brand.primary} style={styles.cardIcon} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{loteNombre}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Coordenadas: {loteCoords.lat.toFixed(4)}, {loteCoords.lon.toFixed(4)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.locationText}>
              Campoalegre, Huila
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <Ionicons name="construct-outline" size={18} color={colors.brand.primary} />
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Equipo de Aspersión
        </AppText>
      </View>
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

      <Card style={styles.footerBox} elevation="none">
        <Ionicons name="information-circle-outline" size={18} color={colors.brand.primary} style={styles.footerIcon} />
        <AppText variant="caption" color={colors.textSecondary} style={styles.footerText}>
          AgroSmart v1.0 · Datos de clima por Open-Meteo. La app advierte, valida y registra; la
          decisión final de la aspersión es responsabilidad del operador en campo.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(27, 107, 58, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  changeProfileBtn: {
    marginTop: spacing.sm,
  },
  flex: { flex: 1 },
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
  cardIcon: {
    marginRight: spacing.xs,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  productos: { marginTop: spacing.lg },
  footerBox: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: 'rgba(27, 107, 58, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(27, 107, 58, 0.12)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  footerIcon: {
    marginTop: 1,
  },
  footerText: {
    flex: 1,
    lineHeight: 18,
  },
});
