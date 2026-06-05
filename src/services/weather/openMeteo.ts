import type { ClimaActual, ClimaHorario, Coordenada } from '@core/models';
import { err, isErr, ok, type Result } from '@core/result';
import { getJson, type HttpError } from '@services/http';
import { OPEN_METEO_BASE, TIMEOUTS } from '@shared/config/env';

/**
 * Cliente Open-Meteo (gratis, sin API key). Una sola llamada current+hourly
 * 72 h. El mapper traduce el DTO crudo a tipos de dominio; nadie fuera de aquí
 * ve `wind_speed_10m` ni snake_case.
 */

export type WeatherError = HttpError | { tipo: 'unitMismatch'; detalle: string };

export interface WeatherForecast {
  actual: ClimaActual;
  pronostico72h: ClimaHorario[];
}

interface OpenMeteoDTO {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    dew_point_2m: number;
    wind_speed_10m: number;
  };
  current_units?: Record<string, string>;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    wind_speed_10m: number[];
    precipitation_probability: number[];
  };
  hourly_units?: Record<string, string>;
}

export function buildUrl(coords: Coordenada): string {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lon),
    current: 'temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m',
    hourly: 'temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,precipitation_probability',
    wind_speed_unit: 'ms', // CRÍTICO: el default es km/h
    timezone: 'auto',
    forecast_hours: '72',
  });
  return `${OPEN_METEO_BASE}?${params.toString()}`;
}

export async function fetchForecast(
  coords: Coordenada,
): Promise<Result<WeatherForecast, WeatherError>> {
  const res = await getJson<OpenMeteoDTO>(buildUrl(coords), {
    timeoutMs: TIMEOUTS.openMeteo,
    retries: 2,
  });
  if (isErr(res)) return res;
  return mapForecast(res.value);
}

/** Mapper DTO → dominio. Exportado para testear sin red. */
export function mapForecast(dto: OpenMeteoDTO): Result<WeatherForecast, WeatherError> {
  const { hourly, hourly_units: hUnits, current } = dto;
  if (!hourly || !current) {
    return err({ tipo: 'parse', detalle: 'Respuesta sin current/hourly' });
  }
  // CRÍTICO: confirmar que el viento viene en m/s (umbrales M4 dependen de ello).
  const windUnit = hUnits?.wind_speed_10m;
  if (windUnit !== 'm/s') {
    return err({ tipo: 'unitMismatch', detalle: `wind_speed_10m en "${windUnit}", se esperaba m/s` });
  }

  const horas: ClimaHorario[] = hourly.time.map((iso, i) => ({
    iso,
    temperaturaC: num(hourly.temperature_2m[i]),
    humedadRelPct: num(hourly.relative_humidity_2m[i]),
    puntoRocioC: num(hourly.dew_point_2m[i]),
    vientoMs: num(hourly.wind_speed_10m[i]),
    probPrecipPct: num(hourly.precipitation_probability[i]),
  }));

  // CRÍTICO: el array horario empieza a las 00:00, no "ahora".
  let idxAhora = hourly.time.indexOf(current.time);
  if (idxAhora < 0) {
    idxAhora = hourly.time.findIndex((t) => t >= current.time);
    if (idxAhora < 0) idxAhora = 0;
  }

  const pronostico72h = horas.slice(idxAhora);

  // prob precip "2 h" = max de las próximas 2 horas (D-PRECIP: conservador).
  const ventana2h = horas.slice(idxAhora, idxAhora + 2).map((h) => h.probPrecipPct);
  const probPrecip2hPct = ventana2h.length ? Math.max(...ventana2h) : 0;

  const actual: ClimaActual = {
    temperaturaC: current.temperature_2m,
    humedadRelPct: current.relative_humidity_2m,
    puntoRocioC: current.dew_point_2m,
    vientoMs: current.wind_speed_10m,
    probPrecip2hPct,
  };

  return ok({ actual, pronostico72h });
}

const num = (v: number | undefined): number => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);
