import type { ClimaHorario, Producto } from '@core/models';

/**
 * Fixtures para los tests del dominio. La base de 5 productos refleja la
 * Tabla 1 del informe. Las categorías de adición e incompatibilidades son
 * provisionales (ver D-PRODDATA: a confirmar con el agrónomo).
 */
export const AGROTIN: Producto = {
  id: 'agrotin',
  nombre: 'AGROTIN',
  unidadDosis: 'L/ha',
  dosisRecomendada: 0.25,
  concentracionMinMlL: 5,
  concentracionMaxMlL: 10,
  categoriaAdicion: 'surfactant', // coadyuvante → se agrega al final
  incompatibles: [],
  source: 'seed',
};

export const BISPIRIBAC: Producto = {
  id: 'bispiribac',
  nombre: 'LEGEND/BISPIRIBAC',
  unidadDosis: 'L/ha',
  dosisRecomendada: 0.125,
  categoriaAdicion: 'agitated_soluble',
  incompatibles: [],
  source: 'seed',
};

export const PENDIMETALINA: Producto = {
  id: 'pendimetalina',
  nombre: 'PENDIMETALINA',
  unidadDosis: 'L/ha',
  dosisRecomendada: 3,
  categoriaAdicion: 'emulsifiable_concentrate',
  incompatibles: [],
  source: 'seed',
};

export const DINASTIA: Producto = {
  id: 'dinastia',
  nombre: 'DINASTÍA',
  unidadDosis: 'L/ha',
  dosisRecomendada: 0.2,
  categoriaAdicion: 'liquid_flowable',
  incompatibles: [],
  source: 'seed',
};

export const VALIDACIN: Producto = {
  id: 'validacin',
  nombre: 'VALIDACIN',
  unidadDosis: 'L/ha',
  dosisRecomendada: 1.5,
  categoriaAdicion: 'agitated_soluble',
  incompatibles: [],
  source: 'seed',
};

export const PRODUCTOS: Producto[] = [AGROTIN, BISPIRIBAC, PENDIMETALINA, DINASTIA, VALIDACIN];

/** Genera un pronóstico horario constante (útil para tests de ventana). */
export function climaHorario(
  n: number,
  base: Omit<ClimaHorario, 'iso'>,
  startHour = 0,
): ClimaHorario[] {
  return Array.from({ length: n }, (_, i) => ({
    iso: `2026-06-04T${String((startHour + i) % 24).padStart(2, '0')}:00`,
    ...base,
  }));
}

/** Condiciones ideales (todo verde). */
export const CLIMA_VERDE: Omit<ClimaHorario, 'iso'> = {
  temperaturaC: 20,
  humedadRelPct: 60,
  puntoRocioC: 12, // ΔT = 8 > 4 → verde
  vientoMs: 2,
  probPrecipPct: 5,
};
