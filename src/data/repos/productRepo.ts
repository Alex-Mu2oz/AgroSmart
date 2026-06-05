import type { CategoriaAdicion, Producto, UnidadDosis } from '@core/models';
import { getDb } from '@data/db';

interface ProductoRow {
  id: string;
  nombre: string;
  unidadDosis: string;
  dosisRecomendada: number;
  concentracionMinMlL: number | null;
  concentracionMaxMlL: number | null;
  categoriaAdicion: string;
  densidad: number | null;
  incompatibles: string;
  source: string;
}

function fromRow(r: ProductoRow): Producto {
  return {
    id: r.id,
    nombre: r.nombre,
    unidadDosis: r.unidadDosis as UnidadDosis,
    dosisRecomendada: r.dosisRecomendada,
    ...(r.concentracionMinMlL !== null ? { concentracionMinMlL: r.concentracionMinMlL } : {}),
    ...(r.concentracionMaxMlL !== null ? { concentracionMaxMlL: r.concentracionMaxMlL } : {}),
    categoriaAdicion: r.categoriaAdicion as CategoriaAdicion,
    ...(r.densidad !== null ? { densidad: r.densidad } : {}),
    incompatibles: safeParseArray(r.incompatibles),
    source: r.source === 'manual' ? 'manual' : 'seed',
  };
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export const productRepo = {
  async getAll(): Promise<Producto[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ProductoRow>('SELECT * FROM productos ORDER BY nombre;');
    return rows.map(fromRow);
  },

  async getById(id: string): Promise<Producto | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ProductoRow>('SELECT * FROM productos WHERE id = ?;', [id]);
    return row ? fromRow(row) : null;
  },

  /** Inserta o actualiza (edición del supervisor). */
  async upsert(p: Producto): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO productos
        (id, nombre, unidadDosis, dosisRecomendada, concentracionMinMlL, concentracionMaxMlL, categoriaAdicion, densidad, incompatibles, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        nombre=excluded.nombre, unidadDosis=excluded.unidadDosis, dosisRecomendada=excluded.dosisRecomendada,
        concentracionMinMlL=excluded.concentracionMinMlL, concentracionMaxMlL=excluded.concentracionMaxMlL,
        categoriaAdicion=excluded.categoriaAdicion, densidad=excluded.densidad,
        incompatibles=excluded.incompatibles, source=excluded.source;`,
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
  },
};
