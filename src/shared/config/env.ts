import type { Coordenada } from '@core/models';

/**
 * Constantes de configuración del piloto. Sin secretos: Open-Meteo y
 * RainViewer son gratuitos y sin API key.
 */

/** Lote piloto: Vereda Llanogrande, Campoalegre (Huila). */
export const LOTE_COORDS: Coordenada = { lat: 2.6833, lon: -75.3167 };
export const LOTE_NOMBRE = 'Lote Llanogrande (8 ha)';

/** Tanque por defecto: DJI Agras T40. */
export const CAPACIDAD_TANQUE_DEFAULT_L = 40;

export const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/** Índice de frames de radar de RainViewer (timestamps caducan ~10 min). */
export const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';

/** Timeouts de red (ms). */
export const TIMEOUTS = {
  openMeteo: 8000,
  rainviewer: 6000,
} as const;

/** TTL de caché de clima antes de considerarse "antiguo" (min). */
export const CLIMA_TTL_MIN = 60;
