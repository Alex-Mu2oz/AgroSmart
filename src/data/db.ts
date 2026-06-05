import * as SQLite from 'expo-sqlite';
import { seedProductos } from '@data/seed/products.seed';

/**
 * Único almacén durable de AgroSmart (expo-sqlite). Guarda la base de
 * productos, la bitácora auditable, el historial y la caché de clima.
 * Migraciones versionadas con `PRAGMA user_version`.
 */

const DB_NAME = 'agrosmart.db';
let _db: SQLite.SQLiteDatabase | null = null;

const MIGRATIONS: ((db: SQLite.SQLiteDatabase) => Promise<void>)[] = [
  // v1 — esquema inicial
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY NOT NULL,
        nombre TEXT NOT NULL,
        unidadDosis TEXT NOT NULL,
        dosisRecomendada REAL NOT NULL,
        concentracionMinMlL REAL,
        concentracionMaxMlL REAL,
        categoriaAdicion TEXT NOT NULL,
        densidad REAL,
        incompatibles TEXT NOT NULL DEFAULT '[]',
        source TEXT NOT NULL DEFAULT 'seed'
      );

      CREATE TABLE IF NOT EXISTS bitacora (
        sesionId TEXT PRIMARY KEY NOT NULL,
        creadaEn TEXT NOT NULL,
        cerradaEn TEXT NOT NULL,
        rol TEXT NOT NULL,
        semaforoGlobal TEXT NOT NULL,
        tipoDecision TEXT NOT NULL,
        motivoOverride TEXT,
        checksum TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_bitacora_cerrada ON bitacora (cerradaEn);
      CREATE INDEX IF NOT EXISTS idx_bitacora_tipo ON bitacora (tipoDecision);

      CREATE TABLE IF NOT EXISTS weather_cache (
        clave TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        fetchedAt TEXT NOT NULL
      );
    `);
  },
];

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  await seedProductos(db);
  _db = db;
  return db;
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await MIGRATIONS[i]!(db);
    version = i + 1;
  }
  // PRAGMA no admite parámetros enlazados.
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

/** Solo para tests/desarrollo: cierra y olvida la conexión. */
export async function _resetDbHandle(): Promise<void> {
  await _db?.closeAsync();
  _db = null;
}
