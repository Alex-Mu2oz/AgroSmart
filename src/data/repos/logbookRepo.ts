import type { Bitacora, TipoDecision } from '@core/models';
import { getDb } from '@data/db';

interface BitacoraRow {
  sesionId: string;
  creadaEn: string;
  cerradaEn: string;
  rol: string;
  semaforoGlobal: string;
  tipoDecision: string;
  motivoOverride: string | null;
  checksum: string;
  payload: string;
}

export interface FiltroHistorial {
  desde?: string; // ISO
  hasta?: string; // ISO
  tipoDecision?: TipoDecision;
  productoId?: string;
}

function fromRow(r: BitacoraRow): Bitacora {
  // El payload guarda la Bitacora completa; las columnas son para filtrar.
  return JSON.parse(r.payload) as Bitacora;
}

export const logbookRepo = {
  /** Inserta un registro de bitácora (append-only). */
  async insert(b: Bitacora): Promise<void> {
    if (!b.checksum) throw new Error('La bitácora debe tener checksum antes de persistir');
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO bitacora
        (sesionId, creadaEn, cerradaEn, rol, semaforoGlobal, tipoDecision, motivoOverride, checksum, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        b.sesionId,
        b.creadaEn,
        b.cerradaEn,
        b.rol,
        b.semaforoGlobal,
        b.tipoDecision,
        b.motivoOverride ?? null,
        b.checksum,
        JSON.stringify(b),
      ],
    );
  },

  async getById(sesionId: string): Promise<Bitacora | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<BitacoraRow>('SELECT * FROM bitacora WHERE sesionId = ?;', [
      sesionId,
    ]);
    return row ? fromRow(row) : null;
  },

  async list(filtro: FiltroHistorial = {}): Promise<Bitacora[]> {
    const db = await getDb();
    const cond: string[] = [];
    const args: (string | number)[] = [];
    if (filtro.desde) {
      cond.push('cerradaEn >= ?');
      args.push(filtro.desde);
    }
    if (filtro.hasta) {
      cond.push('cerradaEn <= ?');
      args.push(filtro.hasta);
    }
    if (filtro.tipoDecision) {
      cond.push('tipoDecision = ?');
      args.push(filtro.tipoDecision);
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const rows = await db.getAllAsync<BitacoraRow>(
      `SELECT * FROM bitacora ${where} ORDER BY cerradaEn DESC;`,
      args,
    );
    let result = rows.map(fromRow);
    // Filtro por producto: el id vive dentro del payload (mezcla).
    if (filtro.productoId) {
      result = result.filter((b) =>
        b.mezcla.porProducto.some((p) => p.productoId === filtro.productoId),
      );
    }
    return result;
  },
};
