import type {
  Bitacora,
  Coordenada,
  DecisionUsuario,
  EvaluacionAmbiental,
  MezclaCalculada,
  PanelPrefumigacion,
  Rol,
  Semaforo,
  TipoDecision,
  ValidacionTecnica,
} from '@core/models';
import { combinarSeveridad } from '@core/calc/combinarSeveridad';

/**
 * M5 — Alertas y panel de decisión.
 *   semaforo_global = max(estado_técnico, estado_ambiental)
 *
 * Reglas de confirmación según severidad:
 *   verde    → avance directo (recomendacion_seguida)
 *   amarillo → continuar/postergar (precaucion_aceptada si aplica)
 *   rojo     → override solo OPERADOR + motivo ≥ 20 chars (override_alerta_roja)
 *
 * El checksum de la bitácora se calcula FUERA del core (capa de servicios),
 * porque requiere expo-crypto. Aquí se construye el payload canónico.
 */

export const MIN_MOTIVO_OVERRIDE = 20;

export function construirPanel(
  validacionTecnica: ValidacionTecnica,
  evaluacionAmbiental: EvaluacionAmbiental,
  mezcla: MezclaCalculada,
): PanelPrefumigacion {
  const semaforoGlobal = combinarSeveridad(validacionTecnica.estado, evaluacionAmbiental.estado);
  return { semaforoGlobal, validacionTecnica, evaluacionAmbiental, mezcla };
}

export type ErrorDecision =
  | { tipo: 'motivo_requerido'; min: number }
  | { tipo: 'rol_no_autorizado_override_rojo'; rol: Rol };

export interface ContextoCierre {
  sesionId: string;
  creadaEn: string;
  cerradaEn: string; // timestamp inyectado
  rol: Rol;
  geolocalizacion: Coordenada;
}

export type ResultadoDecision =
  | { ok: true; bitacora: Bitacora; tipoDecision: TipoDecision }
  | { ok: false; error: ErrorDecision };

/**
 * Determina si la decisión es válida según severidad y rol, y arma la bitácora.
 * No persiste ni calcula checksum (se hacen en la capa de datos).
 */
export function resolverDecision(
  panel: PanelPrefumigacion,
  decision: DecisionUsuario,
  ctx: ContextoCierre,
): ResultadoDecision {
  const semaforo = panel.semaforoGlobal;

  if (decision.accion === 'postergar') {
    return finalizar(panel, ctx, 'postergada', undefined);
  }

  // accion === 'aplicar'
  const tipo = tipoPorSemaforo(semaforo);

  if (semaforo === 'rojo') {
    if (ctx.rol !== 'operador') {
      return { ok: false, error: { tipo: 'rol_no_autorizado_override_rojo', rol: ctx.rol } };
    }
    const motivo = decision.motivoOverride?.trim() ?? '';
    if (motivo.length < MIN_MOTIVO_OVERRIDE) {
      return { ok: false, error: { tipo: 'motivo_requerido', min: MIN_MOTIVO_OVERRIDE } };
    }
    return finalizar(panel, ctx, tipo, motivo);
  }

  return finalizar(panel, ctx, tipo, undefined);
}

function tipoPorSemaforo(s: Semaforo): TipoDecision {
  if (s === 'verde') return 'recomendacion_seguida';
  if (s === 'amarillo') return 'precaucion_aceptada';
  return 'override_alerta_roja';
}

function finalizar(
  panel: PanelPrefumigacion,
  ctx: ContextoCierre,
  tipoDecision: TipoDecision,
  motivoOverride: string | undefined,
): ResultadoDecision {
  const bitacora: Bitacora = {
    sesionId: ctx.sesionId,
    creadaEn: ctx.creadaEn,
    cerradaEn: ctx.cerradaEn,
    rol: ctx.rol,
    geolocalizacion: ctx.geolocalizacion,
    mezcla: panel.mezcla,
    validacionTecnica: panel.validacionTecnica,
    evaluacionAmbiental: panel.evaluacionAmbiental,
    semaforoGlobal: panel.semaforoGlobal,
    tipoDecision,
    ...(motivoOverride !== undefined ? { motivoOverride } : {}),
  };
  return { ok: true, bitacora, tipoDecision };
}

/**
 * Serialización canónica del payload de bitácora para el checksum.
 * Ordena las claves de forma recursiva y excluye el propio campo `checksum`,
 * de modo que el mismo contenido produzca siempre el mismo string (y hash).
 */
export function payloadCanonico(b: Bitacora): string {
  const { checksum: _omit, ...resto } = b;
  return JSON.stringify(ordenarRecursivo(resto));
}

function ordenarRecursivo(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(ordenarRecursivo);
  if (valor !== null && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = ordenarRecursivo(obj[k]);
    return out;
  }
  return valor;
}
