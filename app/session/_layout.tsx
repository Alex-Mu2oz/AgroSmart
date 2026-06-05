import { Redirect, Stack } from 'expo-router';
import { puede } from '@core/rbac/puede';
import { useProfileStore } from '@stores/useProfileStore';
import { colors } from '@shared/ui/theme';

/** Wizard de sesión (M1→M5). Solo supervisor/operador (CREAR_SESION). */
export default function SessionLayout() {
  const rol = useProfileStore((s) => s.rol);
  if (!rol || !puede(rol, 'CREAR_SESION')) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.brand.primary,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="step-data" options={{ title: 'Nueva fumigación' }} />
      <Stack.Screen name="step-mix" options={{ title: 'Mezcla' }} />
      <Stack.Screen name="step-technical" options={{ title: 'Validación técnica' }} />
      <Stack.Screen name="step-environment" options={{ title: 'Condiciones ambientales' }} />
      <Stack.Screen name="step-decision" options={{ title: 'Decisión' }} />
    </Stack>
  );
}
