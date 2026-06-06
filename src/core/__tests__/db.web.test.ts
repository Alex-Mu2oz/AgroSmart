import { beforeEach, describe, expect, it } from 'vitest';
import { getDb, _resetDbHandle } from '../../data/db.web';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Assign to global
global.window = {} as any;
global.localStorage = localStorageMock as any;

describe('Web SQLite Adapter (db.web.ts)', () => {
  beforeEach(() => {
    localStorageMock.clear();
    _resetDbHandle();
  });

  it('initializes and seeds products table', async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    // Verify products are seeded
    const products = await db.getAllAsync('SELECT * FROM productos ORDER BY nombre;');
    expect(products.length).toBeGreaterThan(0);
    expect(products.find((p: any) => p.id === 'agrotin')).toBeDefined();
  });

  it('performs product lookups by id', async () => {
    const db = await getDb();
    const product = await db.getFirstAsync('SELECT * FROM productos WHERE id = ?;', ['agrotin']);
    expect(product).not.toBeNull();
    expect((product as any).id).toBe('agrotin');
    expect((product as any).nombre).toBe('AGROTIN');
  });

  it('stores and retrieves bitacora rows', async () => {
    const db = await getDb();
    
    // Insert a logbook entry
    const bRow = [
      'session-123',
      '2026-06-06T08:00:00Z',
      '2026-06-06T08:05:00Z',
      'operador',
      'verde',
      'recomendacion_seguida',
      null,
      'checksum-xyz',
      JSON.stringify({ sesionId: 'session-123', semaforoGlobal: 'verde' }),
    ];
    
    await db.runAsync(
      'INSERT INTO bitacora (sesionId, creadaEn, cerradaEn, rol, semaforoGlobal, tipoDecision, motivoOverride, checksum, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      bRow
    );

    // Retrieve single row
    const row = await db.getFirstAsync('SELECT * FROM bitacora WHERE sesionId = ?;', ['session-123']);
    expect(row).not.toBeNull();
    expect((row as any).sesionId).toBe('session-123');
    expect((row as any).rol).toBe('operador');

    // List rows with order
    const list = await db.getAllAsync('SELECT * FROM bitacora ORDER BY cerradaEn DESC;');
    expect(list.length).toBe(1);
    expect((list[0] as any).sesionId).toBe('session-123');

    // Test filtering by tipoDecision
    const matchFilter = await db.getAllAsync('SELECT * FROM bitacora WHERE tipoDecision = ? ORDER BY cerradaEn DESC;', ['recomendacion_seguida']);
    expect(matchFilter.length).toBe(1);

    const emptyFilter = await db.getAllAsync('SELECT * FROM bitacora WHERE tipoDecision = ? ORDER BY cerradaEn DESC;', ['override_alerta_roja']);
    expect(emptyFilter.length).toBe(0);
  });

  it('updates weather cache entry', async () => {
    const db = await getDb();

    // Insert cache entry
    await db.runAsync(
      'INSERT INTO weather_cache (clave, payload, fetchedAt) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET payload=excluded.payload, fetchedAt=excluded.fetchedAt;',
      ['lat,lon', JSON.stringify({ temp: 32 }), '2026-06-06T08:00:00Z']
    );

    // Get cache entry
    const cache = await db.getFirstAsync('SELECT payload, fetchedAt FROM weather_cache WHERE clave = ?;', ['lat,lon']);
    expect(cache).not.toBeNull();
    expect(JSON.parse((cache as any).payload).temp).toBe(32);
  });

  it('throws error for unsupported queries', async () => {
    const db = await getDb();
    await expect(db.getAllAsync('SELECT * FROM users;')).rejects.toThrow();
  });
});
