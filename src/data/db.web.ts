import { seedProductos } from '@data/seed/products.seed';

class WebSQLiteDatabase {
  private getTable<T>(name: string): T[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`agrosmart_${name}`);
    return data ? JSON.parse(data) : [];
  }

  private setTable<T>(name: string, rows: T[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`agrosmart_${name}`, JSON.stringify(rows));
  }

  async getAllAsync<T>(sql: string, args: any[] = []): Promise<T[]> {
    const cleaned = sql.trim().toLowerCase();

    // 1. SELECT * FROM productos
    if (cleaned.startsWith('select * from productos')) {
      const rows = this.getTable<any>('productos');
      return rows.sort((a, b) => a.nombre.localeCompare(b.nombre)) as T[];
    }

    // 2. SELECT * FROM bitacora
    if (cleaned.startsWith('select * from bitacora')) {
      let rows = this.getTable<any>('bitacora');

      if (cleaned.includes('where')) {
        const condsStr = sql.split(/where/i)[1]?.split(/order by/i)[0] || '';
        const conditions = condsStr.split(/\band\b/i).map((c) => c.trim());

        let argIndex = 0;
        for (const cond of conditions) {
          if (!cond) continue;
          const condCleaned = cond.toLowerCase();
          if (condCleaned.includes('cerradaen >=') || condCleaned.includes('cerradaen >=')) {
            const val = args[argIndex++];
            rows = rows.filter((r) => r.cerradaEn >= val);
          } else if (condCleaned.includes('cerradaen <=') || condCleaned.includes('cerradaen <=')) {
            const val = args[argIndex++];
            rows = rows.filter((r) => r.cerradaEn <= val);
          } else if (condCleaned.includes('tipodecision =') || condCleaned.includes('tipodecision=')) {
            const val = args[argIndex++];
            rows = rows.filter((r) => r.tipoDecision === val);
          } else if (condCleaned.includes('sesionid =') || condCleaned.includes('sesionid=')) {
            const val = args[argIndex++];
            rows = rows.filter((r) => r.sesionId === val);
          }
        }
      }

      if (cleaned.includes('order by cerradaen desc')) {
        rows.sort((a, b) => b.cerradaEn.localeCompare(a.cerradaEn));
      }
      return rows as T[];
    }

    throw new Error(`Query not implemented on web: ${sql}`);
  }

  async getFirstAsync<T>(sql: string, args: any[] = []): Promise<T | null> {
    const cleaned = sql.trim().toLowerCase();

    // pragma user_version
    if (cleaned.startsWith('pragma user_version')) {
      return { user_version: 1 } as any;
    }

    // SELECT * FROM productos WHERE id = ?;
    if (cleaned.startsWith('select * from productos where id')) {
      const rows = this.getTable<any>('productos');
      const id = args[0];
      return (rows.find((r) => r.id === id) || null) as T | null;
    }

    // SELECT * FROM bitacora WHERE sesionId = ?;
    if (cleaned.startsWith('select * from bitacora where sesionid')) {
      const rows = this.getTable<any>('bitacora');
      const sesionId = args[0];
      return (rows.find((r) => r.sesionId === sesionId) || null) as T | null;
    }

    // SELECT payload, fetchedAt FROM weather_cache WHERE clave = ?;
    if (cleaned.startsWith('select payload, fetchedat from weather_cache')) {
      const rows = this.getTable<any>('weather_cache');
      const clave = args[0];
      return (rows.find((r) => r.clave === clave) || null) as T | null;
    }

    throw new Error(`Query not implemented on web: ${sql}`);
  }

  async runAsync(sql: string, args: any[] = []): Promise<any> {
    const cleaned = sql.trim().toLowerCase();

    // INSERT INTO productos (including INSERT OR IGNORE)
    if (cleaned.startsWith('insert or ignore into productos') || cleaned.startsWith('insert into productos')) {
      const rows = this.getTable<any>('productos');
      const [id, nombre, unidadDosis, dosisRecomendada, concentracionMinMlL, concentracionMaxMlL, categoriaAdicion, densidad, incompatibles, source] = args;
      
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) {
        if (cleaned.startsWith('insert or ignore')) {
          // do nothing
        } else {
          rows[idx] = { id, nombre, unidadDosis, dosisRecomendada, concentracionMinMlL, concentracionMaxMlL, categoriaAdicion, densidad, incompatibles, source };
        }
      } else {
        rows.push({ id, nombre, unidadDosis, dosisRecomendada, concentracionMinMlL, concentracionMaxMlL, categoriaAdicion, densidad, incompatibles, source });
      }
      this.setTable('productos', rows);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // INSERT INTO bitacora
    if (cleaned.startsWith('insert into bitacora')) {
      const rows = this.getTable<any>('bitacora');
      const [sesionId, creadaEn, cerradaEn, rol, semaforoGlobal, tipoDecision, motivoOverride, checksum, payload] = args;
      
      const idx = rows.findIndex((r) => r.sesionId === sesionId);
      const newRow = { sesionId, creadaEn, cerradaEn, rol, semaforoGlobal, tipoDecision, motivoOverride, checksum, payload };
      if (idx >= 0) {
        rows[idx] = newRow;
      } else {
        rows.push(newRow);
      }
      this.setTable('bitacora', rows);
      return { lastInsertRowId: 1, changes: 1 };
    }

    // INSERT INTO weather_cache
    if (cleaned.startsWith('insert into weather_cache')) {
      const rows = this.getTable<any>('weather_cache');
      const [clave, payload, fetchedAt] = args;
      
      const idx = rows.findIndex((r) => r.clave === clave);
      const newRow = { clave, payload, fetchedAt };
      if (idx >= 0) {
        rows[idx] = newRow;
      } else {
        rows.push(newRow);
      }
      this.setTable('weather_cache', rows);
      return { lastInsertRowId: 1, changes: 1 };
    }

    throw new Error(`Insert/update not implemented on web: ${sql}`);
  }

  async execAsync(sql: string): Promise<void> {
    return;
  }
}

let _db: any = null;

export async function getDb(): Promise<any> {
  if (typeof window === 'undefined') {
    return new WebSQLiteDatabase();
  }
  if (_db) return _db;
  const db = new WebSQLiteDatabase();
  await seedProductos(db as any);
  _db = db;
  return db;
}

export async function _resetDbHandle(): Promise<void> {
  _db = null;
}
