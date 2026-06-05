import type { Semaforo } from '@core/models';

/**
 * Umbrales operativos por variable ambiental (Tabla M4.1, Anexo I).
 * Fuente ÚNICA de clasificación, reutilizada por el scoring del momento (M4)
 * y por el buscador de ventana 72 h. DRY.
 */

export const PUNTAJE: Record<Semaforo, number> = { verde: 0, amarillo: 1, rojo: 3 };

export const PESOS = {
  viento: 3,
  precipitacion: 2,
  distancia_agua: 2,
  temperatura: 1,
  humedad: 1,
  punto_rocio: 1,
} as const;

export const clasViento = (v: number): Semaforo => (v <= 3 ? 'verde' : v <= 4 ? 'amarillo' : 'rojo');
export const clasPrecip = (p: number): Semaforo => (p <= 20 ? 'verde' : p <= 50 ? 'amarillo' : 'rojo');
export const clasDistAgua = (d: number): Semaforo => (d >= 30 ? 'verde' : d >= 15 ? 'amarillo' : 'rojo');

export const clasTemp = (t: number): Semaforo => {
  if (t >= 15 && t <= 25) return 'verde';
  if (t < 10 || t > 30) return 'rojo';
  return 'amarillo';
};

export const clasHumedad = (h: number): Semaforo => {
  if (h >= 50 && h <= 70) return 'verde';
  if (h < 30 || h > 85) return 'rojo';
  return 'amarillo';
};

export const clasPuntoRocio = (deltaT: number): Semaforo =>
  deltaT > 4 ? 'verde' : deltaT > 2 ? 'amarillo' : 'rojo';

/** Bandas del semáforo ambiental global a partir del score (D-BAND fijado). */
export function bandaPorScore(score: number): Semaforo {
  return score < 2 ? 'verde' : score <= 6 ? 'amarillo' : 'rojo';
}
