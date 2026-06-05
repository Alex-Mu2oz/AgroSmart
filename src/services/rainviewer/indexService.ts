import { isOk } from '@core/result';
import { getJson } from '@services/http';
import { RAINVIEWER_INDEX, TIMEOUTS } from '@shared/config/env';

/**
 * RainViewer: el índice `weather-maps.json` da el host y los frames de radar
 * (precipitación) y de satélite (nubes, infrarrojo). Los `path` CADUCAN
 * (~10 min) → conviene refrescar. `maximumZ` ~7 (no hay tiles a escala de
 * parcela). El radar tiene cobertura limitada en Colombia; el satélite tiene
 * cobertura casi global y se ve de forma confiable sobre la zona.
 */
interface RainViewerDTO {
  host: string;
  radar?: { past?: { time: number; path: string }[]; nowcast?: { time: number; path: string }[] };
  satellite?: { infrared?: { time: number; path: string }[] };
}

export interface RainViewerLayers {
  /** Tiles de precipitación (lluvia). Null si no hay frames. */
  radarUrl: string | null;
  /** Tiles de nubes/satélite infrarrojo. Null si no hay frames. */
  satelliteUrl: string | null;
  /** Identificador del frame más reciente (para refrescar). */
  frameKey: string;
}

function ultimo(frames?: { time: number; path: string }[]): { time: number; path: string } | undefined {
  return frames && frames.length ? frames[frames.length - 1] : undefined;
}

export async function fetchRainViewerLayer(): Promise<RainViewerLayers | null> {
  const r = await getJson<RainViewerDTO>(RAINVIEWER_INDEX, { timeoutMs: TIMEOUTS.rainviewer, retries: 1 });
  if (!isOk(r)) return null;

  const { host, radar, satellite } = r.value;
  if (!host) return null;

  const radarFrame = ultimo([...(radar?.past ?? []), ...(radar?.nowcast ?? [])]);
  const satFrame = ultimo(satellite?.infrared);

  // Patrón de tiles: {host}{path}/{size}/{z}/{x}/{y}/{color}/{options}.png
  const radarUrl = radarFrame ? `${host}${radarFrame.path}/256/{z}/{x}/{y}/2/1_1.png` : null;
  // Satélite infrarrojo: color 0, opciones 0_0.
  const satelliteUrl = satFrame ? `${host}${satFrame.path}/256/{z}/{x}/{y}/0/0_0.png` : null;

  if (!radarUrl && !satelliteUrl) return null;

  return {
    radarUrl,
    satelliteUrl,
    frameKey: String(radarFrame?.time ?? satFrame?.time ?? ''),
  };
}
