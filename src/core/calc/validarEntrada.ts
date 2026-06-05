import type { EntradaSesion } from '@core/models';

/**
 * M1 — Validación de datos de entrada.
 * Reglas de rango del Anexo I (Tabla M1.1) + reglas IF-THEN del módulo.
 * No hace I/O: la georreferenciación inversa y el RBAC viven en capas
 * superiores; aquí solo se validan rangos y consistencia.
 */

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: ErrorCampo[];
  /** Advertencias que no bloquean (p.ej. HDOP alto → ofrecer trazado manual). */
  advertencias: ErrorCampo[];
}

export const AREA_MAX_HA = 50; // límite operativo del piloto
export const HDOP_MAX = 5;

export function validarEntrada(e: EntradaSesion): ResultadoValidacion {
  const errores: ErrorCampo[] = [];
  const advertencias: ErrorCampo[] = [];

  // area_lote
  if (!(e.areaLoteHa > 0) || e.areaLoteHa > AREA_MAX_HA) {
    errores.push({ campo: 'areaLoteHa', mensaje: 'Área fuera del rango operativo (0–50 ha)' });
  }

  // coordenadas
  const { lat, lon, hdop } = e.coordenadas;
  if (!(lat >= -90 && lat <= 90)) {
    errores.push({ campo: 'coordenadas.lat', mensaje: 'Latitud fuera de rango [-90, 90]' });
  }
  if (!(lon >= -180 && lon <= 180)) {
    errores.push({ campo: 'coordenadas.lon', mensaje: 'Longitud fuera de rango [-180, 180]' });
  }
  if (hdop !== undefined && hdop >= HDOP_MAX) {
    advertencias.push({
      campo: 'coordenadas.hdop',
      mensaje: 'Señal GPS imprecisa (HDOP ≥ 5); se ofrece trazado manual del polígono',
    });
  }

  // capacidad del tanque
  if (!(e.capacidadTanqueL > 0)) {
    errores.push({ campo: 'capacidadTanqueL', mensaje: 'Capacidad del tanque debe ser > 0' });
  }

  // concentración objetivo
  if (!(e.concentracionObjetivoMlL > 0)) {
    errores.push({
      campo: 'concentracionObjetivoMlL',
      mensaje: 'Concentración objetivo debe ser > 0',
    });
  }

  // volumen total objetivo (opcional): si se da, ≤ 5 × tanque
  if (e.volumenTotalObjetivoL !== undefined) {
    if (!(e.volumenTotalObjetivoL > 0)) {
      errores.push({ campo: 'volumenTotalObjetivoL', mensaje: 'Volumen objetivo debe ser > 0' });
    } else if (e.capacidadTanqueL > 0 && e.volumenTotalObjetivoL > 5 * e.capacidadTanqueL) {
      errores.push({
        campo: 'volumenTotalObjetivoL',
        mensaje: 'Volumen objetivo supera 5× la capacidad del tanque',
      });
    }
  }

  // items / dosis
  if (e.items.length === 0) {
    errores.push({ campo: 'items', mensaje: 'Debe incluir al menos un producto' });
  }
  e.items.forEach((it, i) => {
    if (!(it.dosisPlaneada > 0)) {
      errores.push({ campo: `items[${i}].dosisPlaneada`, mensaje: 'Dosis planeada debe ser > 0' });
    }
    if (!it.productoId) {
      errores.push({ campo: `items[${i}].productoId`, mensaje: 'Producto requerido' });
    }
  });

  return { ok: errores.length === 0, errores, advertencias };
}
