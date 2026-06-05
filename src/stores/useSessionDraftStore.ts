import { create } from 'zustand';
import type {
  EvaluacionAmbiental,
  ItemMezcla,
  MezclaCalculada,
  ValidacionTecnica,
} from '@core/models';

/**
 * Borrador de la sesión de fumigación (M1→M5). EN MEMORIA, no persistido:
 * una sesión dura ≤5 min y la reanudación de borrador no es un requisito.
 * Se limpia al iniciar o cerrar una sesión.
 */
interface SessionDraftState {
  // Metadatos
  sesionId: string | null;
  creadaEn: string | null;

  // M1 — entrada
  areaLoteHa?: number;
  items: ItemMezcla[];
  concentracionObjetivoMlL?: number;

  // Resultados de cada módulo
  mezcla?: MezclaCalculada;
  validacion?: ValidacionTecnica;
  ambiental?: EvaluacionAmbiental;
  distanciaAguaM?: number;

  iniciar: (sesionId: string, creadaEn: string) => void;
  setEntrada: (e: Partial<Pick<SessionDraftState, 'areaLoteHa' | 'items' | 'concentracionObjetivoMlL'>>) => void;
  setMezcla: (m: MezclaCalculada) => void;
  setValidacion: (v: ValidacionTecnica) => void;
  setAmbiental: (a: EvaluacionAmbiental, distanciaAguaM: number) => void;
  reset: () => void;
}

const ESTADO_INICIAL = {
  sesionId: null,
  creadaEn: null,
  areaLoteHa: undefined,
  items: [] as ItemMezcla[],
  concentracionObjetivoMlL: undefined,
  mezcla: undefined,
  validacion: undefined,
  ambiental: undefined,
  distanciaAguaM: undefined,
};

export const useSessionDraftStore = create<SessionDraftState>((set) => ({
  ...ESTADO_INICIAL,
  iniciar: (sesionId, creadaEn) => set({ ...ESTADO_INICIAL, sesionId, creadaEn }),
  setEntrada: (e) => set(e),
  setMezcla: (mezcla) => set({ mezcla }),
  setValidacion: (validacion) => set({ validacion }),
  setAmbiental: (ambiental, distanciaAguaM) => set({ ambiental, distanciaAguaM }),
  reset: () => set(ESTADO_INICIAL),
}));
