import type * as SQLite from 'expo-sqlite';
import type { Producto } from '@core/models';

/**
 * Base inicial de 5 productos (Tabla 1 del informe), sembrada de forma
 * idempotente (INSERT OR IGNORE por id). El supervisor puede ampliarla a 20.
 *
 * NOTA (D-PRODDATA): `categoriaAdicion` e `incompatibles` son provisionales y
 * deben confirmarse con el agrónomo del cliente.
 */
export const PRODUCTOS_SEED: Producto[] = [
  {
    id: 'agrotin',
    nombre: 'AGROTIN',
    unidadDosis: 'L/ha',
    dosisRecomendada: 0.25,
    concentracionMinMlL: 5,
    concentracionMaxMlL: 10,
    categoriaAdicion: 'surfactant',
    incompatibles: [],
    source: 'seed',
  },
  {
    id: 'bispiribac',
    nombre: 'LEGEND/BISPIRIBAC',
    unidadDosis: 'L/ha',
    dosisRecomendada: 0.125,
    categoriaAdicion: 'agitated_soluble',
    incompatibles: [],
    source: 'seed',
  },
  {
    id: 'pendimetalina',
    nombre: 'PENDIMETALINA',
    unidadDosis: 'L/ha',
    dosisRecomendada: 3,
    categoriaAdicion: 'emulsifiable_concentrate',
    incompatibles: [],
    source: 'seed',
  },
  {
    id: 'dinastia',
    nombre: 'DINASTÍA',
    unidadDosis: 'L/ha',
    dosisRecomendada: 0.2,
    categoriaAdicion: 'liquid_flowable',
    incompatibles: [],
    source: 'seed',
  },
  {
    id: 'validacin',
    nombre: 'VALIDACIN',
    unidadDosis: 'L/ha',
    dosisRecomendada: 1.5,
    categoriaAdicion: 'agitated_soluble',
    incompatibles: [],
    source: 'seed',
  },
];

export async function seedProductos(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const p of PRODUCTOS_SEED) {
    await db.runAsync(
      `INSERT OR IGNORE INTO productos
        (id, nombre, unidadDosis, dosisRecomendada, concentracionMinMlL, concentracionMaxMlL, categoriaAdicion, densidad, incompatibles, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        p.id,
        p.nombre,
        p.unidadDosis,
        p.dosisRecomendada,
        p.concentracionMinMlL ?? null,
        p.concentracionMaxMlL ?? null,
        p.categoriaAdicion,
        p.densidad ?? null,
        JSON.stringify(p.incompatibles),
        p.source,
      ],
    );
  }
}
