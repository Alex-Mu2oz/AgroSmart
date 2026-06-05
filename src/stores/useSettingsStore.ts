import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coordenada } from '@core/models';
import { CAPACIDAD_TANQUE_DEFAULT_L, LOTE_COORDS, LOTE_NOMBRE } from '@shared/config/env';

/** Ajustes del piloto: lote activo y capacidad del tanque. Persistido. */
interface SettingsState {
  capacidadTanqueL: number;
  loteCoords: Coordenada;
  loteNombre: string;
  setCapacidadTanque: (l: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      capacidadTanqueL: CAPACIDAD_TANQUE_DEFAULT_L,
      loteCoords: LOTE_COORDS,
      loteNombre: LOTE_NOMBRE,
      setCapacidadTanque: (l) => set({ capacidadTanqueL: l }),
    }),
    {
      name: 'agrosmart-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
