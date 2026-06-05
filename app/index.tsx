import { Redirect } from 'expo-router';
import { useProfileStore } from '@stores/useProfileStore';

/** Punto de entrada: enruta según haya o no un perfil activo. */
export default function Index() {
  const rol = useProfileStore((s) => s.rol);
  return <Redirect href={rol ? '/(tabs)' : '/select-profile'} />;
}
