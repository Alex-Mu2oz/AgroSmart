import { isOk } from '@core/result';
import { getJson } from '@services/http';
import { RAINVIEWER_INDEX, TIMEOUTS } from '@shared/config/env';

/**
 * RainViewer: el índice `weather-maps.json` da el host y los frames de radar.
 * Los `path` CADUCAN (~10 min) → hay que refrescar el índice periódicamente y
 * actualizar la `key` del <UrlTile>. `maximumZ` es ~7 (no hay tiles a escala
 * de parcela). Si el índice falla, se oculta la capa (mapa base permanece).
 */
interface RainViewerDTO {
  host: string;
  radar?: { past?: { time: number; path: string }[]; nowcast?: { time: number; path: string }[] };
}

export interface RainViewerLayer {
  /** Plantilla de URL lista para <UrlTile urlTemplate=...>. */
  urlTemplate: string;
  /** Identificador del frame (para forzar remount del tile al cambiar). */
  frameKey: string;
  maximumZ: number;
}

export async function fetchRainViewerLayer(): Promise<RainViewerLayer | null> {
  const r = await getJson<RainViewerDTO>(RAINVIEWER_INDEX, { timeoutMs: TIMEOUTS.rainviewer, retries: 1 });
  if (!isOk(r)) return null;

  const { host, radar } = r.value;
  const frames = [...(radar?.past ?? []), ...(radar?.nowcast ?? [])];
  const ultimo = frames[frames.length - 1];
  if (!host || !ultimo) return null;

  // {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
  // size=256, color=2 (Universal Blue), options=1_1 (smooth + snow)
  return {
    urlTemplate: `${host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`,
    frameKey: String(ultimo.time),
    maximumZ: 7,
  };
}
