import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@shared/ui/components';
import { colors, spacing } from '@shared/ui/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={styles.wrap}>
        <AppText variant="title">Pantalla no encontrada</AppText>
        <Link href="/(tabs)" style={styles.link}>
          <AppText variant="bodyStrong" color={colors.brand.primary}>
            Volver al inicio
          </AppText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  link: { marginTop: spacing.md },
});
