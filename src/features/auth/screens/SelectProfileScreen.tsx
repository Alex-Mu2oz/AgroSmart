import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Rol } from '@core/models';
import { useProfileStore } from '@stores/useProfileStore';
import { AppText } from '@shared/ui/components';
import { colors, radius, shadows, sizes, spacing } from '@shared/ui/theme';

interface OpcionRol {
  rol: Rol;
  titulo: string;
  descripcion: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ROLES: OpcionRol[] = [
  { rol: 'agricultor', titulo: 'Agricultor', descripcion: 'Dueño del cultivo · historial y KPIs', icon: 'person' },
  { rol: 'supervisor', titulo: 'Supervisor', descripcion: 'Coordina y prepara sesiones', icon: 'clipboard' },
  { rol: 'operador', titulo: 'Operador del dron', descripcion: 'Ejecuta y decide en campo', icon: 'navigate' },
];

/** Selección de perfil local (sin PIN). Marca AgroSmart en el encabezado. */
export function SelectProfileScreen() {
  const router = useRouter();
  const setRol = useProfileStore((s) => s.setRol);
  const insets = useSafeAreaInsets();

  const elegir = (rol: Rol) => {
    setRol(rol);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      style={styles.screen}
    >
      <View style={styles.brand}>
        <Image
          source={require('../../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="AgroSmart"
        />
        <AppText variant="display" center>
          AgroSmart
        </AppText>
        <AppText variant="body" center color={colors.textSecondary}>
          Soporte técnico para fumigación con dron
        </AppText>
      </View>

      <AppText variant="subtitle" style={styles.prompt}>
        ¿Quién va a usar la app?
      </AppText>

      <View style={styles.lista}>
        {ROLES.map((o) => (
          <Pressable
            key={o.rol}
            onPress={() => elegir(o.rol)}
            accessibilityRole="button"
            accessibilityLabel={`Entrar como ${o.titulo}. ${o.descripcion}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={o.icon} size={sizes.iconLg} color={colors.brand.primary} />
            </View>
            <View style={styles.cardText}>
              <AppText variant="bodyStrong">{o.titulo}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {o.descripcion}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={sizes.iconMd} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  brand: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 120, height: 120, marginBottom: spacing.sm },
  prompt: { marginTop: spacing.md },
  lista: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 72,
    ...shadows.sm,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
});
