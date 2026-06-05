/**
 * Modelos de dominio de AgroSmart — TypeScript PURO.
 *
 * Regla de la capa: este archivo (y todo `src/core`) NO importa nada de
 * `react`, `expo-*`, `fetch`, `Date`, ni `react-native-maps`. El tiempo, los
 * ids y el hash entran como parámetros. Las unidades van explícitas en los
 * nombres y comentarios.
 */

// ───────────────────────────── Enums / uniones ─────────────────────────────

/** Roles del sistema (RBAC). */
export type Rol = 'agricultor' | 'supervisor' | 'operador';

/** Estado de semáforo. Orden de severidad: verde < amarillo < rojo. */
export type Semaforo = 'verde' | 'amarillo' | 'rojo';

/** Unidad declarada en la ficha de etiqueta del producto. */
export type UnidadDosis = 'L/ha' | 'ml/L';

/**
 * Categoría de adición para el orden de mezcla (regla W-A-L-E-S).
 * Wettable powders → Agitated/soluble → Liquid flowables →
 * Emulsifiable concentrates → Surfactants/coadyuvantes.
 */
export type CategoriaAdicion =
  | 'wettable_powder' // W
  | 'agitated_soluble' // A
  | 'liquid_flowable' // L
  | 'emulsifiable_concentrate' // E
  | 'surfactant'; // S (coadyuvantes como AGROTIN)

/** Tipo de decisión final registrada en bitácora (M5). */
export type TipoDecision =
  | 'recomendacion_seguida' // verde, aplicado
  | 'precaucion_aceptada' // amarillo, aplicado
  | 'override_alerta_roja' // rojo, aplicado con justificación
  | 'postergada'; // cualquier estado, no aplicada

// ───────────────────────────── Entidades base ──────────────────────────────

/** Coordenada geográfica con calidad de señal (HDOP). */
export interface Coordenada {
  lat: number; // grados, [-90, 90]
  lon: number; // grados, [-180, 180]
  hdop?: number; // Horizontal Dilution of Precision; válido si < 5
}

/** Producto agroquímico de la base interna (validada contra ICA). */
export interface Producto {
  id: string;
  nombre: string;
  unidadDosis: UnidadDosis;
  dosisRecomendada: number; // en `unidadDosis`
  /** Concentración objetivo de etiqueta (solo productos ml/L). */
  concentracionMinMlL?: number;
  concentracionMaxMlL?: number;
  categoriaAdicion: CategoriaAdicion;
  /** Densidad para convertir L↔ml si hiciera falta; por defecto se asume 1. */
  densidad?: number;
  /** Ids de productos incompatibles (R3). Relación simétrica. */
  incompatibles: string[];
  /** Distingue dato sembrado del binario vs editado por el supervisor. */
  source: 'seed' | 'manual';
}

/** Item de la mezcla: un producto con su dosis planeada para la sesión. */
export interface ItemMezcla {
  productoId: string;
  /** Dosis planeada por el usuario, en la unidad del producto. */
  dosisPlaneada: number;
}

// ──────────────────────────── M1: Sesión / entrada ─────────────────────────

/** Entrada cruda capturada por M1 (antes de validar). */
export interface EntradaSesion {
  areaLoteHa: number;
  coordenadas: Coordenada;
  items: ItemMezcla[];
  /** Concentración objetivo (ml/L) — input principal de M2 (ver D-COBJ). */
  concentracionObjetivoMlL: number;
  /** Volumen total objetivo (L) — solo valida ≤ 5 × capacidad del tanque. */
  volumenTotalObjetivoL?: number;
  capacidadTanqueL: number;
  rol: Rol;
}

/** Sesión estructurada y válida producida por M1. */
export interface Sesion extends EntradaSesion {
  id: string; // UUID inyectado
  creadaEn: string; // ISO timestamp inyectado
  creadaPorRol: Rol;
}

// ──────────────────────────── M2: Mezcla calculada ─────────────────────────

/** Resultado de cálculo por producto. */
export interface ProductoCalculado {
  productoId: string;
  dosisTotalL: number; // D_total
  volumenProductoL: number; // aporte del producto al tanque
  concentracionResultanteMlL: number; // C
}

/** Salida de M2. */
export interface MezclaCalculada {
  porProducto: ProductoCalculado[];
  volumenAguaL: number; // V_agua
  volumenTotalL: number; // V_total_mezcla
  cargaQuimicaPct: number; // Carga_Q
  /** Ids de productos en el orden de adición sugerido (W-A-L-E-S). */
  ordenAdicion: string[];
}

// ─────────────────────────── M3: Validación técnica ────────────────────────

export interface Alerta {
  severidad: Semaforo;
  mensaje: string;
  /** Origen de la alerta para trazabilidad. */
  codigo: string;
}

/** Salida de M3. */
export interface ValidacionTecnica {
  estado: Semaforo;
  alertas: Alerta[];
}

// ─────────────────────────── M4: Integración ambiental ─────────────────────

/** Lectura horaria de clima normalizada al dominio (mapper la produce). */
export interface ClimaHorario {
  iso: string; // timestamp de la hora
  temperaturaC: number;
  humedadRelPct: number;
  puntoRocioC: number;
  vientoMs: number; // SIEMPRE m/s (el mapper lo garantiza)
  probPrecipPct: number;
}

/** Snapshot de condiciones actuales usado para el semáforo del momento. */
export interface ClimaActual {
  temperaturaC: number;
  humedadRelPct: number;
  puntoRocioC: number;
  vientoMs: number;
  /** Prob. de precipitación derivada de las próximas 2 h (ver D-PRECIP). */
  probPrecip2hPct: number;
}

/** Entrada ambiental: clima + distancia a agua (manual) + pronóstico. */
export interface EntradaAmbiental {
  actual: ClimaActual;
  /** Distancia al cuerpo de agua más cercano (m), entrada manual (M4). */
  distanciaAguaM: number;
  /** Pronóstico horario 72 h para la ventana de fumigación. */
  pronostico72h: ClimaHorario[];
  /** Antigüedad del dato en minutos (>0 si proviene de caché degradada). */
  antiguedadMin?: number;
}

export interface VariableAmbientalEvaluada {
  clave: 'viento' | 'precipitacion' | 'temperatura' | 'humedad' | 'distancia_agua' | 'punto_rocio';
  valor: number;
  estado: Semaforo;
  puntaje: number; // 0 | 1 | 3
  peso: number;
}

export interface BloqueVentana {
  iso: string;
  estado: Semaforo;
}

/** Salida de M4. */
export interface EvaluacionAmbiental {
  estado: Semaforo;
  scoreGlobal: number;
  variables: VariableAmbientalEvaluada[];
  /** Próximo bloque horario con semáforo verde dentro de 72 h (o null). */
  ventanaSugerida: BloqueVentana | null;
  antiguedadMin: number;
  alertas: Alerta[];
}

// ─────────────────────────── M5: Decisión / bitácora ───────────────────────

export type AccionDecision = 'aplicar' | 'postergar';

/** Decisión tomada por el usuario en el panel pre-fumigación. */
export interface DecisionUsuario {
  accion: AccionDecision;
  /** Motivo obligatorio (≥20 chars) cuando hay override de alerta roja. */
  motivoOverride?: string;
}

/** Panel pre-fumigación consolidado (entrada a la decisión). */
export interface PanelPrefumigacion {
  semaforoGlobal: Semaforo;
  validacionTecnica: ValidacionTecnica;
  evaluacionAmbiental: EvaluacionAmbiental;
  mezcla: MezclaCalculada;
}

/** Registro auditable de una sesión (M5). El hash se calcula fuera del core. */
export interface Bitacora {
  sesionId: string;
  creadaEn: string;
  cerradaEn: string;
  rol: Rol;
  geolocalizacion: Coordenada;
  mezcla: MezclaCalculada;
  validacionTecnica: ValidacionTecnica;
  evaluacionAmbiental: EvaluacionAmbiental;
  semaforoGlobal: Semaforo;
  tipoDecision: TipoDecision;
  motivoOverride?: string;
  /** Checksum SHA-256 del payload canónico (se inyecta; ver D-HASH). */
  checksum?: string;
}
