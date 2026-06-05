import type { Alerta, MezclaCalculada, Producto, ValidacionTecnica } from '@core/models';
import { combinarSeveridad } from '@core/calc/combinarSeveridad';

/**
 * M3 — Validación técnica de la mezcla (reglas IF-THEN del Anexo I).
 *
 * R1 Concentración por producto:  < min → amarillo ;  > max → rojo.
 * R2 Carga química:               ≤20 % verde ; 20–30 % amarillo ; >30 % rojo.
 * R3 Compatibilidad:              productos incompatibles → rojo.
 * R4 Consolidación:               estado = max(R1, R2, R3).
 */

export const CARGA_AMARILLA_PCT = 20;
export const CARGA_ROJA_PCT = 30; // umbral DJI Agras (ajustable en config)

export function evaluarTecnica(
  mezcla: MezclaCalculada,
  productos: readonly Producto[],
): ValidacionTecnica {
  const byId = new Map(productos.map((p) => [p.id, p]));
  const alertas: Alerta[] = [];

  // R1 — concentración por producto
  for (const pc of mezcla.porProducto) {
    const prod = byId.get(pc.productoId);
    if (!prod) continue;
    const { concentracionMinMlL: min, concentracionMaxMlL: max } = prod;
    if (max !== undefined && pc.concentracionResultanteMlL > max) {
      alertas.push({
        severidad: 'rojo',
        codigo: 'R1_CONCENTRACION_MAX',
        mensaje: `${prod.nombre}: concentración ${pc.concentracionResultanteMlL.toFixed(
          1,
        )} ml/L excede el máximo de etiqueta (${max} ml/L); riesgo de fitotoxicidad y deriva`,
      });
    } else if (min !== undefined && pc.concentracionResultanteMlL < min) {
      alertas.push({
        severidad: 'amarillo',
        codigo: 'R1_CONCENTRACION_MIN',
        mensaje: `${prod.nombre}: concentración por debajo del mínimo (${min} ml/L); eficacia comprometida`,
      });
    }
  }

  // R2 — carga química
  if (mezcla.cargaQuimicaPct > CARGA_ROJA_PCT) {
    alertas.push({
      severidad: 'rojo',
      codigo: 'R2_CARGA_ROJA',
      mensaje: `Carga química ${mezcla.cargaQuimicaPct.toFixed(
        1,
      )} % excede 30 % del tanque; riesgo de saturación y daño al bombeo`,
    });
  } else if (mezcla.cargaQuimicaPct > CARGA_AMARILLA_PCT) {
    alertas.push({
      severidad: 'amarillo',
      codigo: 'R2_CARGA_AMARILLA',
      mensaje: `Carga química ${mezcla.cargaQuimicaPct.toFixed(
        1,
      )} % elevada; monitorear bombeo durante el vuelo`,
    });
  }

  // R3 — compatibilidad entre productos presentes
  const idsPresentes = mezcla.porProducto.map((p) => p.productoId);
  const incompatibles = detectarIncompatibles(idsPresentes, byId);
  for (const par of incompatibles) {
    const n1 = byId.get(par[0])?.nombre ?? par[0];
    const n2 = byId.get(par[1])?.nombre ?? par[1];
    alertas.push({
      severidad: 'rojo',
      codigo: 'R3_INCOMPATIBLE',
      mensaje: `Productos incompatibles: ${n1} + ${n2}; no aplicar juntos`,
    });
  }

  // R4 — consolidación
  const estado = combinarSeveridad(...alertas.map((a) => a.severidad));
  return { estado, alertas };
}

function detectarIncompatibles(
  ids: string[],
  byId: Map<string, Producto>,
): [string, string][] {
  const pares: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i] as string;
      const b = ids[j] as string;
      const pa = byId.get(a);
      const pb = byId.get(b);
      if (pa?.incompatibles.includes(b) || pb?.incompatibles.includes(a)) {
        pares.push([a, b]);
      }
    }
  }
  return pares;
}
