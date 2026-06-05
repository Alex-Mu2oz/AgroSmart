import { getDb } from '@data/db';

/** Caché de clima en SQLite (almacén único). Guarda el payload y su fecha. */
export interface ClimaCacheEntry<T> {
  data: T;
  fetchedAt: string; // ISO
}

export const weatherCacheRepo = {
  async get<T>(clave: string): Promise<ClimaCacheEntry<T> | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ payload: string; fetchedAt: string }>(
      'SELECT payload, fetchedAt FROM weather_cache WHERE clave = ?;',
      [clave],
    );
    if (!row) return null;
    try {
      return { data: JSON.parse(row.payload) as T, fetchedAt: row.fetchedAt };
    } catch {
      return null;
    }
  },

  async set<T>(clave: string, data: T, fetchedAt: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO weather_cache (clave, payload, fetchedAt) VALUES (?, ?, ?)
       ON CONFLICT(clave) DO UPDATE SET payload=excluded.payload, fetchedAt=excluded.fetchedAt;`,
      [clave, JSON.stringify(data), fetchedAt],
    );
  },
};
