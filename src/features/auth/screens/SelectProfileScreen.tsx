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
  badge: string;
  accent: string;
  bgTint: string;
}

const ROLES: OpcionRol[] = [
  {
    rol: 'agricultor',
    titulo: 'Agricultor',
    descripcion: 'Control de cultivos, KPI de rendimiento e historial de aspersiones.',
    icon: 'analytics-outline',
    badge: 'KPIs & Historial',
    accent: '#1B6B3A',
    bgTint: 'rgba(27, 107, 58, 0.08)',
  },
  {
    rol: 'supervisor',
    titulo: 'Supervisor',
    descripcion: 'Planificación, dosificación de mezclas y control de calidad.',
    icon: 'calendar-outline',
    badge: 'Planificación',
    accent: '#D97706',
    bgTint: 'rgba(217, 119, 6, 0.08)',
  },
  {
    rol: 'operador',
    titulo: 'Operador del dron',
    descripcion: 'Validación en campo, seguridad climática y reporte final.',
    icon: 'navigate-outline',
    badge: 'Control en Campo',
    accent: '#0284C7',
    bgTint: 'rgba(2, 132, 199, 0.08)',
  },
];

/** Selección de perfil con UI moderna, decoraciones orgánicas y branding premium. */
export function SelectProfileScreen() {
  const router = useRouter();
  const setRol = useProfileStore((s) => s.setRol);
  const insets = useSafeAreaInsets();

  const elegir = (rol: Rol) => {
    setRol(rol);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      {/* Círculos decorativos de fondo para un efecto de iluminación ambiental */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera / Hero Container de Marca */}
        <View style={styles.heroCard}>
          <View style={styles.tag}>
            <AppText variant="caption" color={colors.brand.primary} style={styles.tagText}>
              TECNOLOGÍA DE PRECISIÓN
            </AppText>
          </View>

          <Image
            source={require('../../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="AgroSmart Logo"
          />

          <AppText variant="display" style={styles.brandTitle} center>
            AgroSmart
          </AppText>
          <AppText variant="body" center color={colors.textSecondary} style={styles.brandSubtitle}>
            Sistema Inteligente de Soporte de Decisiones para Aspersión con Drones
          </AppText>
        </View>

        {/* Sección de Selección */}
        <View style={styles.selectionHeader}>
          <AppText variant="subtitle" style={styles.selectionTitle}>
            Ingresar al Sistema
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Selecciona tu rol asignado para comenzar
          </AppText>
        </View>

        {/* Lista de Roles */}
        <View style={styles.lista}>
          {ROLES.map((o) => (
            <Pressable
              key={o.rol}
              onPress={() => elegir(o.rol)}
              accessibilityRole="button"
              accessibilityLabel={`Entrar como ${o.titulo}. ${o.descripcion}`}
              style={({ pressed }) => [
                styles.card,
                { borderLeftColor: o.accent },
                pressed && styles.pressed,
              ]}
            >
              {/* Contenedor de ícono decorado */}
              <View style={[styles.iconWrap, { backgroundColor: o.bgTint }]}>
                <Ionicons name={o.icon} size={24} color={o.accent} />
              </View>

              {/* Contenido de la tarjeta */}
              <View style={styles.cardText}>
                <View style={styles.cardHeaderRow}>
                  <AppText variant="bodyStrong" style={styles.roleTitle}>
                    {o.titulo}
                  </AppText>
                  <View style={[styles.roleBadge, { backgroundColor: o.bgTint }]}>
                    <AppText variant="caption" color={o.accent} style={styles.roleBadgeText}>
                      {o.badge}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={colors.textSecondary} style={styles.roleDescription}>
                  {o.descripcion}
                </AppText>
              </View>

              {/* Flecha de navegación */}
              <View style={styles.chevronWrap}>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Pie de página con información del piloto */}
        <View style={styles.footer}>
          <Ionicons name="leaf-outline" size={14} color={colors.brand.primary} style={styles.footerIcon} />
          <AppText variant="caption" color={colors.textSecondary} center>
            AgroSmart Piloto v1.0 · Campoalegre, Huila
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bgCircleTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.brand.primary,
    opacity: 0.06,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.brand.tertiary,
    opacity: 0.08,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    marginBottom: spacing.md,
  },
  tagText: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontWeight: '700',
    color: colors.brand.primary,
  },
  brandSubtitle: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  selectionHeader: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  selectionTitle: {
    fontWeight: '600',
  },
  lista: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  roleTitle: {
    fontWeight: '600',
  },
  roleBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleDescription: {
    lineHeight: 16,
  },
  chevronWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    opacity: 0.7,
  },
  footerIcon: {
    marginRight: spacing.xs,
  },
});

