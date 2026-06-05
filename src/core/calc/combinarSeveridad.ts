import type { Semaforo } from '@core/models';

/**
 * Orden de severidad del semáforo: verde < amarillo < rojo.
 * Única fuente de verdad, reutilizada por M3 (R4), M4 (estado ambiental)
 * y M5 (semáforo global). DRY.
 */
const ORDEN: Record<Semaforo, number> = { verde: 0, amarillo: 1, rojo: 2 };
const POR_NIVEL: Semaforo[] = ['verde', 'amarillo', 'rojo'];

export function nivel(s: Semaforo): number {
  return ORDEN[s];
}

/** Devuelve la severidad MÁXIMA. Sin argumentos → 'verde'. */
export function combinarSeveridad(...estados: Semaforo[]): Semaforo {
  let max = 0;
  for (const e of estados) {
    if (ORDEN[e] > max) max = ORDEN[e];
  }
  return POR_NIVEL[max] as Semaforo;
}
