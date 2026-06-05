import { useCallback, useEffect, useState } from 'react';
import type { Coordenada } from '@core/models';
import { isOk } from '@core/result';
import { fetchForecast, type WeatherForecast } from '@services/weather/openMeteo';
import { weatherCacheRepo } from '@data/repos/weatherCacheRepo';
import { useNetworkStatus } from '@shared/hooks/useNetworkStatus';

export type WeatherStatus = 'loading' | 'success' | 'degraded' | 'error';

export interface WeatherResult {
  status: WeatherStatus;
  forecast?: WeatherForecast;
  ageMinutes: number;
  errorMsg?: string;
  reload: () => void;
}

/**
 * Obtiene el pronóstico con resiliencia offline-first:
 *  online + éxito  → success (y cachea)
 *  fallo de red    → caché → degraded (con antigüedad) | error
 *  offline         → caché → degraded | error{offline}
 */
export function useWeather(coords: Coordenada): WeatherResult {
  const { online } = useNetworkStatus();
  const [state, setState] = useState<Omit<WeatherResult, 'reload'>>({
    status: 'loading',
    ageMinutes: 0,
  });

  const clave = `forecast_${coords.lat}_${coords.lon}`;

  const cargar = useCallback(async () => {
    setState({ status: 'loading', ageMinutes: 0 });

    const usarCache = async (motivo?: string) => {
      const cached = await weatherCacheRepo.get<WeatherForecast>(clave);
      if (cached) {
        const age = (Date.now() - new Date(cached.fetchedAt).getTime()) / 60000;
        setState({ status: 'degraded', forecast: cached.data, ageMinutes: Math.max(0, age) });
      } else {
        setState({ status: 'error', ageMinutes: 0, errorMsg: motivo ?? 'Sin datos de clima y sin conexión' });
      }
    };

    if (!online) return usarCache('Sin conexión');

    const r = await fetchForecast(coords);
    if (isOk(r)) {
      const fetchedAt = new Date().toISOString();
      await weatherCacheRepo.set(clave, r.value, fetchedAt);
      setState({ status: 'success', forecast: r.value, ageMinutes: 0 });
    } else {
      await usarCache(mensajeWeatherError(r.error.tipo));
    }
  }, [clave, coords, online]);

  useEffect(() => {
    // Sincronización con sistemas externos (red + caché SQLite). El
    // setState('loading') inicial al montar/recargar es intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  return { ...state, reload: cargar };
}

function mensajeWeatherError(tipo: string): string {
  switch (tipo) {
    case 'timeout':
      return 'El servicio de clima tardó demasiado.';
    case 'unitMismatch':
      return 'Respuesta de clima en unidades inesperadas.';
    case 'http':
      return 'El servicio de clima respondió con error.';
    default:
      return 'No se pudo obtener el clima.';
  }
}
