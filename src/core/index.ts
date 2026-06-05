/** Barrel de la capa de dominio (TypeScript puro). */
export * from '@core/models';
export * from '@core/result';

export { validarEntrada, AREA_MAX_HA, HDOP_MAX } from '@core/calc/validarEntrada';
export type { ErrorCampo, ResultadoValidacion } from '@core/calc/validarEntrada';

export { calcularMezcla } from '@core/calc/calcularMezcla';
export type { ErrorMezcla } from '@core/calc/calcularMezcla';

export { evaluarTecnica, CARGA_AMARILLA_PCT, CARGA_ROJA_PCT } from '@core/calc/evaluarTecnica';

export { scoreAmbiental } from '@core/calc/scoreAmbiental';
export { calcularVentana72h, estadoHora } from '@core/calc/ventana72h';

export {
  construirPanel,
  resolverDecision,
  payloadCanonico,
  MIN_MOTIVO_OVERRIDE,
} from '@core/calc/decision';
export type { ContextoCierre, ErrorDecision, ResultadoDecision } from '@core/calc/decision';

export { combinarSeveridad, nivel } from '@core/calc/combinarSeveridad';
export { computeKpis } from '@core/calc/kpis';
export type { Kpis } from '@core/calc/kpis';

export { puede, permisosDe } from '@core/rbac/puede';
export { MATRIZ_PERMISOS } from '@core/rbac/permisos';
export type { Permiso } from '@core/rbac/permisos';
