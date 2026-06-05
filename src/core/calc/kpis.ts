import type { Bitacora } from '@core/models';

/**
 * M6 — Cálculo de KPIs (reductor PURO sobre la bitácora). Fase posterior.
 * No accede a base de datos; recibe los registros ya cargados.
 */

export interface Kpis {
  totalSesiones: number;
  consumoPorProductoL: Record<string, number>; // Σ dosis aplicada por producto
  alertasAtendidasPct: number; // recomendacion_seguida / total
  overridesRojos: number;
  postergadas: number;
  /** Proxy local de cumplimiento: sesiones sin override rojo / total. */
  cumplimientoProxyPct: number;
  /** Reducción vs línea base AS-IS (si se provee consumo base por producto). */
  reduccionVsBasePct?: Record<string, number>;
}

export function computeKpis(
  bitacoras: readonly Bitacora[],
  consumoBaseL?: Record<string, number>,
): Kpis {
  const total = bitacoras.length;
  const aplicadas = bitacoras.filter((b) => b.tipoDecision !== 'postergada');

  const consumoPorProductoL: Record<string, number> = {};
  for (const b of aplicadas) {
    for (const pc of b.mezcla.porProducto) {
      consumoPorProductoL[pc.productoId] =
        (consumoPorProductoL[pc.productoId] ?? 0) + pc.dosisTotalL;
    }
  }

  const seguidas = bitacoras.filter((b) => b.tipoDecision === 'recomendacion_seguida').length;
  const overridesRojos = bitacoras.filter((b) => b.tipoDecision === 'override_alerta_roja').length;
  const postergadas = bitacoras.filter((b) => b.tipoDecision === 'postergada').length;

  const reduccionVsBasePct = consumoBaseL
    ? Object.fromEntries(
        Object.entries(consumoBaseL).map(([id, base]) => {
          const actual = consumoPorProductoL[id] ?? 0;
          const pct = base > 0 ? ((base - actual) / base) * 100 : 0;
          return [id, pct];
        }),
      )
    : undefined;

  return {
    totalSesiones: total,
    consumoPorProductoL,
    alertasAtendidasPct: total > 0 ? (seguidas / total) * 100 : 0,
    overridesRojos,
    postergadas,
    cumplimientoProxyPct: total > 0 ? ((total - overridesRojos) / total) * 100 : 0,
    ...(reduccionVsBasePct ? { reduccionVsBasePct } : {}),
  };
}
