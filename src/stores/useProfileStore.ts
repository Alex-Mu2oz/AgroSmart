import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Rol } from '@core/models';

/**
 * Perfil/rol activo (selección local SIN PIN, 1 dispositivo compartido).
 * Fuente del RBAC en la capa de presentación. Persistido en AsyncStorage.
 * `hydrated` evita el "flicker de rol" al arranque (se muestra splash hasta
 * rehidratar).
 */
interface ProfileState {
  rol: Rol | null;
  hydrated: boolean;
  setRol: (rol: Rol) => void;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      rol: null,
      hydrated: false,
      setRol: (rol) => set({ rol }),
      clear: () => set({ rol: null }),
    }),
    {
      name: 'agrosmart-profile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ rol: s.rol }),
      onRehydrateStorage: () => () => {
        // Tras rehidratar (con éxito o no), marcamos listo para enrutar.
        useProfileStore.setState({ hydrated: true });
      },
    },
  ),
);
